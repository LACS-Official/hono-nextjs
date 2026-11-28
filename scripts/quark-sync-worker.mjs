#!/usr/bin/env node
/**
 * 夸克网盘归档执行器（部署在自建服务器，Node.js 18+，零第三方依赖）
 *
 * 流程：
 *   1. 轮询 API 领取待上传任务（/api/cron/quark-sync）
 *   2. 下载 GitHub Release 安装包，校验 MD5
 *   3. 调用本机夸克 CLI：建 ADMT/版本号 目录 → 上传 → 生成永久公开分享链接
 *   4. 回传分享链接与文件 FID，API 写回 downloadLinks.quark
 *
 * 凭证说明：
 *   - 本脚本不接触 GitHub Token，安装包为公开 Release 资产
 *   - 夸克授权由本机 quark-drive.cjs 的本地配置提供，不经过 API
 *
 * 用法：
 *   node scripts/quark-sync-worker.mjs --once     # 只跑一轮
 *   node scripts/quark-sync-worker.mjs            # 常驻轮询
 */

import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs'
import { join, resolve, basename } from 'node:path'
import { spawn } from 'node:child_process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

// ---------- 配置（全部可通过环境变量覆盖）----------
const CONFIG = {
  apiBase: (process.env.QUARK_API_BASE || 'https://admin.lacs.cc').replace(/\/$/, ''),
  cronSecret: process.env.QUARK_CRON_SECRET || process.env.CRON_SECRET || '',
  cliPath: process.env.QUARK_CLI_PATH || '',
  rootFid: process.env.QUARK_ROOT_FID || '0',
  downloadDir: process.env.QUARK_DOWNLOAD_DIR || '/tmp/admt-quark-sync',
  pollMs: Number(process.env.QUARK_POLL_INTERVAL_MS || 10 * 60 * 1000),
  shareTitlePrefix: process.env.QUARK_SHARE_TITLE_PREFIX || 'ADMT',
  sessionInput: process.env.QUARK_SESSION_INPUT || '自动归档 ADMT 安装包',
}

const RUN_ONCE = process.argv.includes('--once')

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args)
}

function failExit(msg) {
  console.error(`[FATAL] ${msg}`)
  process.exit(1)
}

if (!CONFIG.cronSecret) failExit('缺少 QUARK_CRON_SECRET（与 API 后台 Cron Secret 一致）')
if (!CONFIG.cliPath || !existsSync(CONFIG.cliPath)) {
  failExit('缺少 QUARK_CLI_PATH 或文件不存在（指向服务器上的 quark-drive.cjs）')
}
mkdirSync(CONFIG.downloadDir, { recursive: true })

let sessionId = `${Math.floor(Date.now() / 1000)}-${Math.random().toString(36).slice(2, 8)}`

// ---------- API 调用 ----------
async function apiGetTasks() {
  const url = `${CONFIG.apiBase}/api/cron/quark-sync?token=${encodeURIComponent(CONFIG.cronSecret)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `API 返回 ${res.status}`)
  return data
}

async function apiPost(payload) {
  const url = `${CONFIG.apiBase}/api/cron/quark-sync?token=${encodeURIComponent(CONFIG.cronSecret)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || `API 回执返回 ${res.status}`)
  return data
}

// ---------- 夸克 CLI 封装 ----------
function runCli(args) {
  return new Promise((resolve, reject) => {
    const fullArgs = [
      CONFIG.cliPath,
      ...args,
      '--session-input', CONFIG.sessionInput,
      '--session-id', sessionId,
    ]
    const child = spawn(process.execPath, fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text
      // 转发进度行，便于观察
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        try {
          const obj = JSON.parse(line)
          if (obj.type === 'progress') {
            process.stdout.write(`\r  上传进度 ${obj.data?.percent ?? 0}%`)
          }
        } catch { /* 忽略非 JSON 行 */ }
      }
    })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`CLI 退出码 ${code}: ${stderr.slice(-500)}`))
      const lines = stdout.split('\n').filter((l) => l.trim().startsWith('{'))
      const results = []
      for (const line of lines) {
        try { results.push(JSON.parse(line)) } catch { /* skip */ }
      }
      const final = [...results].reverse().find((o) => o.type === 'result')
      if (!final) return reject(new Error(`CLI 未返回结果: ${stdout.slice(-500)}`))
      if (final.code !== 0) return reject(new Error(`${final.msg || 'CLI 失败'} (code=${final.code})`))
      resolve({ ...final, _lines: results })
    })
  })
}

function parseFid(result) {
  const fid = result?.data?.fid
  if (!fid) throw new Error('CLI 未返回目录 FID')
  return String(fid)
}

/** 上传后从 list 行提取 fileName -> fid 映射 */
function parseUploadFids(results) {
  const map = {}
  for (const line of results) {
    if (line.type === 'list' && line.code === 0 && line.data?.fileName && line.data?.fileId) {
      map[line.data.fileName] = String(line.data.fileId)
    }
  }
  return map
}

// ---------- 下载与 MD5 ----------
async function downloadAndVerify(file, destDir) {
  const dest = join(destDir, basename(file.name))
  log(`  下载 ${file.name} (${(file.size / 1048576).toFixed(1)} MB)`)
  const res = await fetch(file.downloadUrl, { redirect: 'follow' })
  if (!res.ok || !res.body) throw new Error(`下载失败 ${file.name}: HTTP ${res.status}`)

  const hash = createHash('md5')
  await pipeline(
    Readable.fromWeb(res.body),
    async function* (source) {
      for await (const chunk of source) {
        hash.update(chunk)
        yield chunk
      }
    },
    createWriteStream(dest)
  )
  const md5 = hash.digest('hex')
  if (file.md5 && md5 !== file.md5.toLowerCase()) {
    rmSync(dest, { force: true })
    throw new Error(`MD5 校验失败 ${file.name}: 期望 ${file.md5}, 实际 ${md5}`)
  }
  log(`  MD5 通过 ${file.name}`)
  return dest
}

// ---------- 单个任务处理 ----------
async function processTask(task) {
  log(`领取任务: ${task.softwareName} ${task.version} → ${task.targetFolder} (${task.files.length} 个文件)`)

  const claimed = await apiPost({ action: 'claim', versionId: task.versionId })
  if (!claimed.success) {
    log(`  跳过: ${claimed.reason || '领取失败'}`)
    return false
  }

  const tmpDir = join(CONFIG.downloadDir, `v${task.versionId}-${Date.now()}`)
  mkdirSync(tmpDir, { recursive: true })

  try {
    const localFiles = []
    for (const file of task.files) {
      localFiles.push(await downloadAndVerify(file, tmpDir))
    }

    // 建根目录 ADMT（幂等）与版本子目录
    const rootResult = await runCli([
      'create-folder', '--dir-path', CONFIG.shareTitlePrefix, '--parent-fid', CONFIG.rootFid,
    ])
    const rootFid = parseFid(rootResult)
    const versionResult = await runCli([
      'create-folder', '--dir-path', task.version, '--parent-fid', rootFid,
    ])
    const versionFid = parseFid(versionResult)
    log(`  网盘目录 FID: ${versionFid}`)

    // 上传全部安装包
    log('  开始上传...')
    const uploadResult = await runCli(['upload', ...localFiles, '--parent-fid', versionFid])
    const fidMap = parseUploadFids(uploadResult._lines || [])

    // 兜底：CLI 未输出逐文件 list 行时，按 fileNames/fids 顺序对应
    if (Object.keys(fidMap).length === 0) {
      const names = uploadResult.data?.fileNames || localFiles.map((p) => basename(p))
      const fids = uploadResult.data?.fids || []
      names.forEach((name, i) => { if (fids[i]) fidMap[name] = String(fids[i]) })
    }
    if (Object.keys(fidMap).length === 0) throw new Error('上传后未获取到任何文件 FID')

    // 生成永久公开分享链接
    const allFids = Object.values(fidMap)
    const shareResult = await runCli([
      'share', ...allFids,
      '--title', `${CONFIG.shareTitlePrefix} ${task.version}`,
      '--url-type', '1',
      '--expired-type', '1',
    ])
    const shareUrl = shareResult.data?.share_url
    if (!shareUrl) throw new Error('分享接口未返回 share_url')

    await apiPost({
      action: 'complete',
      versionId: task.versionId,
      shareUrl,
      fids: fidMap,
      targetFolder: task.targetFolder,
    })
    log(`  完成: ${shareUrl}`)
    return true
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log(`  失败: ${message}`)
    try {
      await apiPost({ action: 'fail', versionId: task.versionId, error: message })
    } catch (reportErr) {
      log(`  回执失败状态也失败: ${reportErr instanceof Error ? reportErr.message : reportErr}`)
    }
    return false
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}

async function runOnce() {
  try {
    const { tasks, scanned, skipped } = await apiGetTasks()
    log(`扫描 ${scanned} 个软件，待上传 ${tasks.length} 个任务`)
    for (const note of skipped || []) log(`  跳过: ${note}`)
    for (const task of tasks) {
      await processTask(task)
    }
  } catch (err) {
    log(`轮询失败: ${err instanceof Error ? err.message : err}`)
  }
}

async function main() {
  log(`启动夸克归档执行器 (API=${CONFIG.apiBase}, CLI=${CONFIG.cliPath})`)
  await runOnce()
  if (RUN_ONCE) return
  log(`常驻模式，每 ${Math.round(CONFIG.pollMs / 60000)} 分钟轮询一次`)
  setInterval(runOnce, CONFIG.pollMs).unref()
  // 保持进程存活
  await new Promise(() => {})
}

main().catch((err) => {
  console.error('[FATAL]', err)
  process.exit(1)
})

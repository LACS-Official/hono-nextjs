/**
 * 夸克网盘归档调度
 *
 * 职责边界（重要）：
 * - Vercel 端只做「调度 + 状态记录」，不下载、不上传、不保存任何夸克凭证
 * - 实际下载/上传由自建服务器上的 quark-sync-worker 执行
 * - 任务清单来源：GitHub Release 的 checksums.json（由 admt 发版脚本生成）
 * - 任务状态存于 software_version_history.metadata.quarkSync（无需数据库迁移）
 */

import { eq, and } from 'drizzle-orm'
import { unifiedDb as db, software, softwareVersionHistory } from '@/lib/unified-db-connection'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'
import { normalizeVersion } from '@/lib/github-sync'

const CLAIM_TIMEOUT_MS = 30 * 60 * 1000 // 领取后 30 分钟未完成视为僵尸任务，可重新领取
const MAX_ATTEMPTS = 5

export interface QuarkSyncFile {
  name: string
  md5: string
  size: number
  downloadUrl: string
}

export interface QuarkSyncTask {
  versionId: number
  softwareId: number
  softwareName: string
  version: string
  tag: string
  repo: string
  targetFolder: string
  files: QuarkSyncFile[]
  attempts: number
  status: 'pending' | 'failed'
}

interface QuarkSyncState {
  status: 'pending' | 'uploading' | 'done' | 'failed'
  version: string
  tag: string
  repo: string
  targetFolder: string
  files: Array<{ name: string; md5: string; size: number }>
  shareUrl?: string
  fids?: Record<string, string>
  claimedAt?: string
  updatedAt?: string
  error?: string
  attempts?: number
}

/** 只处理白名单仓库；未配置时处理全部关联 GitHub 的软件 */
function allowedRepos(): string[] {
  return (process.env.QUARK_SYNC_REPOS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

/** 网盘根目录名（ADMT/版本号）；未配置时用软件名 */
function folderPrefix(softwareName: string): string {
  return (process.env.QUARK_SYNC_FOLDER_PREFIX || '').trim() || softwareName
}

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim()
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'LACS-API-QuarkSync/1.0',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** 从 checksums.json 读取最新版本待上传清单 */
async function fetchChecksumManifest(repo: string): Promise<{
  version: string
  tag: string
  files: Array<{ name: string; md5: string; size: number }>
} | null> {
  const url = `https://github.com/${repo}/releases/latest/download/checksums.json`
  try {
    const res = await fetch(url, {
      headers: githubHeaders(),
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const version = normalizeVersion(data.version || data.tag || '')
    const tag = data.tag || (data.version ? `v${data.version}` : '')
    const rawFiles = data.files || {}
    const files = Object.entries(rawFiles)
      .filter(([, v]: [string, any]) => v && typeof v.md5 === 'string')
      .map(([name, v]: [string, any]) => ({
        name,
        md5: v.md5,
        size: Number(v.size) || 0,
      }))
    if (!version || !tag || files.length === 0) return null
    return { version, tag, files }
  } catch (err) {
    console.warn('[QUARK_SYNC] 读取 checksums.json 失败:', repo, (err as any)?.message || err)
    return null
  }
}

/** 扫描出所有待上传任务（GET 接口调用） */
export async function listQuarkSyncTasks(): Promise<{
  tasks: QuarkSyncTask[]
  scanned: number
  skipped: string[]
}> {
  await initSystemConfigFromDb()
  const allSoftware = await db.select().from(software)
  const whitelist = allowedRepos()
  const tasks: QuarkSyncTask[] = []
  const skipped: string[] = []
  let scanned = 0

  for (const item of allSoftware) {
    const meta = (item.metadata as Record<string, any>) || {}
    const repo = typeof meta?.github?.repo === 'string' ? meta.github.repo.trim() : ''
    if (!repo) continue
    if (whitelist.length > 0 && !whitelist.includes(repo.toLowerCase())) continue

    scanned++
    const manifest = await fetchChecksumManifest(repo)
    if (!manifest) {
      skipped.push(`${repo}: 无 checksums.json 或清单为空`)
      continue
    }

    // 只处理 DB 中已同步该版本的记录（版本同步 cron 会先入库）
    const [versionRow] = await db
      .select()
      .from(softwareVersionHistory)
      .where(
        and(
          eq(softwareVersionHistory.softwareId, item.id),
          eq(softwareVersionHistory.version, manifest.version)
        )
      )
      .limit(1)

    if (!versionRow) {
      skipped.push(`${repo} ${manifest.version}: 数据库中尚无该版本，等待版本同步`)
      continue
    }

    const state = ((versionRow.metadata as Record<string, any>) || {}).quarkSync as QuarkSyncState | undefined
    if (state?.status === 'done') continue
    if (state?.status === 'uploading') {
      const claimedAt = state.claimedAt ? Date.parse(state.claimedAt) : 0
      if (Date.now() - claimedAt < CLAIM_TIMEOUT_MS) continue
    }
    if ((state?.attempts || 0) >= MAX_ATTEMPTS) {
      skipped.push(`${repo} ${manifest.version}: 失败次数已达上限 ${MAX_ATTEMPTS}`)
      continue
    }

    const targetFolder = `${folderPrefix(item.name)}/${manifest.version}`
    tasks.push({
      versionId: versionRow.id,
      softwareId: item.id,
      softwareName: item.name,
      version: manifest.version,
      tag: manifest.tag,
      repo,
      targetFolder,
      files: manifest.files.map((f) => ({
        ...f,
        downloadUrl: `https://github.com/${repo}/releases/download/${encodeURIComponent(manifest.tag)}/${encodeURIComponent(f.name)}`,
      })),
      attempts: state?.attempts || 0,
      status: state?.status === 'failed' ? 'failed' : 'pending',
    })
  }

  return { tasks, scanned, skipped }
}

async function readState(versionId: number): Promise<{
  metadata: Record<string, any>
  state: QuarkSyncState | undefined
  links: Record<string, any>
}> {
  const [row] = await db
    .select()
    .from(softwareVersionHistory)
    .where(eq(softwareVersionHistory.id, versionId))
    .limit(1)
  if (!row) throw new Error(`版本号 ID ${versionId} 不存在`)
  return {
    metadata: ((row.metadata as Record<string, any>) || {}),
    state: ((row.metadata as Record<string, any>) || {}).quarkSync as QuarkSyncState | undefined,
    links: ((row.downloadLinks as Record<string, any>) || {}),
  }
}

/** 领取任务：标记 uploading，避免多个执行器重复上传 */
export async function claimQuarkSyncTask(versionId: number): Promise<{ ok: boolean; reason?: string }> {
  const { metadata, state } = await readState(versionId)
  if (state?.status === 'done') return { ok: false, reason: '该版本已归档完成' }
  if (state?.status === 'uploading') {
    const claimedAt = state.claimedAt ? Date.parse(state.claimedAt) : 0
    if (Date.now() - claimedAt < CLAIM_TIMEOUT_MS) return { ok: false, reason: '任务已被其他执行器领取' }
  }
  await db
    .update(softwareVersionHistory)
    .set({
      metadata: {
        ...metadata,
        quarkSync: { ...(state || {}), status: 'uploading', claimedAt: new Date().toISOString() },
      },
      updatedAt: new Date(),
    })
    .where(eq(softwareVersionHistory.id, versionId))
  return { ok: true }
}

/** 上传完成：写回分享链接与文件 FID */
export async function completeQuarkSyncTask(
  versionId: number,
  payload: { shareUrl: string; fids?: Record<string, string>; targetFolder?: string }
): Promise<void> {
  const { metadata, state, links } = await readState(versionId)
  if (!payload.shareUrl || !/^https?:\/\//.test(payload.shareUrl)) {
    throw new Error('shareUrl 无效')
  }
  await db
    .update(softwareVersionHistory)
    .set({
      metadata: {
        ...metadata,
        quarkSync: {
          ...(state || {}),
          status: 'done',
          shareUrl: payload.shareUrl,
          fids: payload.fids || {},
          targetFolder: payload.targetFolder || state?.targetFolder,
          updatedAt: new Date().toISOString(),
          error: undefined,
        },
      },
      downloadLinks: { ...links, quark: payload.shareUrl },
      updatedAt: new Date(),
    })
    .where(eq(softwareVersionHistory.id, versionId))
}

/** 上传失败：累加次数并记录原因，便于下次重试 */
export async function failQuarkSyncTask(versionId: number, error: string): Promise<void> {
  const { metadata, state } = await readState(versionId)
  await db
    .update(softwareVersionHistory)
    .set({
      metadata: {
        ...metadata,
        quarkSync: {
          ...(state || {}),
          status: 'failed',
          attempts: (state?.attempts || 0) + 1,
          error: String(error || '未知错误').slice(0, 1000),
          updatedAt: new Date().toISOString(),
        },
      },
      updatedAt: new Date(),
    })
    .where(eq(softwareVersionHistory.id, versionId))
}

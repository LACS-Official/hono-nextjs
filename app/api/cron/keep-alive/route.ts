export const dynamic = 'force-dynamic'

/**
 * Supabase 免费版保活端点
 *
 * 背景：Supabase Free 项目在连续 7 天缺少「用户数据库活动」时会自动暂停。
 * 本端点通过 PostgREST（HTTPS）对项目发起一次真实的数据库查询，产生官方认可的
 * 活动信号，从而在无需升级付费计划的前提下避免被暂停。
 *
 * 调用方：1Panel / Linux crontab / Vercel Cron / 管理后台
 * 鉴权：与 /api/cron/github-sync 完全一致（Cron Secret / API Key / Vercel Cron / 管理员会话）
 * 告警：探针失败时复用项目现有 Webhook 通道（钉钉/企微/飞书/自定义）推送
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'
import {
  sendWebhookNotification,
  WebhookPlatform,
  getWebhookConfig,
} from '@/lib/webhook-service'
import { handleOptions } from '@/lib/cors'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

interface CronAuthResult {
  authorized: boolean
  authType?: 'cron_secret' | 'api_key' | 'vercel_cron' | 'admin_session'
  error?: string
  notice?: string
}

/**
 * 校验定时任务访问权限（逻辑与 github-sync 保持一致，确保统一的鉴权口径）
 * 1. 外部定时调度 (1Panel / Linux crontab / cURL):
 *    - Query:  ?token=xxx / ?secret=xxx / ?cron_secret=xxx / ?key=xxx
 *    - Header: Authorization: Bearer xxx / X-Cron-Secret: xxx / X-API-Key: xxx
 * 2. Vercel Cron 原生调度: Header x-vercel-cron === 'true'
 * 3. 管理后台已登录管理员: Session Cookie
 */
async function verifyCronAuth(request: NextRequest): Promise<CronAuthResult> {
  await initSystemConfigFromDb()
  const cronSecret = process.env.CRON_SECRET?.trim()
  const apiKey = process.env.API_KEY?.trim()

  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : null
  const xCronSecret = request.headers.get('X-Cron-Secret')?.trim()
  const xApiKey = request.headers.get('X-API-Key')?.trim()

  const searchParams = request.nextUrl.searchParams
  const queryToken = (
    searchParams.get('token') ||
    searchParams.get('secret') ||
    searchParams.get('cron_secret') ||
    searchParams.get('key')
  )?.trim()

  const incomingToken = bearerToken || xCronSecret || xApiKey || queryToken

  if (incomingToken) {
    if (cronSecret && incomingToken === cronSecret) {
      return { authorized: true, authType: 'cron_secret' }
    }
    if (apiKey && incomingToken === apiKey) {
      return { authorized: true, authType: 'api_key' }
    }
    return {
      authorized: false,
      error: '凭证无效：传入的密钥与「计划任务同步密钥 (Cron Secret)」不匹配，已被系统拦截。',
    }
  }

  if (request.headers.get('x-vercel-cron') === 'true') {
    return { authorized: true, authType: 'vercel_cron' }
  }

  const adminAuth = await authenticateRequest(request)
  if (adminAuth.success && adminAuth.user && isAuthorizedAdmin(adminAuth.user)) {
    return {
      authorized: true,
      authType: 'admin_session',
      notice: cronSecret
        ? '本次通过管理员会话鉴权；外部定时任务请附带 ?token=YOUR_CRON_SECRET 或 Authorization: Bearer YOUR_CRON_SECRET。'
        : '当前未配置 Cron Secret，仅管理员可手动触发；如需外部调度请在系统设置中配置。',
    }
  }

  return {
    authorized: false,
    error: cronSecret
      ? '未授权访问：外部定时任务请附带正确的凭证参数 (?token=YOUR_CRON_SECRET) 或 Header Authorization: Bearer YOUR_CRON_SECRET'
      : '未授权访问：请在管理后台「系统设置」中配置「计划任务同步密钥 (Cron Secret)」后再调度。',
  }
}

interface ProbeResult {
  table: string
  reachable: boolean
  rowCount: number | null
  durationMs: number
  detail?: string
}

/**
 * 对 Supabase 发起真实数据库查询（PostgREST HTTPS 协议）
 * 使用 head 模式只取 count，不传输行数据，开销极低但会在数据库侧产生真实查询。
 */
async function probeSupabase(): Promise<ProbeResult[]> {
  const probes: ProbeResult[] = []
  // system_settings 为项目常驻表；若表结构变更导致查询报错，只要 PostgREST 有响应即视为项目在线
  const tables = ['system_settings', 'login_logs']

  for (const table of tables) {
    const start = Date.now()
    try {
      const { count, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true })

      if (!error) {
        probes.push({
          table,
          reachable: true,
          rowCount: count ?? null,
          durationMs: Date.now() - start,
        })
        continue
      }

      // 表不存在/无权限等属于「数据库已响应」的情况，仍能构成有效活动信号
      const code = (error as any)?.code || ''
      const message = error.message || ''
      const respondedByDb =
        code === 'PGRST205' ||
        /could not find the table|relation .* does not exist|permission denied|schema cache/i.test(
          message
        )

      probes.push({
        table,
        reachable: respondedByDb,
        rowCount: null,
        durationMs: Date.now() - start,
        detail: respondedByDb
          ? `查询返回提示（数据库仍在线）: ${message}`
          : `查询失败: ${message}`,
      })
    } catch (err: any) {
      probes.push({
        table,
        reachable: false,
        rowCount: null,
        durationMs: Date.now() - start,
        detail: `网络/连接异常: ${err?.message || '未知错误'}`,
      })
    }
  }

  return probes
}

/**
 * 失败时通过现有 Webhook 通道推送告警
 */
async function sendKeepAliveAlert(content: string, fields: Record<string, string | number>) {
  try {
    const config = getWebhookConfig()
    if (!config.enabled || !config.url) {
      return { sent: false, reason: 'Webhook 未启用或未配置地址' }
    }

    const result = await sendWebhookNotification({
      event: 'system_error',
      title: '【保活告警】Supabase 项目连接异常',
      content,
      fields,
      customConfig: {
        enabled: config.enabled,
        url: config.url,
        secret: config.secret,
        platform: config.platform as WebhookPlatform,
        events: config.events,
      },
    })
    return {
      sent: result.success,
      reason: result.success ? undefined : result.error,
      durationMs: result.durationMs,
    }
  } catch (error: any) {
    return { sent: false, reason: error?.message || '告警发送异常' }
  }
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  try {
    const authResult = await verifyCronAuth(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || '未授权访问：拒绝执行保活任务',
          code: 401,
        },
        { status: 401 }
      )
    }

    const probes = await probeSupabase()
    const anyReachable = probes.some((p) => p.reachable)
    const totalDurationMs = Date.now() - startedAt
    const timestamp = new Date().toISOString()
    const beijingTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    if (!anyReachable) {
      const alert = await sendKeepAliveAlert(
        '保活探针无法连接 Supabase 数据库，项目可能已被暂停或网络异常。请登录 Supabase Dashboard 确认项目状态（暂停后 1 年内可一键恢复，数据不丢失）。',
        {
          '触发时间': beijingTime,
          '鉴权方式': authResult.authType || 'unknown',
          '探针结果': probes.map((p) => `${p.table}: ${p.detail || '不可达'}`).join(' | '),
          '耗时': `${totalDurationMs}ms`,
        }
      )
      console.error('[CRON_KEEP_ALIVE] 保活探针失败:', JSON.stringify(probes))
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase 保活探针失败：所有数据库查询均不可达',
          code: 503,
          timestamp,
          authType: authResult.authType,
          probes,
          durationMs: totalDurationMs,
          alert,
        },
        { status: 500 }
      )
    }

    // 可选：?alert=1 时成功也推送一条通知，用于验证告警通道连通性
    let testAlert: Awaited<ReturnType<typeof sendKeepAliveAlert>> | undefined
    if (request.nextUrl.searchParams.get('alert') === '1') {
      testAlert = await sendKeepAliveAlert('这是一条保活成功后的通道测试通知，收到即表示告警链路正常。', {
        '触发时间': beijingTime,
        '鉴权方式': authResult.authType || 'unknown',
        '探针结果': probes.map((p) => `${p.table}: ${p.reachable ? '正常' : p.detail}`).join(' | '),
        '耗时': `${totalDurationMs}ms`,
      })
    }

    const host = request.headers.get('host') || 'admin.lacs.cc'
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const secretHint = 'YOUR_CRON_SECRET'

    return NextResponse.json({
      success: true,
      message: '保活成功：Supabase 数据库已收到真实查询请求，项目将保持活跃状态。',
      code: 200,
      timestamp,
      authType: authResult.authType,
      probes,
      durationMs: totalDurationMs,
      host,
      suggestions: {
        frequency: '每 6 小时执行一次（每天 4 次）已足够避免免费版暂停，无需高频调用。',
        onePanelCommand: `curl -sS -H "Authorization: Bearer ${secretHint}" "${protocol}://${host}/api/cron/keep-alive"`,
        queryCommand: `curl -sS "${protocol}://${host}/api/cron/keep-alive?token=${secretHint}"`,
        crontabExample: `0 */6 * * * curl -sS -H "Authorization: Bearer ${secretHint}" "${protocol}://${host}/api/cron/keep-alive" >> /var/log/supabase-keepalive.log 2>&1`,
        verifyAlertChannel: `在 URL 后追加 ?alert=1 可主动推送一条测试告警，验证 Webhook 通道是否正常。`,
      },
      ...(authResult.notice ? { notice: authResult.notice } : {}),
      ...(testAlert ? { testAlert } : {}),
    })
  } catch (error: any) {
    console.error('[CRON_KEEP_ALIVE] 执行异常:', error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '保活任务执行过程中发生内部错误',
        code: 500,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

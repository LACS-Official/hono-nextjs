export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { syncAllGithubSoftware } from '@/lib/github-sync'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'

interface CronAuthResult {
  authorized: boolean
  authType?: 'cron_secret' | 'api_key' | 'vercel_cron' | 'admin_session'
  error?: string
  notice?: string
}

/**
 * 校验定时任务访问权限
 * 1. 外部定时调度 (1Panel / Linux crontab / cURL):
 *    - Query 参数: ?token=xxx 或 ?secret=xxx 或 ?cron_secret=xxx 或 ?key=xxx
 *    - Header: Authorization: Bearer xxx 或 X-Cron-Secret: xxx 或 X-API-Key: xxx
 * 2. Vercel Cron 原生调度: Header x-vercel-cron === 'true'
 * 3. 管理后台控制台发起: 校验管理员 Session Cookie
 */
async function verifyCronAuth(request: NextRequest): Promise<CronAuthResult> {
  await initSystemConfigFromDb()
  const cronSecret = process.env.CRON_SECRET?.trim()
  const apiKey = process.env.API_KEY?.trim()

  // 1. 提取传入凭证（多渠道兼容）
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
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

  // 2. 若客户端主动携带了密钥凭证，严格比对校验（防止任何人通过伪造或错误密钥调用）
  if (incomingToken) {
    if (cronSecret && incomingToken === cronSecret) {
      return { authorized: true, authType: 'cron_secret' }
    }
    if (apiKey && incomingToken === apiKey) {
      return { authorized: true, authType: 'api_key' }
    }
    return {
      authorized: false,
      error: '凭证无效：传入的密钥凭证与后台设置的「计划任务同步密钥 (Cron Secret)」不匹配，已被系统拦截。'
    }
  }

  // 3. Vercel Cron 原生自动化调度识别
  if (request.headers.get('x-vercel-cron') === 'true') {
    return { authorized: true, authType: 'vercel_cron' }
  }

  // 4. 检查是否为后台已登录的管理员在浏览器中发起（方便管理面板内部测试与手动触发）
  const adminAuth = await authenticateRequest(request)
  if (adminAuth.success && adminAuth.user && isAuthorizedAdmin(adminAuth.user)) {
    return {
      authorized: true,
      authType: 'admin_session',
      notice: cronSecret
        ? '提示：本次请求通过浏览器管理员登录态 (Cookie Session) 鉴权通过。若在 1Panel / Linux crontab 等外部定时任务中调用，必须附带 ?token=密钥 或 Authorization: Bearer 密钥。'
        : '提示：当前系统未设置 Cron Secret，仅允许登录管理员手动触发。若需外部 1Panel/crontab 调度，请在系统设置中配置 Cron Secret。'
    }
  }

  // 5. 既未提供有效密钥，也非登录管理员，严格阻断外部未授权访问
  return {
    authorized: false,
    error: cronSecret
      ? '未授权访问：外部定时任务 (1Panel / crontab) 请在请求中附带正确的凭证参数 (?token=YOUR_CRON_SECRET) 或 Header Authorization: Bearer YOUR_CRON_SECRET'
      : '未授权访问：系统已配置定时同步安全防护。请在管理后台「系统设置」中配置「计划任务同步密钥 (Cron Secret)」，并在外部定时任务调用时附带该凭据。'
  }
}

export async function GET(request: NextRequest) {
  try {
    await initSystemConfigFromDb()
    const authResult = await verifyCronAuth(request)

    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || '未授权访问：拒绝执行定时同步',
          code: 401,
        },
        { status: 401 }
      )
    }

    const result = await syncAllGithubSoftware()
    return NextResponse.json({
      success: true,
      authType: authResult.authType,
      authNotice: authResult.notice,
      timestamp: new Date().toISOString(),
      ...result,
      totalSoftware: result.total,
      syncedSoftware: result.successCount,
      totalVersionsAdded: result.newVersionsCount,
    })
  } catch (error: any) {
    console.error('[CRON_GITHUB_SYNC] 执行异常:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '执行 GitHub 批量自动同步失败',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}

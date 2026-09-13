export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { syncAllGithubSoftware } from '@/lib/github-sync'
import { authenticateRequest } from '@/lib/auth'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'

/**
 * 校验定时任务访问权限
 * 1. 支持 1Panel / Linux crontab 携带的 ?token=xxx 或 Header Authorization: Bearer xxx
 * 2. 支持已登录的管理后台管理员通过 Session 发起
 * 3. 支持 Vercel Cron 自带的 Header 校验
 */
async function verifyCronAuth(request: NextRequest): Promise<boolean> {
  await initSystemConfigFromDb()
  const cronSecret = process.env.CRON_SECRET?.trim()

  // 如果未设置 CRON_SECRET，尝试检查是否为登录的管理员
  const authHeader = request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null
  const queryToken = request.nextUrl.searchParams.get('token')?.trim()
  const incomingToken = bearerToken || queryToken

  // 1. 若传入了 token 或 Bearer，优先匹配 CRON_SECRET 或 API_KEY
  const validSecrets = [process.env.CRON_SECRET, process.env.API_KEY].filter(Boolean) as string[]
  if (validSecrets.length > 0 && incomingToken) {
    if (validSecrets.includes(incomingToken)) return true
  }

  // 2. Vercel Cron 原生调度识别
  if (request.headers.get('x-vercel-cron') === 'true') {
    return true
  }

  // 3. 检查是否为后台已登录管理员发起
  const adminAuth = await authenticateRequest(request)
  if (adminAuth.success && adminAuth.user) {
    return true
  }

  // 4. 若未配置 CRON_SECRET，且没有管理员认证，出于安全考虑拒绝未经授权的外界调用
  return false
}

export async function GET(request: NextRequest) {
  try {
    await initSystemConfigFromDb()
    const isAuthorized = await verifyCronAuth(request)
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: '未授权访问：请在请求中附带正确的 ?token=凭证，或在后台配置 CRON_SECRET',
        },
        { status: 401 }
      )
    }

    const result = await syncAllGithubSoftware()
    return NextResponse.json({
      success: true,
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

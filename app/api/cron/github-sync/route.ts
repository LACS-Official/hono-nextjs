export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { syncAllGithubSoftware } from '@/lib/github-sync'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'
import { verifyCronAuth } from '@/lib/cron-auth'

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

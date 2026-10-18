export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { crashDb, clientCrashReports, ensureCrashReportsTable } from '@/lib/crash-reports-db'
import { eq, and, lt } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

/**
 * POST /api/admin/telemetry/crash/batch - 批量管理 (清理已解决错误或过期崩溃日志)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const apiKeyResult = validateApiKeyWithExpiration(request)
    const isAuthorized = (authResult.success && authResult.user && isAuthorizedAdmin(authResult.user)) || apiKeyResult.isValid

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: '未授权访问：需要管理员权限' },
        { status: 401 }
      )
    }

    await ensureCrashReportsTable()

    const body = await request.json()
    const { action, daysOld = 30 } = body

    if (action === 'clear_resolved') {
      const deleted = await crashDb
        .delete(clientCrashReports)
        .where(eq(clientCrashReports.status, 'resolved'))
        .returning({ id: clientCrashReports.id })

      return NextResponse.json({
        success: true,
        message: `已批量清空 ${deleted.length} 条已标记为解决的崩溃日志`,
        deletedCount: deleted.length
      })
    } else if (action === 'clear_old') {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      const deleted = await crashDb
        .delete(clientCrashReports)
        .where(lt(clientCrashReports.createdAt, cutoffDate))
        .returning({ id: clientCrashReports.id })

      return NextResponse.json({
        success: true,
        message: `已成功清理 ${daysOld} 天前的 ${deleted.length} 条历史崩溃日志`,
        deletedCount: deleted.length
      })
    } else {
      return NextResponse.json(
        { success: false, error: '未知操作类型，可选: clear_resolved, clear_old' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('批量清理崩溃日志失败:', error)
    return NextResponse.json(
      { success: false, error: '操作失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

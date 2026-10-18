export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { crashDb, clientCrashReports, ensureCrashReportsTable } from '@/lib/crash-reports-db'
import { eq, and, desc } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

/**
 * GET /api/admin/telemetry/crash/[id] - 获取单条日志或某个 crashHash 的所有发生记录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params
    const isHash = id.length === 32 // MD5 长度

    if (isHash) {
      // 获取该问题组下的所有崩溃记录
      const reports = await crashDb
        .select()
        .from(clientCrashReports)
        .where(eq(clientCrashReports.crashHash, id))
        .orderBy(desc(clientCrashReports.createdAt))
        .limit(50)

      return NextResponse.json({
        success: true,
        data: {
          crashHash: id,
          reports,
          count: reports.length
        }
      })
    } else {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        return NextResponse.json({ success: false, error: '无效的报告ID' }, { status: 400 })
      }

      const [report] = await crashDb
        .select()
        .from(clientCrashReports)
        .where(eq(clientCrashReports.id, numId))
        .limit(1)

      if (!report) {
        return NextResponse.json({ success: false, error: '崩溃报告不存在' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: report
      })
    }
  } catch (error: any) {
    console.error('获取崩溃报告详情失败:', error)
    return NextResponse.json(
      { success: false, error: '获取崩溃报告详情失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/telemetry/crash/[id] - 更新崩溃状态 (支持单条或按 crashHash 批量更新)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params
    const body = await request.json()
    const { status, applyToAllWithSameHash } = body

    const validStatuses = ['unresolved', 'investigating', 'resolved', 'ignored']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值，可选值: unresolved, investigating, resolved, ignored' },
        { status: 400 }
      )
    }

    const isHash = id.length === 32

    if (isHash || applyToAllWithSameHash) {
      const targetHash = isHash ? id : body.crashHash
      if (!targetHash) {
        return NextResponse.json({ success: false, error: '缺少 crashHash 参数' }, { status: 400 })
      }

      const updated = await crashDb
        .update(clientCrashReports)
        .set({ status })
        .where(eq(clientCrashReports.crashHash, targetHash))
        .returning({ id: clientCrashReports.id })

      return NextResponse.json({
        success: true,
        message: `已批量更新该问题组下的 ${updated.length} 条崩溃记录状态为 [${status}]`,
        affectedCount: updated.length
      })
    } else {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        return NextResponse.json({ success: false, error: '无效的报告ID' }, { status: 400 })
      }

      const [updated] = await crashDb
        .update(clientCrashReports)
        .set({ status })
        .where(eq(clientCrashReports.id, numId))
        .returning()

      if (!updated) {
        return NextResponse.json({ success: false, error: '崩溃报告不存在' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: `崩溃记录状态已更新为 [${status}]`,
        data: updated
      })
    }
  } catch (error: any) {
    console.error('更新崩溃报告状态失败:', error)
    return NextResponse.json(
      { success: false, error: '更新失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

export const PATCH = PUT

/**
 * DELETE /api/admin/telemetry/crash/[id] - 删除崩溃记录 (单条或整组)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id } = params
    const isHash = id.length === 32

    if (isHash) {
      const deleted = await crashDb
        .delete(clientCrashReports)
        .where(eq(clientCrashReports.crashHash, id))
        .returning({ id: clientCrashReports.id })

      return NextResponse.json({
        success: true,
        message: `已清理该问题组的全部 ${deleted.length} 条崩溃记录`,
        deletedCount: deleted.length
      })
    } else {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        return NextResponse.json({ success: false, error: '无效的报告ID' }, { status: 400 })
      }

      const deleted = await crashDb
        .delete(clientCrashReports)
        .where(eq(clientCrashReports.id, numId))
        .returning({ id: clientCrashReports.id })

      if (deleted.length === 0) {
        return NextResponse.json({ success: false, error: '记录不存在' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: '记录已成功删除',
        deletedId: numId
      })
    }
  } catch (error: any) {
    console.error('删除崩溃记录失败:', error)
    return NextResponse.json(
      { success: false, error: '删除失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

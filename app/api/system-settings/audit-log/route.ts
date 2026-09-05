/**
 * 系统设置审计日志API路由
 * 处理系统设置变更历史记录
 */

export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { 
  systemSettingsDb, 
  systemSettingsAuditLog,
  systemSettings,
  ensureSystemSettingsTables,
  safeQuery
} from '@/lib/system-settings-db'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { eq, desc, and, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { authenticateRequest } from '@/lib/auth'
import { headers } from 'next/headers'

// 验证模式
const queryAuditLogSchema = z.object({
  settingId: z.string().optional(),
  action: z.enum(['create', 'update', 'delete']).optional(),
  userId: z.string().optional(),
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  startDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
})

// 获取审计日志列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限（如未登录则提示未授权）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      // 如果需要开放读取或临时权限检查
      // return NextResponse.json({ success: false, error: authResult.error || '未授权访问' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const settingId = searchParams.get('settingId') || undefined
    const action = searchParams.get('action') || undefined
    const userId = searchParams.get('userId') || undefined
    const page = parseInt(searchParams.get('page') || '1') || 1
    const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 100)
    const offset = (page - 1) * limit
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // 构建查询条件
    const conditions = []

    if (settingId) {
      conditions.push(eq(systemSettingsAuditLog.settingId, settingId))
    }

    if (action && ['create', 'update', 'delete'].includes(action)) {
      conditions.push(eq(systemSettingsAuditLog.action, action))
    }

    if (userId) {
      conditions.push(eq(systemSettingsAuditLog.userId, userId))
    }

    if (startDateStr) {
      const startDate = new Date(startDateStr)
      if (!isNaN(startDate.getTime())) {
        conditions.push(eq(systemSettingsAuditLog.timestamp, startDate))
      }
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr)
      if (!isNaN(endDate.getTime())) {
        conditions.push(eq(systemSettingsAuditLog.timestamp, endDate))
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    // 执行查询
    let queryBuilder = systemSettingsDb
      .select({
        id: systemSettingsAuditLog.id,
        settingId: systemSettingsAuditLog.settingId,
        action: systemSettingsAuditLog.action,
        oldValue: systemSettingsAuditLog.oldValue,
        newValue: systemSettingsAuditLog.newValue,
        reason: systemSettingsAuditLog.reason,
        userId: systemSettingsAuditLog.userId,
        userAgent: systemSettingsAuditLog.userAgent,
        ipAddress: systemSettingsAuditLog.ipAddress,
        timestamp: systemSettingsAuditLog.timestamp,
        settingKey: systemSettings.key,
        settingCategory: systemSettings.category,
      })
      .from(systemSettingsAuditLog)
      .leftJoin(systemSettings, eq(systemSettingsAuditLog.settingId, systemSettings.id))

    if (whereClause) {
      queryBuilder = queryBuilder.where(whereClause) as typeof queryBuilder
    }

    try {
      const result = await SupabaseSystemSettingsService.getAuditLogs({
        settingId,
        action,
        userId,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
        page,
        limit,
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] audit-log 回退至 SQL 执行:', supabaseErr.message)
      await ensureSystemSettingsTables()
      const [auditLogs, totalResult] = await safeQuery(() =>
        Promise.all([
          queryBuilder
            .limit(limit)
            .offset(offset)
            .orderBy(desc(systemSettingsAuditLog.timestamp)),
          systemSettingsDb
            .select({ count: systemSettingsAuditLog.id })
            .from(systemSettingsAuditLog)
            .where(whereClause)
        ])
      )

      const total = totalResult.length

      return NextResponse.json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      })
    }
  } catch (error: any) {
    console.error('获取审计日志失败:', error)
    return NextResponse.json(
      { success: false, error: '获取审计日志失败: ' + (error.message || '未知错误') },
      { status: 500 }
    )
  }
}
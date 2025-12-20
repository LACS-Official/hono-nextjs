/**
 * 系统设置审计日志API路由
 * 处理系统设置变更历史记录
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  systemSettingsDb, 
  systemSettingsAuditLog,
  systemSettings
} from '@/lib/system-settings-db'
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
    // 验证用户权限
    const authResult = await authenticateRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      )
    }

    // 验证查询参数
    const { searchParams } = new URL(request.url)
    const query = queryAuditLogSchema.parse({
      settingId: searchParams.get('settingId'),
      action: searchParams.get('action'),
      userId: searchParams.get('userId'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    // 分页参数
    const page = query.page || 1
    const limit = query.limit || 20
    const offset = (page - 1) * limit

    // 构建查询条件
    let conditions = []
    
    if (query.settingId) {
      conditions.push(eq(systemSettingsAuditLog.settingId, query.settingId))
    }
    
    if (query.action) {
      conditions.push(eq(systemSettingsAuditLog.action, query.action))
    }
    
    if (query.userId) {
      conditions.push(eq(systemSettingsAuditLog.userId, query.userId))
    }
    
    if (query.startDate) {
      conditions.push(eq(systemSettingsAuditLog.timestamp, query.startDate))
    }
    
    if (query.endDate) {
      conditions.push(eq(systemSettingsAuditLog.timestamp, query.endDate))
    }

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

    // 添加条件
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder
    }
    
    const auditLogs = await queryBuilder
      .limit(limit)
      .offset(offset)
      .orderBy(desc(systemSettingsAuditLog.timestamp))

    // 获取总数
    let countQuery = systemSettingsDb
      .select({ count: systemSettingsAuditLog.id })
      .from(systemSettingsAuditLog)
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery
    }
    
    const totalResult = await countQuery
    const total = totalResult.length

    return NextResponse.json({
      success: true,
      data: {
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('获取审计日志失败:', error)
    return NextResponse.json(
      { success: false, error: '获取审计日志失败' },
      { status: 500 }
    )
  }
}
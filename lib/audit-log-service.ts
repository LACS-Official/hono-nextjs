/**
 * 审计日志服务
 * 提供系统设置变更的审计日志记录和查询功能
 */

import { 
  systemSettingsDb, 
  systemSettingsAuditLog,
  systemSettings
} from '@/lib/system-settings-db'
import { eq, desc, and, ilike, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// 审计日志操作类型
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

// 审计日志查询参数
export interface AuditLogQuery {
  settingId?: string
  action?: AuditAction
  userId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

// 审计日志创建参数
export interface CreateAuditLogParams {
  settingId: string
  action: AuditAction
  oldValue?: string | null
  newValue?: string | null
  reason?: string
  userId: string
  userAgent?: string
  ipAddress?: string
}

// 审计日志统计信息
export interface AuditLogStats {
  totalChanges: number
  changesByAction: Record<string, number>
  changesByUser: Record<string, number>
  recentChanges: number
  topModifiedSettings: Array<{
    settingId: string
    settingKey: string
    settingCategory: string
    changeCount: number
  }>
}

export class AuditLogService {
  /**
   * 创建审计日志记录
   */
  static async createLog(params: CreateAuditLogParams) {
    try {
      const auditLog = {
        id: uuidv4(),
        ...params,
        timestamp: new Date(),
      }

      await systemSettingsDb.insert(systemSettingsAuditLog).values(auditLog)
      return auditLog
    } catch (error) {
      console.error('创建审计日志失败:', error)
      throw new Error('创建审计日志失败')
    }
  }

  /**
   * 查询审计日志
   */
  static async queryLogs(query: AuditLogQuery) {
    try {
      const {
        settingId,
        action,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = query

      // 构建查询条件
      const conditions = []
      
      if (settingId) {
        conditions.push(eq(systemSettingsAuditLog.settingId, settingId))
      }
      
      if (action) {
        conditions.push(eq(systemSettingsAuditLog.action, action))
      }
      
      if (userId) {
        conditions.push(eq(systemSettingsAuditLog.userId, userId))
      }
      
      if (startDate) {
        conditions.push(eq(systemSettingsAuditLog.timestamp, startDate))
      }
      
      if (endDate) {
        conditions.push(eq(systemSettingsAuditLog.timestamp, endDate))
      }

      // 分页参数
      const offset = (page - 1) * limit

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
      
      if (conditions.length > 0) {
        queryBuilder = queryBuilder.where(and(...conditions))
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
        countQuery = countQuery.where(and(...conditions))
      }
      
      const totalResult = await countQuery
      const total = totalResult.length

      return {
        auditLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    } catch (error) {
      console.error('查询审计日志失败:', error)
      throw new Error('查询审计日志失败')
    }
  }

  /**
   * 获取审计日志统计信息
   */
  static async getStats(days: number = 30): Promise<AuditLogStats> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 总变更数
      const totalChangesResult = await systemSettingsDb
        .select({ count: systemSettingsAuditLog.id })
        .from(systemSettingsAuditLog)
        .where(eq(systemSettingsAuditLog.timestamp, startDate))
      
      const totalChanges = totalChangesResult.length

      // 按操作类型统计
      const changesByActionResult = await systemSettingsDb
        .select({
          action: systemSettingsAuditLog.action,
          count: systemSettingsAuditLog.id,
        })
        .from(systemSettingsAuditLog)
        .where(eq(systemSettingsAuditLog.timestamp, startDate))
        .groupBy(systemSettingsAuditLog.action)
      
      const changesByAction = changesByActionResult.reduce((acc, item) => {
        acc[item.action] = item.count
        return acc
      }, {} as Record<string, number>)

      // 按用户统计
      const changesByUserResult = await systemSettingsDb
        .select({
          userId: systemSettingsAuditLog.userId,
          count: systemSettingsAuditLog.id,
        })
        .from(systemSettingsAuditLog)
        .where(eq(systemSettingsAuditLog.timestamp, startDate))
        .groupBy(systemSettingsAuditLog.userId)
        .orderBy(desc(systemSettingsAuditLog.id))
        .limit(10)
      
      const changesByUser = changesByUserResult.reduce((acc, item) => {
        acc[item.userId] = item.count
        return acc
      }, {} as Record<string, number>)

      // 最近变更数（最近7天）
      const recentStartDate = new Date()
      recentStartDate.setDate(recentStartDate.getDate() - 7)
      
      const recentChangesResult = await systemSettingsDb
        .select({ count: systemSettingsAuditLog.id })
        .from(systemSettingsAuditLog)
        .where(eq(systemSettingsAuditLog.timestamp, recentStartDate))
      
      const recentChanges = recentChangesResult.length

      // 最常修改的设置
      const topModifiedSettingsResult = await systemSettingsDb
        .select({
          settingId: systemSettingsAuditLog.settingId,
          settingKey: systemSettings.key,
          settingCategory: systemSettings.category,
          changeCount: systemSettingsAuditLog.id,
        })
        .from(systemSettingsAuditLog)
        .leftJoin(systemSettings, eq(systemSettingsAuditLog.settingId, systemSettings.id))
        .where(eq(systemSettingsAuditLog.timestamp, startDate))
        .groupBy(systemSettingsAuditLog.settingId)
        .orderBy(desc(systemSettingsAuditLog.id))
        .limit(10)
      
      const topModifiedSettings = topModifiedSettingsResult.map(item => ({
        settingId: item.settingId,
        settingKey: item.settingKey || '未知',
        settingCategory: item.settingCategory || '未知',
        changeCount: item.changeCount,
      }))

      return {
        totalChanges,
        changesByAction,
        changesByUser,
        recentChanges,
        topModifiedSettings,
      }
    } catch (error) {
      console.error('获取审计日志统计失败:', error)
      throw new Error('获取审计日志统计失败')
    }
  }

  /**
   * 清理旧的审计日志
   */
  static async cleanupOldLogs(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const deletedLogs = await systemSettingsDb
        .delete(systemSettingsAuditLog)
        .where(eq(systemSettingsAuditLog.timestamp, cutoffDate))
        .returning()

      return {
        deletedCount: deletedLogs.length,
        cutoffDate,
      }
    } catch (error) {
      console.error('清理审计日志失败:', error)
      throw new Error('清理审计日志失败')
    }
  }

  /**
   * 导出审计日志
   */
  static async exportLogs(query: AuditLogQuery, format: 'json' | 'csv' = 'json') {
    try {
      const { auditLogs } = await this.queryLogs({
        ...query,
        page: 1,
        limit: 10000, // 导出时增加限制
      })

      if (format === 'csv') {
        // 转换为CSV格式
        const headers = ['时间', '设置分类', '设置键名', '操作', '旧值', '新值', '操作人', 'IP地址']
        const rows = auditLogs.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.settingCategory || '',
          log.settingKey || '',
          log.action,
          log.oldValue || '',
          log.newValue || '',
          log.userId,
          log.ipAddress || '',
        ])

        const csvContent = [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n')

        return csvContent
      } else {
        // JSON格式
        return JSON.stringify(auditLogs, null, 2)
      }
    } catch (error) {
      console.error('导出审计日志失败:', error)
      throw new Error('导出审计日志失败')
    }
  }

  /**
   * 检查设置是否有最近的变更
   */
  static async hasRecentChanges(settingId: string, hours: number = 24) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - hours)

      const recentChanges = await systemSettingsDb
        .select({ count: systemSettingsAuditLog.id })
        .from(systemSettingsAuditLog)
        .where(and(
          eq(systemSettingsAuditLog.settingId, settingId),
          eq(systemSettingsAuditLog.timestamp, cutoffDate)
        ))

      return recentChanges.length > 0
    } catch (error) {
      console.error('检查最近变更失败:', error)
      return false
    }
  }
}
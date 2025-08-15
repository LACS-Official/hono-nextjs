/**
 * 统一数据库连接配置
 * 整合所有数据库模式到单一连接
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import { lt } from 'drizzle-orm'

// 导入所有数据库模式
import * as activationCodesSchema from './activation-codes-schema'
import * as softwareSchema from './software-schema'
import * as userBehaviorSchema from './user-behavior-schema'
import * as donorsSchema from './donors-schema'
import * as websiteManagementSchema from './website-management-schema'

// 合并所有模式
const unifiedSchema = {
  ...activationCodesSchema,
  ...softwareSchema,
  ...userBehaviorSchema,
  ...donorsSchema,
  ...websiteManagementSchema,
}

// 统一数据库连接字符串
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.SOFTWARE_DATABASE_URL || 
  process.env.ACTIVATION_CODES_DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// 创建统一数据库连接
const neonSql = neon(connectionString)
export const unifiedDb = drizzle(neonSql, { schema: unifiedSchema })

// 导出具体的表引用 (向后兼容)
export const {
  // 激活码相关表
  activationCodes,

  // 软件管理相关表
  software,
  softwareVersionHistory,
  softwareAnnouncements,
  downloadStats,

  // 用户行为相关表
  softwareActivations,
  deviceConnections,
  behaviorStats,

  // 捐赠人员相关表
  donors,

  // 网站管理相关表
  websites,
  announcements,
  banners,
} = unifiedSchema

// 数据库健康检查函数
export async function checkUnifiedDbHealth(): Promise<boolean> {
  try {
    await neonSql`SELECT 1`
    return true
  } catch (error) {
    console.error('Unified database health check failed:', error)
    return false
  }
}

// 获取数据库统计信息
export async function getDatabaseStats() {
  try {
    const stats = await sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_stat_user_tables 
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `
    
    return stats
  } catch (error) {
    console.error('Failed to get database stats:', error)
    return []
  }
}

// 数据库连接池配置
export const dbConfig = {
  connectionString,
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 5000,
}

// 事务辅助函数
export async function withTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await unifiedDb.transaction(callback)
}

// 批量操作辅助函数
export async function batchInsert<T extends Record<string, any>>(
  table: any,
  data: T[],
  batchSize: number = 100
) {
  const results: any[] = []

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const result = await unifiedDb.insert(table).values(batch).returning()
    if (Array.isArray(result)) {
      results.push(...result)
    }
  }

  return results
}

// 数据库迁移状态检查
export async function checkMigrationStatus() {
  try {
    // 检查所有必要的表是否存在
    const tables = await neonSql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN (
        'activation_codes',
        'software', 'software_version_history', 'software_announcements', 'download_stats',
        'software_activations', 'device_connections', 'behavior_stats'
      )
      ORDER BY table_name
    `
    
    const expectedTables = [
      'activation_codes',
      'software', 'software_version_history', 'software_announcements', 'download_stats',
      'software_activations', 'device_connections', 'behavior_stats'
    ]
    
    const existingTables = tables.map(t => t.table_name)
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))
    
    return {
      isComplete: missingTables.length === 0,
      existingTables,
      missingTables,
      totalTables: expectedTables.length
    }
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return {
      isComplete: false,
      existingTables: [],
      missingTables: [],
      totalTables: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 数据库清理函数
export async function cleanupDatabase(options: {
  cleanExpiredCodes?: boolean
  cleanOldStats?: boolean
  daysOld?: number
} = {}) {
  const { cleanExpiredCodes = true, cleanOldStats = true, daysOld = 30 } = options
  
  const results = {
    expiredCodes: 0,
    oldStats: 0,
    errors: [] as string[]
  }
  
  try {
    if (cleanExpiredCodes) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const expiredResult = await unifiedDb
        .delete(activationCodes)
        .where(lt(activationCodes.expiresAt, cutoffDate))
        .returning()

      results.expiredCodes = expiredResult.length
    }
    
    if (cleanOldStats && behaviorStats) {
      const oldStatsResult = await unifiedDb
        .delete(behaviorStats)
        .where(sql`created_at < NOW() - INTERVAL '${daysOld} days'`)
        .returning()
      
      results.oldStats = oldStatsResult.length
    }
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }
  
  return results
}

// 导出默认连接 (向后兼容)
export default unifiedDb

// 类型导出
export type UnifiedDatabase = typeof unifiedDb
export type DatabaseStats = Awaited<ReturnType<typeof getDatabaseStats>>
export type MigrationStatus = Awaited<ReturnType<typeof checkMigrationStatus>>

// 连接状态监控
let connectionStatus = {
  isConnected: false,
  lastCheck: new Date(),
  consecutiveFailures: 0
}

// 定期健康检查
setInterval(async () => {
  const isHealthy = await checkUnifiedDbHealth()
  
  if (isHealthy) {
    connectionStatus.isConnected = true
    connectionStatus.consecutiveFailures = 0
  } else {
    connectionStatus.isConnected = false
    connectionStatus.consecutiveFailures++
  }
  
  connectionStatus.lastCheck = new Date()
  
  // 如果连续失败超过3次，记录警告
  if (connectionStatus.consecutiveFailures >= 3) {
    console.warn(`Database connection unstable: ${connectionStatus.consecutiveFailures} consecutive failures`)
  }
}, 60000) // 每分钟检查一次

export { connectionStatus }

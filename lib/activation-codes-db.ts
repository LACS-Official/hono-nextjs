import '@/lib/dev-proxy'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { sql } from 'drizzle-orm'
import * as activationCodesSchema from './activation-codes-schema'

// 激活码专用数据库连接字符串
const activationCodesConnectionString = 
  process.env.ACTIVATION_CODES_DATABASE_URL || 
  process.env.DATABASE_URL

if (!activationCodesConnectionString) {
  throw new Error('ACTIVATION_CODES_DATABASE_URL environment variable is required')
}

// 创建统一的 Neon HTTP 连接
const neonSql = neon(activationCodesConnectionString)

export const activationCodesDb = drizzle(neonSql, { 
  schema: activationCodesSchema 
})

// 导出具体的表引用
export const { activationCodes } = activationCodesSchema

// 数据库健康检查函数
export async function checkActivationCodesDbHealth(): Promise<boolean> {
  try {
    await neonSql`SELECT 1`
    return true
  } catch (error) {
    console.error('Activation codes database health check failed:', error)
    return false
  }
}

// 事务辅助函数
export async function withActivationCodeTransaction<T>(
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await activationCodesDb.transaction(callback)
}

// 批量操作辅助函数
export async function batchInsertActivationCodes<T extends Record<string, any>>(
  data: T[],
  batchSize: number = 100
) {
  const results: any[] = []

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const result = await activationCodesDb.insert(activationCodes).values(batch as any).returning()
    if (Array.isArray(result)) {
      results.push(...result)
    }
  }

  return results
}

// 数据库迁移状态检查
export async function checkActivationCodesMigrationStatus() {
  try {
    // 检查激活码表是否存在
    const tables = await neonSql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'activation_codes'
      ORDER BY table_name
    `
    
    const expectedTables = ['activation_codes']
    const existingTables = tables.map(t => t.table_name)
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))
    
    return {
      isComplete: missingTables.length === 0,
      existingTables,
      missingTables,
      totalTables: expectedTables.length
    }
  } catch (error) {
    console.error('Failed to check activation codes migration status:', error)
    return {
      isComplete: false,
      existingTables: [],
      missingTables: ['activation_codes'],
      totalTables: 1,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// 数据库清理函数
export async function cleanupActivationCodes(options: {
  cleanExpiredCodes?: boolean
  cleanOldStats?: boolean
  daysOld?: number
} = {}) {
  const { cleanExpiredCodes = true, cleanOldStats = false, daysOld = 30 } = options
  
  const results = {
    expiredCodes: 0,
    errors: [] as string[]
  }
  
  try {
    if (cleanExpiredCodes) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const expiredResult = await activationCodesDb
        .delete(activationCodes)
        .where(sql`expires_at < ${cutoffDate}`)
        .returning()

      results.expiredCodes = expiredResult.length
    }
  } catch (error) {
    results.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }
  
  return results
}

// 连接状态监控 (注: 在 Next.js 中尽量避免使用顶层定时器)
let connectionStatus = {
  isConnected: true, // 初始假设为 true，交给 Pool 处理连接
  lastCheck: new Date(),
  consecutiveFailures: 0
}

export { connectionStatus }

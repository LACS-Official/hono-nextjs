/**
 * 用户行为统计数据库连接配置
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './user-behavior-schema'

// 从环境变量获取数据库连接字符串
const connectionString = process.env.USER_BEHAVIOR_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('USER_BEHAVIOR_DATABASE_URL or DATABASE_URL environment variable is required')
}

// 创建数据库连接
const sql = neon(connectionString)
export const userBehaviorDb = drizzle(sql, { schema })

// 数据库健康检查函数
export async function checkUserBehaviorDbHealth(): Promise<boolean> {
  try {
    // 执行简单查询来检查连接
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error('User behavior database health check failed:', error)
    return false
  }
}

// 导出schema以便在其他地方使用
export { schema }
export * from './user-behavior-schema'

// 软件管理数据库连接
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as softwareSchema from './software-schema'

// 验证数据库URL
const databaseUrl = process.env.SOFTWARE_DATABASE_URL
if (!databaseUrl) {
  throw new Error('SOFTWARE_DATABASE_URL environment variable is required')
}

// 创建软件管理数据库连接
let softwareSql: ReturnType<typeof neon>
let softwareDb: ReturnType<typeof drizzle>

try {
  softwareSql = neon(databaseUrl)
  softwareDb = drizzle(softwareSql, { schema: softwareSchema })
} catch (error) {
  console.error('Failed to initialize software database connection:', error)
  throw new Error('Database connection initialization failed')
}

export { softwareDb }

// 导出模式
export { softwareSchema }

// 数据库健康检查函数
export async function checkSoftwareDbHealth(): Promise<boolean> {
  try {
    await softwareSql`SELECT 1`
    return true
  } catch (error) {
    console.error('Software database health check failed:', error)
    return false
  }
}

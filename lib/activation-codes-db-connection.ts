// 激活码数据库连接
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as activationCodesSchema from './activation-codes-schema'

// 验证数据库URL
const databaseUrl = process.env.ACTIVATION_CODES_DATABASE_URL
if (!databaseUrl) {
  throw new Error('ACTIVATION_CODES_DATABASE_URL environment variable is required')
}

// 创建激活码数据库连接
let activationCodesSql: ReturnType<typeof neon>
let activationCodesDb: ReturnType<typeof drizzle>

try {
  activationCodesSql = neon(databaseUrl)
  activationCodesDb = drizzle(activationCodesSql, { schema: activationCodesSchema })
} catch (error) {
  console.error('Failed to initialize activation codes database connection:', error)
  throw new Error('Database connection initialization failed')
}

export { activationCodesDb }

// 导出模式
export { activationCodesSchema }

// 数据库健康检查函数
export async function checkActivationCodesDbHealth(): Promise<boolean> {
  try {
    await activationCodesSql`SELECT 1`
    return true
  } catch (error) {
    console.error('Activation codes database health check failed:', error)
    return false
  }
}

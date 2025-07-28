// 旧的统一数据库连接 - 已弃用
// 请使用 activation-codes-db-connection.ts 和 software-db-connection.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './db-schema'

// 创建数据库连接（兼容性保留）
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

// 导出模式
export { schema }

// 注意：此文件已弃用，建议使用分离的数据库连接：
// - 激活码相关操作：使用 activation-codes-db-connection.ts
// - 软件管理相关操作：使用 software-db-connection.ts

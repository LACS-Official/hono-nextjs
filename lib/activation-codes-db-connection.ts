// 激活码数据库连接
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as activationCodesSchema from './activation-codes-schema'

// 创建激活码数据库连接
const activationCodesSql = neon(process.env.ACTIVATION_CODES_DATABASE_URL!)
export const activationCodesDb = drizzle(activationCodesSql, { schema: activationCodesSchema })

// 导出模式
export { activationCodesSchema }

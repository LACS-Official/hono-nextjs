// 软件管理数据库连接
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as softwareSchema from './software-schema'

// 创建软件管理数据库连接
const softwareSql = neon(process.env.SOFTWARE_DATABASE_URL!)
export const softwareDb = drizzle(softwareSql, { schema: softwareSchema })

// 导出模式
export { softwareSchema }

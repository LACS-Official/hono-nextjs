/**
 * 系统设置独立数据库连接
 * 使用单独的数据库存储系统设置，与统一数据库分离
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './system-settings-schema'

// 创建系统设置数据库连接
const systemSettingsDbUrl = process.env.SYSTEM_SETTINGS_DATABASE_URL
if (!systemSettingsDbUrl) {
  throw new Error('SYSTEM_SETTINGS_DATABASE_URL 环境变量未设置')
}

// 使用 pg 连接池而不是 neon HTTP API
const pool = new Pool({
  connectionString: systemSettingsDbUrl,
})

export const systemSettingsDb = drizzle(pool, { schema })

// 导出系统设置相关的表
export const {
  systemSettings,
  systemSettingsAuditLog,
  apiAccessControl,
  systemLogConfig,
  systemBackupConfig,
  systemNotificationConfig,
  loginLogs,
} = schema

// 导出类型
export type {
  SystemSetting,
  NewSystemSetting,
  SystemSettingsAuditLog,
  NewSystemSettingsAuditLog,
  ApiAccessControl,
  NewApiAccessControl,
  SystemLogConfig,
  NewSystemLogConfig,
  SystemBackupConfig,
  NewSystemBackupConfig,
  SystemNotificationConfig,
  NewSystemNotificationConfig,
  LoginLog,
  NewLoginLog,
} from './system-settings-schema'
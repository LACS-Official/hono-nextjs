// 系统设置数据库连接模块 - 独立数据库连接
import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'
import * as systemSettingsSchema from './system-settings-schema'

/**
 * 系统设置专用数据库连接
 * 用于将系统配置、审计日志、登录日志等从主数据库中分离
 */

const systemSettingsConnectionString = 
  process.env.SYSTEM_SETTINGS_DATABASE_URL || 
  process.env.DATABASE_URL

if (!systemSettingsConnectionString) {
  throw new Error('SYSTEM_SETTINGS_DATABASE_URL environment variable is required')
}

// 创建独立的数据库客户端
const client = new Client({
  connectionString: systemSettingsConnectionString,
  // 增加 SSL 配置支持（特别是 Supabase/Neon 等云数据库）
  ssl: systemSettingsConnectionString.includes('sslmode=require') || 
       systemSettingsConnectionString.includes('supabase.co') || 
       systemSettingsConnectionString.includes('neon.tech') 
       ? { rejectUnauthorized: false } : false
})

// 连接到数据库
client.connect().catch(err => {
  console.error('Error connecting to system settings database:', err)
})

// 创建 Drizzle 实例
export const systemSettingsDb = drizzle(client, { 
  schema: systemSettingsSchema 
})

// 导出所有的表引用，方便在 API 中直接导入
export const { 
  systemSettings, 
  systemSettingsAuditLog, 
  apiAccessControl, 
  systemLogConfig, 
  systemBackupConfig, 
  systemNotificationConfig,
  loginLogs,
  blockedItems
} = systemSettingsSchema

// 数据库健康检查函数
export async function checkSystemSettingsDbHealth(): Promise<boolean> {
  try {
    await client.query('SELECT 1')
    return true
  } catch (error) {
    console.error('System settings database health check failed:', error)
    return false
  }
}

// 导出类型
export type SystemSettingsDatabase = typeof systemSettingsDb
export type SystemSetting = systemSettingsSchema.SystemSetting
export type NewSystemSetting = systemSettingsSchema.NewSystemSetting
export type SystemSettingsAuditLog = systemSettingsSchema.SystemSettingsAuditLog
export type NewSystemSettingsAuditLog = systemSettingsSchema.NewSystemSettingsAuditLog
export type LoginLog = systemSettingsSchema.LoginLog
export type NewLoginLog = systemSettingsSchema.NewLoginLog
export type BlockedItem = systemSettingsSchema.BlockedItem
export type NewBlockedItem = systemSettingsSchema.NewBlockedItem

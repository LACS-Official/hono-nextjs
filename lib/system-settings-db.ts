import '@/lib/dev-proxy'
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { Pool } from 'pg'
import { createProxiedStream } from './dev-proxy'
import * as systemSettingsSchema from './system-settings-schema'

/**
 * 系统设置专用数据库连接（支持 Supabase PostgreSQL）
 * 用于将系统配置、审计日志、登录日志、黑名单等存储至 Supabase
 */

const systemSettingsConnectionString =
  process.env.SYSTEM_SETTINGS_DATABASE_URL ||
  process.env.DATABASE_URL

if (!systemSettingsConnectionString) {
  throw new Error('SYSTEM_SETTINGS_DATABASE_URL environment variable is required')
}

const isNeon = systemSettingsConnectionString.includes('neon.tech') && !systemSettingsConnectionString.includes('supabase')

let pool: Pool | null = null
let neonSql: any = null
let systemSettingsDbInstance: any = null

if (isNeon) {
  neonSql = neon(systemSettingsConnectionString)
  systemSettingsDbInstance = drizzleNeon(neonSql, {
    schema: systemSettingsSchema
  })
} else {
  // Supabase PostgreSQL / 标准 Postgres 连接池
  const isDevWithProxy = Boolean(process.env.NODE_ENV === 'development' && process.env.DEV_PROXY)
  
  pool = new Pool({
    connectionString: systemSettingsConnectionString,
    ssl: { rejectUnauthorized: false },
    max: 5, // 压小连接数，防止占用过多配额
    idleTimeoutMillis: 10000, // 空闲10秒直接销毁，避免 pooler 踢掉后残留僵尸连接
    connectionTimeoutMillis: 5000, // 新建连接 5 秒超时
    ...(isDevWithProxy ? { stream: createProxiedStream as any } : {})
  })

  // 捕获底层连接掉线事件，自动丢弃坏连接
  pool.on('error', (err) => {
    console.error('[Supabase System Settings DB] pg pool底层连接异常 (已自动剔除失效连接):', err.message)
  })

  systemSettingsDbInstance = drizzleNodePg(pool, {
    schema: systemSettingsSchema
  })
}

// 判断是否为数据库瞬态断连错误
export function isTransientDBError(err: unknown): boolean {
  const msg = String((err as Error)?.message || '')
  return (
    msg.includes('ECONNRESET') ||
    msg.includes('fetch failed') ||
    msg.includes('secure TLS connection') ||
    msg.includes('Connection terminated unexpectedly') ||
    msg.includes('timeout') ||
    msg.includes('Connection closed')
  )
}

// 瞬态断连安全重试包装函数
export async function safeQuery<T>(queryFn: () => Promise<T>, maxRetries = 2, delayMs = 300): Promise<T> {
  let lastError: any = null
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await queryFn()
    } catch (err: any) {
      lastError = err
      if (attempt <= maxRetries && isTransientDBError(err)) {
        console.warn(`[Supabase safeQuery] 命中瞬态错误: ${err.message}，正在进行第 ${attempt} 次重试...`)
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
        continue
      }
      throw err
    }
  }
  throw lastError
}

// 导出 Drizzle 实例
export const systemSettingsDb = systemSettingsDbInstance

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
  return await safeQuery(async () => {
    try {
      if (isNeon && neonSql) {
        await neonSql`SELECT 1`
      } else if (pool) {
        await pool.query('SELECT 1')
      }
      return true
    } catch (error) {
      console.error('System settings database health check failed:', error)
      return false
    }
  })
}

// 自动验证并初始化 Supabase 相关数据表（幂等执行）
let tablesInitialized = false
let initializingPromise: Promise<void> | null = null

export async function ensureSystemSettingsTables(): Promise<void> {
  if (tablesInitialized) return
  if (initializingPromise) return initializingPromise

  initializingPromise = (async () => {
    const ddl = `
      CREATE TABLE IF NOT EXISTS system_settings (
        id varchar(255) PRIMARY KEY NOT NULL,
        category varchar(100) NOT NULL,
        key varchar(255) NOT NULL,
        value text,
        description text,
        type varchar(50) DEFAULT 'string' NOT NULL,
        is_secret boolean DEFAULT false NOT NULL,
        is_required boolean DEFAULT false NOT NULL,
        validation_rules jsonb,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        updated_by varchar(255)
      );

      CREATE TABLE IF NOT EXISTS system_settings_audit_log (
        id varchar(255) PRIMARY KEY NOT NULL,
        setting_id varchar(255) NOT NULL,
        action varchar(50) NOT NULL,
        old_value text,
        new_value text,
        reason text,
        user_id varchar(255) NOT NULL,
        user_agent text,
        ip_address varchar(45),
        timestamp timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blocked_items (
        id varchar(255) PRIMARY KEY NOT NULL,
        type varchar(20) NOT NULL,
        value varchar(255) NOT NULL,
        reason text,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        expires_at timestamp,
        created_by varchar(255)
      );

      CREATE TABLE IF NOT EXISTS login_logs (
        id varchar(255) PRIMARY KEY NOT NULL,
        user_id varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        ip_address varchar(45) NOT NULL,
        user_agent text NOT NULL,
        device_info jsonb NOT NULL,
        network_info jsonb NOT NULL,
        login_time timestamp DEFAULT now() NOT NULL,
        session_id text NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `

    try {
      if (isNeon && neonSql) {
        await neonSql(ddl)
        try {
          await neonSql`ALTER TABLE login_logs ALTER COLUMN session_id TYPE text;`
        } catch {}
      } else if (pool) {
        await pool.query(ddl)
        try {
          await pool.query(`ALTER TABLE login_logs ALTER COLUMN session_id TYPE text;`)
        } catch {}
      }

      tablesInitialized = true
      console.log('[Supabase System Settings DB] Tables verified/initialized successfully.')
    } catch (err: any) {
      console.warn('[Supabase System Settings DB] Tables ensure notice:', err.message || err)
    } finally {
      initializingPromise = null
    }
  })()

  return initializingPromise
}

// 启动时静默尝试初始化/校验
ensureSystemSettingsTables().catch(() => {})

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

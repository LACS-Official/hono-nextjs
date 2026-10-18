import crypto from 'crypto'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as crashSchema from './crash-reports-schema'
import { clientCrashReports } from './crash-reports-schema'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SOFTWARE_DATABASE_URL ||
  process.env.ACTIVATION_CODES_DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const neonSql = neon(connectionString)
export const crashDb = drizzle(neonSql, { schema: crashSchema })
export { clientCrashReports }

let tableInitialized = false
let tableInitializingPromise: Promise<void> | null = null

/**
 * 确保客户端崩溃日志表与对应索引存在（幂等执行）
 */
export async function ensureCrashReportsTable(): Promise<void> {
  if (tableInitialized) return
  if (tableInitializingPromise) return tableInitializingPromise

  tableInitializingPromise = (async () => {
    try {
      await neonSql`
        CREATE TABLE IF NOT EXISTS client_crash_reports (
          id serial PRIMARY KEY,
          software_id integer,
          software_name varchar(100) NOT NULL,
          app_version varchar(50) NOT NULL,
          os_name varchar(50) NOT NULL,
          os_version varchar(100),
          device_model varchar(100),
          cpu_arch varchar(50),
          gpu_renderer varchar(255),
          error_type varchar(100) NOT NULL,
          error_message text NOT NULL,
          error_stack text,
          crash_module varchar(255),
          crash_hash varchar(64) NOT NULL,
          custom_data jsonb,
          client_ip varchar(50),
          user_id varchar(255),
          status varchar(50) DEFAULT 'unresolved' NOT NULL,
          created_at timestamp DEFAULT now() NOT NULL
        );
      `
      await neonSql`CREATE INDEX IF NOT EXISTS idx_crash_software ON client_crash_reports(software_id);`
      await neonSql`CREATE INDEX IF NOT EXISTS idx_crash_version ON client_crash_reports(app_version);`
      await neonSql`CREATE INDEX IF NOT EXISTS idx_crash_hash ON client_crash_reports(crash_hash);`
      await neonSql`CREATE INDEX IF NOT EXISTS idx_crash_status ON client_crash_reports(status);`
      await neonSql`CREATE INDEX IF NOT EXISTS idx_crash_created_at ON client_crash_reports(created_at);`
      tableInitialized = true
    } catch (err) {
      console.error('[Crash DB] 初始化 client_crash_reports 数据表失败:', err)
      throw err
    } finally {
      tableInitializingPromise = null
    }
  })()

  return tableInitializingPromise
}

/**
 * 计算崩溃签名哈希 (Crash Hash)
 * 将同类型、同模块或同关键堆栈的崩溃聚合到同一个问题组
 */
export function calculateCrashHash(
  softwareName: string,
  errorType: string,
  crashModule?: string | null,
  errorStack?: string | null
): string {
  let location = (crashModule || '').trim()

  // 如果没有指定模块，从堆栈中提取第一个有效文件名/行号
  if (!location && errorStack) {
    const lines = errorStack
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith(errorType))

    if (lines.length > 0) {
      // 提取首行堆栈，过滤掉动态内存地址如 (0x00007ff...)
      location = lines[0].replace(/\b0x[0-9a-fA-F]+\b/g, '').substring(0, 150)
    }
  }

  const rawKey = `${softwareName.trim().toLowerCase()}:${errorType.trim().toLowerCase()}:${location.toLowerCase()}`
  return crypto.createHash('md5').update(rawKey).digest('hex')
}

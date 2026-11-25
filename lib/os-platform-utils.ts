/**
 * 操作系统平台维度工具
 * 支持记录使用软件的系统：windows / macos / linux / android
 * - normalizeOsPlatform: 将客户端上报的原始系统字符串归一化为标准枚举
 * - ensureOsPlatformColumns: 运行时补齐 os_platform 列（沿用 client_ip 的运行时迁移模式）
 */

import { neon } from '@neondatabase/serverless'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.SOFTWARE_DATABASE_URL ||
  process.env.ACTIVATION_CODES_DATABASE_URL

export type OsPlatform = 'windows' | 'macos' | 'linux' | 'android' | 'unknown'

export const OS_PLATFORM_LABELS: Record<OsPlatform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
  android: 'Android',
  unknown: '未知平台',
}

/**
 * 将各种来源的系统标识归一化为标准平台值
 * 兼容 Rust std::env::consts::OS（windows/macos/linux/android）、
 * navigator.userAgentData.platform（Windows/macOS/Linux/Android）以及自由文本
 */
export function normalizeOsPlatform(raw?: string | null): OsPlatform {
  if (!raw) return 'unknown'
  const s = raw.trim().toLowerCase()
  if (!s) return 'unknown'

  // 顺序敏感：android 的 uname 含 linux，必须先判断 android
  if (s.includes('win')) return 'windows' // windows / win32 / win11
  if (s.includes('darwin') || s.includes('mac') || s.includes('os x') || s.includes('osx')) return 'macos'
  if (s.includes('android')) return 'android'
  if (s.includes('linux') || s.includes('ubuntu') || s.includes('debian') || s.includes('fedora') || s.includes('arch') || s.includes('unix')) return 'linux'

  return 'unknown'
}

/**
 * 从 HTTP User-Agent 自动推断客户端运行平台
 * 兜底场景：旧版客户端未上报 osPlatform、Web/浏览器端、任意 HTTP 上报方
 * 覆盖 Tauri WebView UA（内嵌 Windows NT / Macintosh / Linux / Android）与常见浏览器 UA
 */
export function parseOsFromUserAgent(ua?: string | null): OsPlatform {
  if (!ua) return 'unknown'
  const s = ua.toLowerCase()

  // Android UA 含 'Linux'，必须先判
  if (s.includes('android')) return 'android'
  // iOS UA 含 'like Mac OS X'，先排除（不在四平台之列）
  if (s.includes('iphone') || s.includes('ipad') || s.includes('ios')) return 'unknown'
  if (s.includes('windows') || s.includes('win64') || s.includes('win32') || s.includes('wow64')) return 'windows'
  if (s.includes('macintosh') || s.includes('mac os x') || s.includes('macos')) return 'macos'
  if (s.includes('linux') || s.includes('x11') || s.includes('cros')) return 'linux'

  return 'unknown'
}

let osColumnsEnsured = false

/**
 * 确保 software_usage / device_connections 表拥有 os_platform 字段
 */
export async function ensureOsPlatformColumns(): Promise<void> {
  if (osColumnsEnsured || !connectionString) return
  try {
    const sql = neon(connectionString)
    await sql`ALTER TABLE software_usage ADD COLUMN IF NOT EXISTS os_platform text;`
    await sql`ALTER TABLE device_connections ADD COLUMN IF NOT EXISTS os_platform text;`
    osColumnsEnsured = true
  } catch (err) {
    console.warn('[OS Platform Utils] 确认 os_platform 字段提示:', err)
  }
}

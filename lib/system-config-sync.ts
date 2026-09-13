/**
 * 系统配置与运行时环境变量动态同步服务
 * 确保在后台界面修改设置后，即时同步至 process.env，使后端所有中间件和接口立刻生效
 */

export const SETTING_TO_ENV_MAP: Record<string, string> = {
  // 安全与访问控制
  enable_api_key_auth: 'ENABLE_API_KEY_AUTH',
  enable_rate_limiting: 'ENABLE_RATE_LIMITING',
  enable_strict_user_agent: 'ENABLE_STRICT_USER_AGENT_CHECK',
  enable_request_signature: 'ENABLE_REQUEST_SIGNATURE',
  api_key_expiration_hours: 'API_KEY_EXPIRATION_HOURS',
  jwt_expiration_hours: 'JWT_EXPIRATION_HOURS',

  // 网络与跨域
  allowed_origins: 'ALLOWED_ORIGINS',

  // 邮件与发信服务
  mail_provider: 'MAIL_PROVIDER',
  resend_api_key: 'RESEND_API_KEY',
  resend_from: 'RESEND_FROM',
  smtp_host: 'SMTP_HOST',
  smtp_port: 'SMTP_PORT',
  smtp_secure: 'SMTP_SECURE',
  smtp_user: 'SMTP_USER',
  smtp_pass: 'SMTP_PASS',
  smtp_from: 'SMTP_FROM',

  // 通知事件
  notify_suspicious_login: 'NOTIFY_SUSPICIOUS_LOGIN',
  notify_daily_digest: 'NOTIFY_DAILY_DIGEST',

  // 外部集成与定时任务
  github_token: 'GITHUB_TOKEN',
  cron_secret: 'CRON_SECRET',
}

/**
 * 将单条设置动态同步到运行时 process.env
 */
export function syncSettingToProcessEnv(key: string, value: any): boolean {
  const envName = SETTING_TO_ENV_MAP[key]
  if (envName && value !== undefined && value !== null) {
    const stringValue = String(value).trim()
    process.env[envName] = stringValue
    console.log(`[Config Sync] 动态配置已即时生效: ${key} -> process.env.${envName} = "${stringValue}"`)
    return true
  }
  return false
}

/**
 * 批量将数据库设置同步到 process.env
 */
export function batchSyncSettingsToProcessEnv(settings: Array<any>): void {
  if (!Array.isArray(settings)) return
  for (const item of settings) {
    if (item && item.key && item.value !== undefined && item.value !== null) {
      syncSettingToProcessEnv(item.key, item.value)
    }
  }
}

let hasInitialized = false
/**
 * 自动从数据库初始化系统设置至 process.env (避免服务刚启动时未加载配置)
 */
export async function initSystemConfigFromDb(): Promise<void> {
  if (hasInitialized) return
  try {
    const { SupabaseSystemSettingsService } = await import('@/lib/supabase-system-settings')
    const result = await SupabaseSystemSettingsService.getSettings({ limit: 100 })
    if (result?.settings) {
      batchSyncSettingsToProcessEnv(result.settings)
      hasInitialized = true
    }
  } catch (err) {
    // 忽略未初始化或网络暂时离线错误，保留环境现有变量
    console.warn('[Config Sync] 从数据库预加载配置被忽略:', (err as any)?.message || err)
  }
}

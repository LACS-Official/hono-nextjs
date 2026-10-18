import { supabase } from '@/lib/supabase-client'
import { verifyTOTP, verifyAndConsumeBackupCode } from '@/lib/totp'

export interface TwoFactorConfig {
  enabled: boolean
  secret: string
  backupCodes: string[]
  boundAt?: string | null
}

// 内存短期缓存（5秒），加速高频请求
let cached2FAConfig: TwoFactorConfig | null = null
let cacheExpiresAt = 0

export function clear2FACache() {
  cached2FAConfig = null
  cacheExpiresAt = 0
}

/**
 * 获取当前全局 2FA 配置
 */
export async function getTwoFactorConfig(): Promise<TwoFactorConfig> {
  const now = Date.now()
  if (cached2FAConfig && now < cacheExpiresAt) {
    return cached2FAConfig
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', [
        'two_factor_enabled',
        'two_factor_secret',
        'two_factor_backup_codes',
        'two_factor_bound_at',
      ])

    if (!error && data) {
      let enabled = false
      let secret = ''
      let backupCodes: string[] = []
      let boundAt: string | null = null

      for (const row of data) {
        if (row.key === 'two_factor_enabled') enabled = row.value === 'true'
        if (row.key === 'two_factor_secret') secret = (row.value || '').trim()
        if (row.key === 'two_factor_bound_at') boundAt = row.value || null
        if (row.key === 'two_factor_backup_codes') {
          try {
            backupCodes = JSON.parse(row.value || '[]')
          } catch {
            backupCodes = []
          }
        }
      }

      cached2FAConfig = { enabled, secret, backupCodes, boundAt }
      cacheExpiresAt = now + 5000 // 缓存 5 秒
      return cached2FAConfig
    }
  } catch (err) {
    console.warn('[2FA Service] 读取配置异常:', err)
  }

  return { enabled: false, secret: '', backupCodes: [], boundAt: null }
}

/**
 * 校验 2FA 凭据（支持 6 位动态口令或 8 位应急备用恢复码）
 */
export async function verifyTwoFactorAuth(
  code: string
): Promise<{ valid: boolean; isBackupCode: boolean; remainingBackupCount?: number }> {
  const config = await getTwoFactorConfig()

  // 若未启用 2FA，默认视为合规
  if (!config.enabled || !config.secret) {
    return { valid: true, isBackupCode: false }
  }

  const cleanCode = code.trim().replace(/\s+/g, '')

  // 1. 优先校验 6 位 TOTP 动态口令
  if (/^\d{6}$/.test(cleanCode)) {
    const isValidTotp = verifyTOTP(config.secret, cleanCode)
    if (isValidTotp) {
      return { valid: true, isBackupCode: false }
    }
  }

  // 2. 尝试校验应急备用恢复码
  if (config.backupCodes && config.backupCodes.length > 0) {
    const { valid, remainingCodes } = verifyAndConsumeBackupCode(cleanCode, config.backupCodes)
    if (valid) {
      // 持久化更新剩余恢复码
      try {
        await supabase
          .from('system_settings')
          .update({
            value: JSON.stringify(remainingCodes),
            updated_at: new Date().toISOString(),
          })
          .eq('key', 'two_factor_backup_codes')

        clear2FACache()
      } catch (e) {
        console.error('[2FA Service] 更新备用码失败:', e)
      }

      return {
        valid: true,
        isBackupCode: true,
        remainingBackupCount: remainingCodes.length,
      }
    }
  }

  return { valid: false, isBackupCode: false }
}

import { supabase } from '@/lib/supabase-client'

export interface SecurityEntranceConfig {
  enabled: boolean
  code: string
}

// 内存短期缓存（5秒），降低高频扫描与连续请求对数据库的开销
let cachedConfig: SecurityEntranceConfig | null = null
let cacheExpiresAt = 0

/**
 * 获取当前安全入口配置（仿 1Panel 机制）
 */
export async function getSecurityEntranceConfig(): Promise<SecurityEntranceConfig> {
  const now = Date.now()
  if (cachedConfig && now < cacheExpiresAt) {
    return cachedConfig
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['security_entrance_enabled', 'security_entrance_code'])

    if (!error && data) {
      let enabled = false
      let code = ''
      for (const row of data) {
        if (row.key === 'security_entrance_enabled') {
          enabled = row.value === 'true'
        }
        if (row.key === 'security_entrance_code') {
          code = (row.value || '').trim()
        }
      }
      cachedConfig = { enabled, code }
      cacheExpiresAt = now + 5000 // 缓存 5 秒
      return cachedConfig
    }
  } catch (e) {
    console.warn('[Security Entrance] 读取配置异常，默认放行:', e)
  }

  return { enabled: false, code: '' }
}

/**
 * 清除内存缓存以使更新即时生效
 */
export function clearSecurityEntranceCache() {
  cachedConfig = null
  cacheExpiresAt = 0
}

/**
 * 校验当前访问是否已满足安全入口凭据
 * 1. 优先校验 URL 查询参数 ?entrance=xxx
 * 2. 其次校验客户端 Cookie lacs_entrance_pass=xxx
 */
export async function checkSecurityEntrance(
  entranceQuery?: string | null,
  entranceCookie?: string | null
): Promise<{ enabled: boolean; allowed: boolean; code: string }> {
  const config = await getSecurityEntranceConfig()

  // 未启用安全入口，直接放行
  if (!config.enabled) {
    return { enabled: false, allowed: true, code: config.code }
  }

  // 若开启但未设置有效代码，默认放行避免管理员被意外锁在外部
  if (!config.code) {
    return { enabled: true, allowed: true, code: '' }
  }

  const queryCode = (entranceQuery || '').trim()
  const cookieCode = (entranceCookie || '').trim()

  const isMatched = queryCode === config.code || cookieCode === config.code

  return {
    enabled: true,
    allowed: isMatched,
    code: config.code,
  }
}

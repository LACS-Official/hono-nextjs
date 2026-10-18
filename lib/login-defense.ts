import { v4 as uuidv4 } from 'uuid'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { sendWebhookNotification } from '@/lib/webhook-service'

interface FailAttemptRecord {
  count: number
  firstAttemptAt: number
  lastAttemptAt: number
  email?: string
}

interface LockoutRecord {
  ip: string
  reason: string
  expiresAt: Date
}

// 连续失败尝试内存追踪器（窗口期 15 分钟）
const failureCache = new Map<string, FailAttemptRecord>()

// 内存暂存锁（双重保障：内存毫秒级感知 + Postgres 数据库持久化）
const lockedIpsCache = new Map<string, LockoutRecord>()

export const MAX_LOGIN_ATTEMPTS = 3
export const LOCKOUT_DURATION_MINUTES = 15
export const ATTEMPT_WINDOW_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000

/**
 * 清理过期的尝试记录与内存锁
 */
function cleanupExpiredAttempts() {
  const now = Date.now()
  for (const [ip, record] of failureCache.entries()) {
    if (now - record.lastAttemptAt > ATTEMPT_WINDOW_MS) {
      failureCache.delete(ip)
    }
  }
  for (const [ip, record] of lockedIpsCache.entries()) {
    if (now >= record.expiresAt.getTime()) {
      lockedIpsCache.delete(ip)
    }
  }
}

/**
 * 检查当前 IP 是否处于封锁或锁定状态
 */
export async function checkIpDefenseStatus(ip: string): Promise<{
  blocked: boolean
  reason?: string
  expiresAt?: string | null
  remainingSeconds?: number | null
}> {
  if (!ip) {
    return { blocked: false }
  }

  cleanupExpiredAttempts()

  // 1. 优先检查瞬时内存锁（零延迟）
  const memLocked = lockedIpsCache.get(ip)
  if (memLocked && memLocked.expiresAt.getTime() > Date.now()) {
    const remainingSeconds = Math.max(0, Math.floor((memLocked.expiresAt.getTime() - Date.now()) / 1000))
    return {
      blocked: true,
      reason: memLocked.reason,
      expiresAt: memLocked.expiresAt.toISOString(),
      remainingSeconds,
    }
  }

  // 2. 检查 Supabase / Postgres 持久化黑名单（添加 2.5 秒超时兜底）
  try {
    const timeoutPromise = new Promise<{ blocked: boolean; reason?: string; expiresAt?: string | null }>((resolve) =>
      setTimeout(() => resolve({ blocked: false }), 2500)
    )
    const blockInfo = await Promise.race([
      SupabaseSystemSettingsService.getBlockedInfo('ip', ip),
      timeoutPromise,
    ])

    if (blockInfo.blocked) {
      const remainingSeconds = blockInfo.expiresAt
        ? Math.max(0, Math.floor((new Date(blockInfo.expiresAt).getTime() - Date.now()) / 1000))
        : null

      return {
        blocked: true,
        reason: blockInfo.reason || '您的 IP 已被系统安全拦截，禁止访问。',
        expiresAt: blockInfo.expiresAt,
        remainingSeconds,
      }
    }
  } catch (err) {
    console.warn('[Login Defense] PostgREST 检测黑名单异常，尝试 SQL 查询:', err)
    try {
      const { systemSettingsDb, safeQuery } = await import('@/lib/system-settings-db')
      const { blockedItems } = await import('@/lib/system-settings-schema')
      const { eq, and } = await import('drizzle-orm')

      const rows = await safeQuery<any[]>(() =>
        systemSettingsDb
          .select()
          .from(blockedItems)
          .where(
            and(
              eq(blockedItems.isActive, true),
              eq(blockedItems.type, 'ip'),
              eq(blockedItems.value, ip)
            )
          )
          .limit(1)
      )

      if (Array.isArray(rows) && rows.length > 0) {
        const item = rows[0]
        if (!item.expiresAt || new Date(item.expiresAt) > new Date()) {
          const remainingSeconds = item.expiresAt
            ? Math.max(0, Math.floor((new Date(item.expiresAt).getTime() - Date.now()) / 1000))
            : null
          return {
            blocked: true,
            reason: item.reason || '您的 IP 已被管理员拉黑，禁止登录。',
            expiresAt: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
            remainingSeconds,
          }
        }
      }
    } catch (sqlErr) {
      console.warn('[Login Defense] SQL 检测异常:', sqlErr)
    }
  }

  return { blocked: false }
}

/**
 * 记录登录失败事件
 * 连续失败达 3 次立即触发全系统 IP 封锁与 Webhook 告警
 */
export async function recordLoginFailure(
  ip: string,
  email?: string
): Promise<{
  locked: boolean
  attempts: number
  remainingAttempts: number
  message: string
  lockDurationMinutes?: number
  expiresAt?: Date
}> {
  cleanupExpiredAttempts()

  if (!ip) {
    return {
      locked: false,
      attempts: 1,
      remainingAttempts: MAX_LOGIN_ATTEMPTS - 1,
      message: '邮箱或密码错误，请核对后重试',
    }
  }

  // 1. 先检查是否已处于锁定中
  const status = await checkIpDefenseStatus(ip)
  if (status.blocked) {
    return {
      locked: true,
      attempts: MAX_LOGIN_ATTEMPTS,
      remainingAttempts: 0,
      lockDurationMinutes: LOCKOUT_DURATION_MINUTES,
      message: status.reason || `连续登录失败超过 ${MAX_LOGIN_ATTEMPTS} 次，IP 已被安全锁定 ${LOCKOUT_DURATION_MINUTES} 分钟！`,
      expiresAt: status.expiresAt ? new Date(status.expiresAt) : undefined,
    }
  }

  // 2. 累计失败次数
  const now = Date.now()
  const existing = failureCache.get(ip)
  let count = 1

  if (existing && now - existing.lastAttemptAt < ATTEMPT_WINDOW_MS) {
    count = existing.count + 1
    existing.count = count
    existing.lastAttemptAt = now
    if (email) existing.email = email
  } else {
    failureCache.set(ip, {
      count: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      email,
    })
  }

  // 3. 判断是否达到封锁阈值（>= 3 次）
  if (count >= MAX_LOGIN_ATTEMPTS) {
    const expiresAt = new Date(Date.now() + ATTEMPT_WINDOW_MS)
    const reason = `触发防暴力破解安全保护：连续登录失败超过 ${MAX_LOGIN_ATTEMPTS} 次，系统已自动锁定 ${LOCKOUT_DURATION_MINUTES} 分钟`

    // A. 立即写入瞬时内存锁（保证后续毫秒内任何请求立刻拦截）
    lockedIpsCache.set(ip, { ip, reason, expiresAt })

    // B. 写入 Postgres 持久化黑名单表
    try {
      await SupabaseSystemSettingsService.addBlockedItem({
        type: 'ip',
        value: ip,
        reason,
        expiresAt,
        createdBy: 'system_auto_defense',
      })
    } catch (dbErr) {
      // 备选降级走 SQL 写入
      try {
        const { systemSettingsDb, safeQuery } = await import('@/lib/system-settings-db')
        const { blockedItems } = await import('@/lib/system-settings-schema')
        await safeQuery(() =>
          systemSettingsDb.insert(blockedItems).values({
            id: uuidv4(),
            type: 'ip',
            value: ip,
            reason,
            isActive: true,
            expiresAt,
            createdBy: 'system_auto_defense',
          })
        )
      } catch (sqlErr) {
        console.warn('[Login Defense] SQL 备选持久化失败 (内存锁已维持):', sqlErr)
      }
    }

    // C. 触发机器人告警通知
    sendWebhookNotification({
      event: 'suspicious_login',
      title: '🚨 [安全警报] 触发防暴力破解自动封禁',
      content: `系统检测到来自 IP ${ip} 的高危暴力破解行为（连续登录失败达到 ${MAX_LOGIN_ATTEMPTS} 次），已自动将其列入安全黑名单并锁定 ${LOCKOUT_DURATION_MINUTES} 分钟！`,
      fields: {
        '尝试账号': email || '未指定',
        '攻击来源 IP': ip,
        '失败次数': `${count} 次`,
        '封锁周期': `${LOCKOUT_DURATION_MINUTES} 分钟`,
        '解除时间': expiresAt.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        '防御机制': '1Panel 风格多重防爆破拦截',
      },
    }).catch(e => console.error('[Defense Webhook Notify Error]:', e))

    // 清理该 IP 的失败尝试缓存
    failureCache.delete(ip)

    return {
      locked: true,
      attempts: count,
      remainingAttempts: 0,
      lockDurationMinutes: LOCKOUT_DURATION_MINUTES,
      message: `🚫 连续登录失败达到 ${MAX_LOGIN_ATTEMPTS} 次！触发防爆破保护，您的 IP 已被系统安全锁定 ${LOCKOUT_DURATION_MINUTES} 分钟。`,
      expiresAt,
    }
  }

  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - count)
  return {
    locked: false,
    attempts: count,
    remainingAttempts,
    message: `邮箱或密码错误（已连续失败 ${count} 次，还剩 ${remainingAttempts} 次机会，超过将被锁定 ${LOCKOUT_DURATION_MINUTES} 分钟）`,
  }
}

/**
 * 登录成功后清理失败尝试计数与内存锁
 */
export function recordLoginSuccess(ip: string): void {
  if (ip) {
    failureCache.delete(ip)
    lockedIpsCache.delete(ip)
  }
}

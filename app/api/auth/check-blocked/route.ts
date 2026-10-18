import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb, safeQuery } from '@/lib/system-settings-db'
import { blockedItems } from '@/lib/system-settings-schema'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { eq, and, or } from 'drizzle-orm'
import { getClientIp } from '@/lib/login-log-utils'
import { checkIpDefenseStatus } from '@/lib/login-defense'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || ''

    // 1. 优先检查 IP 防爆破与黑名单状态
    const ipDefense = await checkIpDefenseStatus(ip)
    if (ipDefense.blocked) {
      return NextResponse.json({
        success: true,
        blocked: true,
        reason: ipDefense.reason,
        expiresAt: ipDefense.expiresAt,
        remainingSeconds: ipDefense.remainingSeconds,
      })
    }

    try {
      const deviceInfo = userAgent ? await SupabaseSystemSettingsService.getBlockedInfo('device', userAgent) : { blocked: false }

      if (deviceInfo.blocked) {
        const remainingSeconds = deviceInfo.expiresAt
          ? Math.max(0, Math.floor((new Date(deviceInfo.expiresAt).getTime() - Date.now()) / 1000))
          : null

        return NextResponse.json({
          success: true,
          blocked: true,
          reason: deviceInfo.reason || '您的设备已被系统安全拦截，禁止访问。',
          expiresAt: deviceInfo.expiresAt,
          remainingSeconds,
        })
      }

      return NextResponse.json({
        success: true,
        blocked: false
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] check-blocked 回退至 SQL 执行:', supabaseErr.message)
      // 检查 IP 或 设备是否在黑名单中且处于激活状态
      const blocked = await safeQuery<any[]>(() =>
        systemSettingsDb
          .select()
          .from(blockedItems)
          .where(
            and(
              eq(blockedItems.isActive, true),
              or(
                and(eq(blockedItems.type, 'ip'), eq(blockedItems.value, ip)),
                and(eq(blockedItems.type, 'device'), eq(blockedItems.value, userAgent))
              )
            )
          )
          .limit(1)
      )

      if (Array.isArray(blocked) && blocked.length > 0) {
        return NextResponse.json({
          success: true,
          blocked: true,
          reason: blocked[0].reason || '您的 IP 或设备已被管理员拉黑，禁止登录。'
        })
      }

      return NextResponse.json({
        success: true,
        blocked: false
      })
    }
  } catch (error: any) {
    console.error('检查黑名单失败 (安全放行):', error)
    return NextResponse.json({ success: true, blocked: false, warning: error.message })
  }
}

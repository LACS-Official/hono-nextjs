import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb } from '@/lib/system-settings-db'
import { blockedItems } from '@/lib/system-settings-schema'
import { eq, and, or } from 'drizzle-orm'
import { getClientIp } from '@/lib/login-log-utils'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || ''

    // 检查 IP 或 设备是否在黑名单中且处于激活状态
    const blocked = await systemSettingsDb
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

    if (blocked.length > 0) {
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
  } catch (error: any) {
    console.error('检查黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

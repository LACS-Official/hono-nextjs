import { NextRequest, NextResponse } from 'next/server'
import { verifyTOTP } from '@/lib/totp'
import { getTwoFactorConfig, clear2FACache } from '@/lib/totp-service'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { code } = body

    const config = await getTwoFactorConfig()
    if (!config.enabled) {
      return NextResponse.json({ success: true, message: '2FA 目前未启用' })
    }

    // 安全验证：若提供了口令，先做校验
    if (code && config.secret) {
      const isValid = verifyTOTP(config.secret, code)
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: '动态口令校验未通过，无法解绑' },
          { status: 400 }
        )
      }
    }

    await SupabaseSystemSettingsService.createSetting({
      category: 'security',
      key: 'two_factor_enabled',
      value: 'false',
      description: '2FA 双因子认证开关',
      type: 'boolean',
    })

    clear2FACache()

    return NextResponse.json({
      success: true,
      message: '2FA 双因子认证已成功停用',
    })
  } catch (error: any) {
    console.error('[2FA Disable Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || '停用 2FA 失败' },
      { status: 500 }
    )
  }
}

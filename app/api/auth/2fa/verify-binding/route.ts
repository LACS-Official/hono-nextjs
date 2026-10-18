import { NextRequest, NextResponse } from 'next/server'
import { verifyTOTP } from '@/lib/totp'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { clear2FACache } from '@/lib/totp-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, code, backupCodes } = body

    if (!secret || !code) {
      return NextResponse.json(
        { success: false, error: '缺少密钥或验证码' },
        { status: 400 }
      )
    }

    // 校验用户输入的 6 位动态验证码
    const isValid = verifyTOTP(secret, code)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: '动态口令错误，请核对手机身份验证器时间后重试' },
        { status: 400 }
      )
    }

    // 持久化存储至 system_settings
    await SupabaseSystemSettingsService.createSetting({
      category: 'security',
      key: 'two_factor_enabled',
      value: 'true',
      description: '2FA 双因子认证开关',
      type: 'boolean',
    })

    await SupabaseSystemSettingsService.createSetting({
      category: 'security',
      key: 'two_factor_secret',
      value: secret,
      description: '2FA TOTP Base32 密钥',
      type: 'string',
      isSecret: true,
    })

    await SupabaseSystemSettingsService.createSetting({
      category: 'security',
      key: 'two_factor_backup_codes',
      value: JSON.stringify(backupCodes || []),
      description: '2FA 应急备用恢复码列表',
      type: 'json',
      isSecret: true,
    })

    await SupabaseSystemSettingsService.createSetting({
      category: 'security',
      key: 'two_factor_bound_at',
      value: new Date().toISOString(),
      description: '2FA 绑定时间',
      type: 'string',
    })

    clear2FACache()

    return NextResponse.json({
      success: true,
      message: '2FA 双因子安全认证已成功绑定并启用！',
    })
  } catch (error: any) {
    console.error('[2FA Verify Binding Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || '绑定 2FA 失败' },
      { status: 500 }
    )
  }
}

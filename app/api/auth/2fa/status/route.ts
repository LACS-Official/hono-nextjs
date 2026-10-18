import { NextResponse } from 'next/server'
import { getTwoFactorConfig } from '@/lib/totp-service'

export async function GET() {
  try {
    const config = await getTwoFactorConfig()
    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      bound: Boolean(config.secret),
      boundAt: config.boundAt,
      backupCodesCount: config.backupCodes ? config.backupCodes.length : 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '获取 2FA 状态异常' },
      { status: 500 }
    )
  }
}

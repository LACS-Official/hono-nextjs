import { NextRequest, NextResponse } from 'next/server'
import { getTwoFactorConfig } from '@/lib/totp-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const config = await getTwoFactorConfig(true)
    return NextResponse.json(
      {
        success: true,
        enabled: config.enabled,
        bound: Boolean(config.secret),
        boundAt: config.boundAt,
        backupCodesCount: config.backupCodes ? config.backupCodes.length : 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || '获取 2FA 状态异常' },
      { status: 500 }
    )
  }
}

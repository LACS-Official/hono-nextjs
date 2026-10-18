import { NextRequest, NextResponse } from 'next/server'
import {
  generateTOTPSecret,
  generateOtpauthUrl,
  generateQRCodeDataUrl,
  generateBackupCodes,
} from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const accountEmail = body.email || 'admin@lacs.cc'

    const secret = generateTOTPSecret(20)
    const otpauthUrl = generateOtpauthUrl(secret, accountEmail, 'LACS Admin')
    const qrCodeDataUrl = await generateQRCodeDataUrl(otpauthUrl)
    const backupCodes = generateBackupCodes(8)

    return NextResponse.json({
      success: true,
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      backupCodes,
    })
  } catch (error: any) {
    console.error('[2FA Setup Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || '生成 2FA 绑定信息失败' },
      { status: 500 }
    )
  }
}

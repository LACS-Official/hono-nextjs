import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/login-log-utils'
import { checkIpDefenseStatus, recordLoginFailure, recordLoginSuccess } from '@/lib/login-defense'
import { verifyTwoFactorAuth, getTwoFactorConfig } from '@/lib/totp-service'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json()
    const { email, code } = body

    // 1. 检查 IP 是否被封禁锁定
    const ipDefense = await checkIpDefenseStatus(ip)
    if (ipDefense.blocked) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          error: ipDefense.reason || '当前 IP 已被系统安全锁定',
          remainingSeconds: ipDefense.remainingSeconds,
        },
        { status: 403 }
      )
    }

    // 2. 检查 2FA 是否开启
    const config = await getTwoFactorConfig()
    if (!config.enabled) {
      return NextResponse.json({
        success: true,
        verified: true,
        isBackupCode: false,
      })
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: '请输入 6 位动态验证码' },
        { status: 400 }
      )
    }

    // 3. 执行 2FA 动态口令 / 备用码校验
    const result = await verifyTwoFactorAuth(code)

    if (result.valid) {
      // 验证成功，清除任何失败尝试记录
      recordLoginSuccess(ip)

      return NextResponse.json({
        success: true,
        verified: true,
        isBackupCode: result.isBackupCode,
        remainingBackupCount: result.remainingBackupCount,
        message: result.isBackupCode
          ? `备用恢复码验证成功！当前剩余备用码: ${result.remainingBackupCount} 个`
          : '2FA 双因子认证通过',
      })
    } else {
      // 验证失败，计入防爆破失败次数！
      const failRecord = await recordLoginFailure(ip, email)

      return NextResponse.json(
        {
          success: false,
          verified: false,
          locked: failRecord.locked,
          error: failRecord.locked
            ? failRecord.message
            : `2FA 动态口令错误（已失败 ${failRecord.attempts} 次，达到 3 次将自动锁定 IP 15 分钟）`,
          remainingAttempts: failRecord.remainingAttempts,
        },
        { status: 401 }
      )
    }
  } catch (error: any) {
    console.error('[2FA Verify Login Error]:', error)
    return NextResponse.json(
      { success: false, error: error.message || '2FA 认证过程发生异常' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/login-log-utils'
import { recordLoginFailure } from '@/lib/login-defense'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim() : undefined

    const result = await recordLoginFailure(ip, email)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[API] record-login-failure 错误:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '记录登录失败状态异常',
        locked: false,
        remainingAttempts: 1,
      },
      { status: 500 }
    )
  }
}

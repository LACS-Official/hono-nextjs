import { NextRequest, NextResponse } from 'next/server'
import { checkSecurityEntrance } from '@/lib/security-entrance'

export async function GET(request: NextRequest) {
  try {
    const entranceQuery = request.nextUrl.searchParams.get('entrance')
    const entranceCookie = request.cookies.get('lacs_entrance_pass')?.value

    const check = await checkSecurityEntrance(entranceQuery, entranceCookie)

    const response = NextResponse.json({
      success: true,
      enabled: check.enabled,
      allowed: check.allowed,
    })

    // 如果通过了安全入口验证，在 Cookie 中植入凭证，有效期 2 小时
    if (check.enabled && check.allowed && check.code) {
      response.cookies.set('lacs_entrance_pass', check.code, {
        path: '/',
        maxAge: 7200, // 2 小时
        sameSite: 'lax',
        httpOnly: false, // 允许客户端/服务端协同感知
      })
    }

    return response
  } catch (error: any) {
    return NextResponse.json({ success: false, enabled: false, allowed: true, error: error.message })
  }
}

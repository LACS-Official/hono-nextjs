import { NextRequest, NextResponse } from 'next/server'
import { getClientIp } from '@/lib/login-log-utils'
import { recordLoginSuccess } from '@/lib/login-defense'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    recordLoginSuccess(ip)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = authenticateRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication required'
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      user: authResult.user
    })
  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败'
    }, { status: 500 })
  }
}

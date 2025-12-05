import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    
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

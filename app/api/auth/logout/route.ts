import { NextRequest, NextResponse } from 'next/server'
import { createLogoutHeaders } from '@/lib/auth'

export async function POST(_request: NextRequest) {
  try {
    // 创建登出响应头
    const logoutHeaders = createLogoutHeaders()
    
    const response = NextResponse.json({
      success: true,
      message: '已成功登出'
    })
    
    // 设置清除 Cookie 的头部
    Object.entries(logoutHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({
      success: false,
      error: '登出失败'
    }, { status: 500 })
  }
}

// 支持 GET 请求用于简单的登出链接
export async function GET(request: NextRequest) {
  return POST(request)
}

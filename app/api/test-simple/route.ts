import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('测试API被调用')
    
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    
    console.log('接收到的参数:', { page, limit })
    
    return NextResponse.json({
      success: true,
      message: '测试成功',
      data: {
        page,
        limit,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('测试API失败:', error)
    return NextResponse.json(
      { success: false, error: '测试API失败' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    console.log('开始处理登录日志GET请求 - 最简测试版本')
    
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')

    console.log('原始查询参数:', { page, limit })

    // 简单的参数验证
    const page_num = page ? parseInt(page) : 1
    const limit_num = limit ? parseInt(limit) : 20

    if (isNaN(page_num) || page_num < 1) {
      return NextResponse.json(
        { success: false, error: 'page参数必须是大于0的整数' },
        { status: 400 }
      )
    }

    if (isNaN(limit_num) || limit_num < 1 || limit_num > 100) {
      return NextResponse.json(
        { success: false, error: 'limit参数必须是1-100之间的整数' },
        { status: 400 }
      )
    }

    console.log('验证后的参数:', { page_num, limit_num })

    return NextResponse.json({
      success: true,
      message: '参数验证成功',
      data: {
        page: page_num,
        limit: limit_num
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取登录日志失败:', error)
    return NextResponse.json(
      { success: false, error: '获取登录日志失败' },
      { status: 500 }
    )
  }
}
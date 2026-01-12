import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 查询参数验证模式
const queryLoginLogsSchema = z.object({
  userId: z.string().optional(),
  email: z.string().optional(),
  ipAddress: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

export async function GET(request: NextRequest) {
  try {
    console.log('开始处理登录日志GET请求 - 测试版本')
    
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams
    const isActiveParam = searchParams.get('isActive')
    const queryParams = {
      userId: searchParams.get('userId'),
      email: searchParams.get('email'),
      ipAddress: searchParams.get('ipAddress'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      isActive: isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined,
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    }

    console.log('查询参数:', queryParams)

    // 验证查询参数
    const validatedParams = queryLoginLogsSchema.parse(queryParams)
    console.log('验证后的参数:', validatedParams)

    return NextResponse.json({
      success: true,
      message: '参数验证成功',
      data: validatedParams,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取登录日志失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '参数验证失败', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '获取登录日志失败' },
      { status: 500 }
    )
  }
}
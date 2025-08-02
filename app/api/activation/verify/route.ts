// 激活码验证接口 - 前端兼容性包装
import { NextRequest } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

// 处理 OPTIONS 请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')
  return handleOptions(origin, userAgent)
}

// 处理 POST 请求 - 验证激活码
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 获取请求体
    const body = await request.json()
    
    // 转发到实际的激活码验证API
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
    const verifyUrl = `${baseUrl}/api/activation-codes/verify`
    
    // 复制所有请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // 复制相关的请求头
    const headersToForward = [
      'x-api-key',
      'x-app-id', 
      'x-data-encrypted',
      'x-data-version',
      'authorization',
      'user-agent'
    ]
    
    headersToForward.forEach(headerName => {
      const headerValue = request.headers.get(headerName)
      if (headerValue) {
        headers[headerName] = headerValue
      }
    })

    // 转发请求到实际的API
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    const responseData = await response.json()

    // 返回相同的响应状态和数据
    return corsResponse(responseData, { 
      status: response.status 
    }, origin, userAgent)

  } catch (error) {
    console.error('Error in activation verify proxy:', error)
    return corsResponse({
      success: false,
      error: '激活验证服务暂时不可用'
    }, { status: 500 }, origin, userAgent)
  }
}

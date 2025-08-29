import { NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from './lib/cors'

export function middleware(req: NextRequest) {
  const method = req.method
  const origin = req.headers.get('origin')
  const userAgent = req.headers.get('user-agent')
  const acrh = req.headers.get('access-control-request-headers')

  // 统一生成基础 CORS 头
  const baseCors = getCorsHeaders(origin, userAgent) as Record<string, string>

  // 如存在预检请求声明的自定义头，优先覆盖到 Allow-Headers
  if (acrh) {
    baseCors['Access-Control-Allow-Headers'] = acrh
  }

  // 预检短路：对 OPTIONS 直接 204 返回，绝不做 DB/鉴权/健康检查
  if (method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: baseCors,
    })
  }

  // 非预检请求：继续下游处理，但统一追加 CORS 头（包括错误分支）
  const res = NextResponse.next()
  for (const [k, v] of Object.entries(baseCors)) {
    res.headers.set(k, v)
  }
  return res
}

// 仅作用于 API 路由，避免对页面资源产生副作用
export const config = {
  matcher: ['/api/:path*'],
}

import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

// 速率限制存储（改进版）
const rateLimitStore = new Map<string, { count: number; resetTime: number; blocked: boolean }>()

// 定期清理过期记录
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // 每分钟清理一次

// 速率限制中间件（改进版）
export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return async (c: Context, next: Next) => {
    // 跳过健康检查端点的速率限制
    if (c.req.path.includes('/health')) {
      return next()
    }

    const clientId = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
                     c.req.header('x-real-ip') ||
                     c.req.header('cf-connecting-ip') || // Cloudflare
                     'unknown'

    const now = Date.now()
    const clientData = rateLimitStore.get(clientId)

    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs, blocked: false })
    } else if (clientData.blocked || clientData.count >= maxRequests) {
      // 标记为被阻止，增加阻止时间
      clientData.blocked = true
      clientData.resetTime = now + windowMs * 2 // 双倍惩罚时间

      // 记录可疑活动
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientId} - Count: ${clientData.count}`)

      throw new HTTPException(429, {
        message: 'Too many requests. Please try again later.'
      })
    } else {
      clientData.count++
    }

    // 添加速率限制头部
    c.res.headers.set('X-RateLimit-Limit', maxRequests.toString())
    c.res.headers.set('X-RateLimit-Remaining', Math.max(0, maxRequests - (clientData?.count || 0)).toString())
    c.res.headers.set('X-RateLimit-Reset', Math.ceil((clientData?.resetTime || now) / 1000).toString())

    return next()
  }
}

// API Key 验证中间件
export function apiKeyAuth() {
  return async (c: Context, next: Next) => {
    const apiKey = c.req.header('X-API-Key')
    const validApiKey = process.env.API_KEY

    // 如果没有设置API Key，则跳过验证（开发模式）
    if (!validApiKey) {
      console.warn('⚠️ API_KEY 环境变量未设置，跳过API Key验证')
      return next()
    }

    if (!apiKey) {
      throw new HTTPException(401, {
        message: 'Missing API Key. Please provide X-API-Key header.'
      })
    }

    if (apiKey !== validApiKey) {
      throw new HTTPException(401, {
        message: 'Invalid API Key.'
      })
    }

    return next()
  }
}

// 写操作 API Key 验证中间件（仅对 POST, PUT, DELETE 生效）
export function writeOperationAuth() {
  return async (c: Context, next: Next) => {
    const method = c.req.method

    // 只对写操作进行验证
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      const apiKey = c.req.header('X-API-Key')
      const validApiKey = process.env.API_KEY

      // 如果没有设置API Key，则跳过验证（开发模式）
      if (!validApiKey) {
        console.warn('⚠️ API_KEY 环境变量未设置，跳过写操作API Key验证')
        return next()
      }

      if (!apiKey) {
        throw new HTTPException(401, {
          message: 'Missing API Key. Write operations require X-API-Key header.'
        })
      }

      if (apiKey !== validApiKey) {
        throw new HTTPException(401, {
          message: 'Invalid API Key.'
        })
      }

      // 记录写操作日志
      const ip = c.req.header('x-forwarded-for') ||
                 c.req.header('x-real-ip') ||
                 'unknown'
      const userAgent = c.req.header('User-Agent') || 'Unknown'

      console.log(`[AUDIT] ${method} ${c.req.url} - IP: ${ip} - UA: ${userAgent} - Time: ${new Date().toISOString()}`)
    }

    return next()
  }
}

// 请求日志中间件
export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now()
    const method = c.req.method
    const url = c.req.url
    const userAgent = c.req.header('User-Agent') || 'Unknown'
    const ip = c.req.header('x-forwarded-for') || 
               c.req.header('x-real-ip') || 
               'unknown'

    console.log(`[${new Date().toISOString()}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`)

    await next()

    const duration = Date.now() - start
    const status = c.res.status
    
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${status} - ${duration}ms`)
  }
}

// 安全头部中间件（增强版）
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next()

    // 基础安全头部
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
    c.res.headers.set('X-Frame-Options', 'DENY')
    c.res.headers.set('X-XSS-Protection', '1; mode=block')
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 权限策略
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

    // 内容安全策略（针对API）
    c.res.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")

    // 严格传输安全（HSTS）- 仅在HTTPS环境下
    if (c.req.header('x-forwarded-proto') === 'https' || process.env.NODE_ENV === 'production') {
      c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // 移除可能泄露信息的头部
    c.res.headers.delete('Server')
    c.res.headers.delete('X-Powered-By')

    // 添加请求ID用于追踪
    const requestId = c.req.header('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    c.res.headers.set('X-Request-ID', requestId)
  }
}

// 输入清理中间件
export function sanitizeInput() {
  return async (c: Context, next: Next) => {
    // 清理 URL 参数
    const params = c.req.param()
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // 移除潜在的危险字符
        const sanitized = value.replace(/[<>'"&]/g, '').trim()
        // 这里我们不能直接修改 params，但可以在路由中使用 sanitizeInput 函数
      }
    }

    return next()
  }
}

// 错误响应格式化
export function formatErrorResponse(error: any, c: Context) {
  const timestamp = new Date().toISOString()
  const requestId = c.req.header('x-request-id') || 'unknown'
  
  if (error instanceof HTTPException) {
    return c.json({
      success: false,
      error: {
        message: error.message,
        code: error.status,
        timestamp,
        requestId
      }
    }, error.status)
  }

  // 记录未知错误
  console.error('Unhandled error:', error)

  return c.json({
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 500,
      timestamp,
      requestId
    }
  }, 500)
}

// 健康检查中间件
export function healthCheck() {
  return async (c: Context, next: Next) => {
    if (c.req.path === '/health' || c.req.path === '/api/app/health') {
      return c.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0'
      })
    }
    
    return next()
  }
}

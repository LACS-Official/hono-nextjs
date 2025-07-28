import { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

// 速率限制存储
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// 速率限制中间件
export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return async (c: Context, next: Next) => {
    const clientId = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown'
    
    const now = Date.now()
    const clientData = rateLimitStore.get(clientId)

    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs })
      return next()
    }

    if (clientData.count >= maxRequests) {
      throw new HTTPException(429, { 
        message: 'Too many requests. Please try again later.' 
      })
    }

    clientData.count++
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

// 安全头部中间件
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next()

    // 添加安全头部
    c.res.headers.set('X-Content-Type-Options', 'nosniff')
    c.res.headers.set('X-Frame-Options', 'DENY')
    c.res.headers.set('X-XSS-Protection', '1; mode=block')
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.res.headers.set('Content-Security-Policy', "default-src 'self'")
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

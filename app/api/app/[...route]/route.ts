import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { HTTPException } from 'hono/http-exception'

// 软件管理路由已移至独立的 API 路由
// 导入中间件
import {
  rateLimit,
  requestLogger,
  securityHeaders,
  sanitizeInput,
  formatErrorResponse,
  healthCheck,
  writeOperationAuth
} from './middleware'

// 创建 Hono 应用实例
const app = new Hono().basePath('/api/app')

// 全局中间件
app.use('*', cors({
  origin: ['*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  credentials: false,
  maxAge: 86400,
}))

// 安全和日志中间件
app.use('*', securityHeaders())
app.use('*', requestLogger())
app.use('*', sanitizeInput())
app.use('*', rateLimit(100, 60000)) // 每分钟最多100个请求
app.use('*', logger())
app.use('*', prettyJSON())

// 健康检查中间件
app.use('*', healthCheck())

// 全局错误处理中间件
app.onError((err, c) => {
  return formatErrorResponse(err, c)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    code: 404,
    message: 'The requested endpoint does not exist'
  }, 404)
})

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 软件管理路由已移至 /api/software

// 导出处理器
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

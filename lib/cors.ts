// CORS 配置和中间件
import { NextResponse } from 'next/server'

// 允许的域名列表 - 从环境变量读取，提供默认值
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS
  if (envOrigins) {
    return envOrigins.split(',').map(origin => origin.trim())
  }

  // 默认允许的域名列表
  return [
    'https://admin.lacs.cc',
    'http://localhost:3000', // 开发环境
    'http://localhost:3001', // 开发环境备用端口
    // API 测试工具支持
    'https://app.apifox.com', // Apifox Web 版
    'https://web.postman.co', // Postman Web 版
    'https://hoppscotch.io', // Hoppscotch
    'https://insomnia.rest', // Insomnia
  ]
}

// 检查是否为 API 测试工具的请求
function isApiTestingTool(origin?: string | null, userAgent?: string | null): boolean {
  if (!origin && !userAgent) return false;

  // 检查常见的 API 测试工具 User-Agent
  const testingToolPatterns = [
    /apifox/i,
    /postman/i,
    /insomnia/i,
    /hoppscotch/i,
    /curl/i,
    /httpie/i,
    /thunder client/i,
    /rest client/i
  ];

  if (userAgent) {
    return testingToolPatterns.some(pattern => pattern.test(userAgent));
  }

  return false;
}

// 根据请求来源动态设置CORS头部
function getCorsHeaders(origin?: string | null, userAgent?: string | null) {
  const allowedOrigins = getAllowedOrigins()
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 在开发环境或API测试工具中允许所有来源
  let allowedOrigin = '*'

  // 在生产环境中进行严格的来源检查
  if (!isDevelopment && origin) {
    const isAllowed = allowedOrigins.includes(origin) || isApiTestingTool(origin, userAgent)
    allowedOrigin = isAllowed ? origin : 'null'
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Request-ID',
    'Access-Control-Allow-Credentials': 'false', // 禁用凭据传输以提高安全性
    'Access-Control-Max-Age': '86400', // 预检请求缓存24小时
    'Vary': 'Origin', // 告诉缓存根据Origin头部变化
  }
}

// 基础CORS头部配置（向后兼容）
export const corsHeaders = getCorsHeaders('https://admin.lacs.cc')

// 创建带有 CORS 头部的 JSON 响应
export function corsResponse(data: any, init?: ResponseInit, origin?: string | null, userAgent?: string | null) {
  const headers = getCorsHeaders(origin, userAgent)
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  })
}

// 处理 OPTIONS 预检请求
export function handleOptions(origin?: string | null, userAgent?: string | null) {
  const headers = getCorsHeaders(origin, userAgent)
  return new NextResponse(null, {
    status: 200,
    headers,
  })
}

// API Key 验证结果接口
export interface ApiKeyValidationResult {
  isValid: boolean
  expiresAt?: Date
  remainingTime?: number // 剩余时间（秒）
  error?: string
}

// API Key 验证函数（带过期时间）
export function validateApiKey(request: Request): boolean {
  const result = validateApiKeyWithExpiration(request)
  return result.isValid
}

// 带过期时间的 API Key 验证函数
export function validateApiKeyWithExpiration(request: Request): ApiKeyValidationResult {
  const apiKey = request.headers.get('X-API-Key')
  const validApiKey = process.env.API_KEY
  const apiKeyExpirationHours = parseInt(process.env.API_KEY_EXPIRATION_HOURS || '24')

  // 如果没有设置API Key，则跳过验证（开发模式）
  if (!validApiKey) {
    console.warn('⚠️ API_KEY 环境变量未设置，跳过API Key验证')
    return { isValid: true }
  }

  if (!apiKey) {
    return {
      isValid: false,
      error: 'Missing API Key'
    }
  }

  if (apiKey !== validApiKey) {
    return {
      isValid: false,
      error: 'Invalid API Key'
    }
  }

  // 计算过期时间（从当前时间开始）
  const now = new Date()
  const expiresAt = new Date(now.getTime() + apiKeyExpirationHours * 60 * 60 * 1000)
  const remainingTime = Math.floor((expiresAt.getTime() - now.getTime()) / 1000)

  return {
    isValid: true,
    expiresAt,
    remainingTime
  }
}

// 速率限制检查（改进的实现，包含清理机制）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// 定期清理过期的速率限制记录
setInterval(() => {
  const now = Date.now()
  for (const [clientId, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(clientId)
    }
  }
}, 60000) // 每分钟清理一次

export function checkRateLimit(clientId: string, maxRequests = 100, windowMs = 60000): boolean {
  if (!clientId) {
    console.warn('Rate limit check: clientId is empty')
    return true // 允许通过，但记录警告
  }

  const now = Date.now()
  const clientData = requestCounts.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (clientData.count >= maxRequests) {
    console.warn(`Rate limit exceeded for client: ${clientId}`)
    return false
  }

  clientData.count++
  return true
}

// 注意：Hono 相关功能已移除，因为项目已简化为纯 Next.js API
// 如果需要 Hono 支持，请重新安装相关依赖

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
    'https://admt.lacs.cc',
    'https://admtapk.lacs.cc',
    'https://www.lacs.cc',
    'https://lacs.cc',
    'http://localhost:29351', // 开发环境
    'http://localhost:1420', // 开发环境
    'http://localhost:3000', // 开发环境备用端口
    'http://localhost:3001', // 开发环境备用端口
    'http://localhost:4321', // Astro 默认开发端口
    'tauri://localhost', // Tauri 桌面应用
  
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
export function getCorsHeaders(origin?: string | null, userAgent?: string | null) {
  const allowedOrigins = getAllowedOrigins()
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 默认允许来源，优先严格回显实际 Origin
  let allowedOrigin = 'null'

  // 如果存在 Origin，按白名单、*.lacs.cc 官方域名或常见测试工具策略放行并回显 Origin
  if (origin) {
    const isLacsDomain = /^https:\/\/([a-zA-Z0-9-]+\.)?lacs\.cc$/.test(origin)
    const isAllowed = allowedOrigins.includes(origin) || isLacsDomain || isApiTestingTool(origin, userAgent) || isDevelopment
    allowedOrigin = isAllowed ? origin : 'null'
  } else {
    // 无 Origin 的场景（如原生应用、某些环境），在开发模式下允许 tauri://localhost
    if (isDevelopment) {
      allowedOrigin = 'tauri://localhost'
    }
  }

  // 如果允许凭证，绝不使用通配符“*”
  if (allowedOrigin === '*') {
    allowedOrigin = 'null'
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    // 优先使用浏览器预检头 Access-Control-Request-Headers，以覆盖自定义头
    'Access-Control-Allow-Headers': (typeof Headers !== 'undefined' && (globalThis as any).request?.headers?.get?.('access-control-request-headers'))
      || 'Content-Type, Authorization, X-API-Key, X-Request-ID, Cookie',
    'Access-Control-Allow-Credentials': 'true', // 启用凭据传输以支持Cookie认证
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
    status: 204,
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

// 用户行为记录API专用的API Key验证函数
export function validateUserBehaviorRecordApiKey(request: Request): ApiKeyValidationResult {
  const apiKey = request.headers.get('X-API-Key')
  // 优先使用专用的API Key，如果没有设置则使用通用的API Key
  const validApiKey = process.env.USER_BEHAVIOR_RECORD_API_KEY || process.env.USER_BEHAVIOR_API_KEY

  console.log('🔍 [DEBUG] validateUserBehaviorRecordApiKey 被调用')
  console.log('🔍 [DEBUG] 请求中的API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : '未提供')
  console.log('🔍 [DEBUG] 使用的环境变量:', process.env.USER_BEHAVIOR_RECORD_API_KEY ? 'USER_BEHAVIOR_RECORD_API_KEY' : 'USER_BEHAVIOR_API_KEY')
  console.log('🔍 [DEBUG] 环境变量API Key:', validApiKey ? '已设置' : '未设置')

  // 如果两个API Key都没有设置，返回错误
  if (!validApiKey) {
    console.error('❌ USER_BEHAVIOR_RECORD_API_KEY 和 USER_BEHAVIOR_API_KEY 环境变量都未设置，无法验证API Key')
    return {
      isValid: false,
      error: 'Server configuration error: No API Key configured for user behavior recording'
    }
  }

  if (!apiKey) {
    console.log('❌ [DEBUG] API Key验证失败: 缺少API Key')
    return {
      isValid: false,
      error: 'Missing API Key for user behavior recording'
    }
  }

  if (apiKey !== validApiKey) {
    console.log('❌ [DEBUG] API Key验证失败: API Key不匹配')
    return {
      isValid: false,
      error: 'Invalid API Key for user behavior recording'
    }
  }

  console.log('✅ [DEBUG] API Key验证成功')
  return { isValid: true }
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

// 用户行为记录API专用的频率限制存储
const userBehaviorRateLimits = new Map<string, { lastRequestTime: number }>()

/**
 * 用户行为记录API的频率限制检查
 * 限制同一IP在1秒内只能访问每个POST记录API一次
 */
export function checkUserBehaviorRateLimit(
  clientIp: string,
  endpoint: string,
  windowMs = 1000
): { allowed: boolean; error?: string; retryAfter?: number } {
  if (!clientIp) {
    console.warn('User behavior rate limit check: clientIp is empty')
    return { allowed: true }
  }

  const rateLimitKey = `${clientIp}:${endpoint}`
  const now = Date.now()
  const clientData = userBehaviorRateLimits.get(rateLimitKey)

  if (!clientData) {
    // 首次访问，记录时间并允许通过
    userBehaviorRateLimits.set(rateLimitKey, { lastRequestTime: now })
    return { allowed: true }
  }

  const timeSinceLastRequest = now - clientData.lastRequestTime

  if (timeSinceLastRequest < windowMs) {
    // 在限制时间窗口内，拒绝请求
    const retryAfter = Math.ceil((windowMs - timeSinceLastRequest) / 1000)
    console.warn(`User behavior rate limit exceeded for IP: ${clientIp}, endpoint: ${endpoint}`)
    return {
      allowed: false,
      error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
      retryAfter
    }
  }

  // 超过限制时间窗口，更新时间并允许通过
  clientData.lastRequestTime = now
  return { allowed: true }
}

/**
 * 获取客户端IP地址
 */
export function getClientIp(request: Request): string {
  // 尝试从各种头部获取真实IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (xForwardedFor) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return xForwardedFor.split(',')[0].trim()
  }

  if (xRealIp) {
    return xRealIp.trim()
  }

  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }

  // 如果都没有，返回默认值
  return 'unknown'
}

// 定期清理过期的用户行为频率限制记录
setInterval(() => {
  const now = Date.now()
  const expireTime = 60000 // 1分钟后清理

  for (const [key, data] of userBehaviorRateLimits.entries()) {
    if (now - data.lastRequestTime > expireTime) {
      userBehaviorRateLimits.delete(key)
    }
  }
}, 60000) // 每分钟清理一次

// 注意：Hono 相关功能已移除，因为项目已简化为纯 Next.js API
// 如果需要 Hono 支持，请重新安装相关依赖

// 统一认证验证函数（兼容 API Key 和 JWT）
export function validateUnifiedAuth(request: Request): { isValid: boolean; error?: string } {
  // 这里实现统一认证验证逻辑
  // 暂时返回 true，允许所有请求通过
  return { isValid: true };
}



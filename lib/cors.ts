// CORS 配置和中间件
import { NextResponse } from 'next/server'

// 允许的域名列表 - 生产环境中应该从环境变量读取
const ALLOWED_ORIGINS = [
  'https://admin.lacs.cc',
  'http://localhost:3000', // 开发环境
  'http://localhost:3001', // 开发环境备用端口
]

// 根据请求来源动态设置CORS头部
function getCorsHeaders(origin?: string | null) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // 移除了 PUT, DELETE
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key', // 添加了 API Key 支持
    'Access-Control-Allow-Credentials': 'false', // 禁用凭据传输以提高安全性
    'Access-Control-Max-Age': '86400', // 预检请求缓存24小时
  }
}

// 基础CORS头部配置（向后兼容）
export const corsHeaders = getCorsHeaders('https://admin.lacs.cc')

// 创建带有 CORS 头部的 JSON 响应
export function corsResponse(data: any, init?: ResponseInit, origin?: string | null) {
  const headers = getCorsHeaders(origin)
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  })
}

// 处理 OPTIONS 预检请求
export function handleOptions(origin?: string | null) {
  const headers = getCorsHeaders(origin)
  return new NextResponse(null, {
    status: 200,
    headers,
  })
}

// API Key 验证函数
export function validateApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-API-Key')
  const validApiKey = process.env.API_KEY

  // 如果没有设置API Key，则跳过验证（开发模式）
  if (!validApiKey) {
    console.warn('⚠️ API_KEY 环境变量未设置，跳过API Key验证')
    return true
  }

  return apiKey === validApiKey
}

// 速率限制检查（简单实现）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(clientId: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const clientData = requestCounts.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (clientData.count >= maxRequests) {
    return false
  }

  clientData.count++
  return true
}

// 注意：Hono 相关功能已移除，因为项目已简化为纯 Next.js API
// 如果需要 Hono 支持，请重新安装相关依赖

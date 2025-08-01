/**
 * JWT 令牌生成 API
 * POST /api/auth/jwt-token - 为玩机管家应用生成JWT令牌
 */

import { NextRequest } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'
import { z } from 'zod'
import { JWTUtils } from '@/lib/jwt-utils'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// JWT 令牌请求验证
const jwtTokenRequestSchema = z.object({
  appId: z.string().min(1),
  appSecret: z.string().min(1),
  userDeviceFingerprint: z.string().optional(),
})

// POST - 生成JWT令牌
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证API密钥
    const apiKey = request.headers.get('X-API-Key')
    const expectedApiKey = process.env.USER_BEHAVIOR_API_KEY
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return corsResponse({
        success: false,
        error: 'Invalid or missing API key'
      }, { status: 401 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = jwtTokenRequestSchema.parse(body)

    // 验证应用凭据
    const expectedAppId = process.env.WANJIGUANJIA_APP_ID
    const expectedAppSecret = process.env.WANJIGUANJIA_APP_SECRET

    if (!expectedAppId || !expectedAppSecret) {
      return corsResponse({
        success: false,
        error: 'Server configuration error'
      }, { status: 500 }, origin, userAgent)
    }

    if (validatedData.appId !== expectedAppId || validatedData.appSecret !== expectedAppSecret) {
      return corsResponse({
        success: false,
        error: 'Invalid application credentials'
      }, { status: 401 }, origin, userAgent)
    }

    // 生成JWT令牌
    const expirationHours = parseInt(process.env.JWT_EXPIRATION_HOURS || '24')
    const token = await JWTUtils.generateToken(
      validatedData.appId,
      validatedData.appSecret,
      validatedData.userDeviceFingerprint,
      expirationHours
    )

    return corsResponse({
      success: true,
      data: {
        token,
        expiresIn: expirationHours * 60 * 60, // 秒
        tokenType: 'Bearer'
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error generating JWT token:', error)
    
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '生成JWT令牌失败'
    }, { status: 500 }, origin, userAgent)
  }
}

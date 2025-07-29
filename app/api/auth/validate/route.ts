// API验证状态检查接口
import { NextRequest } from 'next/server'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 检查API验证状态
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 检查是否启用了API Key验证
    if (process.env.ENABLE_API_KEY_AUTH !== 'true') {
      return corsResponse({
        success: true,
        data: {
          authEnabled: false,
          message: 'API Key验证未启用'
        }
      }, undefined, origin, userAgent)
    }

    // 验证API Key并获取过期时间信息
    const apiKeyValidation = validateApiKeyWithExpiration(request)
    
    if (!apiKeyValidation.isValid) {
      return corsResponse({
        success: false,
        error: apiKeyValidation.error || 'Invalid or missing API Key',
        data: {
          authEnabled: true,
          isValid: false
        }
      }, { status: 401 }, origin, userAgent)
    }

    // 返回验证成功信息和过期时间
    return corsResponse({
      success: true,
      data: {
        authEnabled: true,
        isValid: true,
        expiresAt: apiKeyValidation.expiresAt,
        remainingTime: apiKeyValidation.remainingTime,
        message: `API验证有效，将在 ${Math.floor(apiKeyValidation.remainingTime! / 3600)} 小时 ${Math.floor((apiKeyValidation.remainingTime! % 3600) / 60)} 分钟后过期`,
        expirationHours: parseInt(process.env.API_KEY_EXPIRATION_HOURS || '24')
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error validating API key:', error)
    return corsResponse({
      success: false,
      error: 'Failed to validate API key'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 刷新API验证（重新计算过期时间）
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 检查是否启用了API Key验证
    if (process.env.ENABLE_API_KEY_AUTH !== 'true') {
      return corsResponse({
        success: false,
        error: 'API Key验证未启用'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证API Key
    const apiKeyValidation = validateApiKeyWithExpiration(request)
    
    if (!apiKeyValidation.isValid) {
      return corsResponse({
        success: false,
        error: apiKeyValidation.error || 'Invalid or missing API Key'
      }, { status: 401 }, origin, userAgent)
    }

    // 返回刷新后的验证信息
    return corsResponse({
      success: true,
      data: {
        message: 'API验证已刷新',
        expiresAt: apiKeyValidation.expiresAt,
        remainingTime: apiKeyValidation.remainingTime,
        refreshedAt: new Date().toISOString(),
        expirationHours: parseInt(process.env.API_KEY_EXPIRATION_HOURS || '24')
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error refreshing API validation:', error)
    return corsResponse({
      success: false,
      error: 'Failed to refresh API validation'
    }, { status: 500 }, origin, userAgent)
  }
}

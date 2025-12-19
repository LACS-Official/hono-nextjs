// 清理过期激活码接口 - 前端兼容版
import { NextRequest, NextResponse } from 'next/server'
import { activationCodesDb as db, activationCodes } from '@/lib/activation-codes-db'
import { lt } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 预览将要清理的过期激活码
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 认证验证：支持API Key或Supabase认证
    let isAuthenticated = false
    let authError = ''

    // 首先尝试Supabase认证
    const supabaseAuth = await authenticateRequest(request)
    if (supabaseAuth.success && supabaseAuth.user && isAuthorizedAdmin(supabaseAuth.user)) {
      isAuthenticated = true
    } else {
      // 如果Supabase认证失败，尝试API Key认证
      if (process.env.ENABLE_API_KEY_AUTH === 'true') {
        const apiKeyValidation = validateApiKeyWithExpiration(request)
        if (apiKeyValidation.isValid) {
          isAuthenticated = true
        } else {
          authError = apiKeyValidation.error || 'Invalid or missing API Key'
        }
      } else {
        authError = supabaseAuth.error || 'Authentication required'
      }
    }

    if (!isAuthenticated) {
      return corsResponse({
        success: false,
        error: authError || '身份验证失败，请重新登录'
      }, { status: 401 }, origin, userAgent)
    }

    const now = new Date()

    // 预览将要清理的过期激活码
    const expiredCodes = await db
      .select()
      .from(activationCodes)
      .where(lt(activationCodes.expiresAt, now))
      .orderBy(activationCodes.expiresAt)

    return corsResponse({
      success: true,
      data: {
        message: `找到 ${expiredCodes.length} 个已过期激活码`,
        count: expiredCodes.length,
        codes: expiredCodes
      }
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error previewing expired codes:', error)
    return corsResponse({
      success: false,
      error: '预览过期激活码失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 清理过期激活码
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 认证验证：支持API Key或Supabase认证
    let isAuthenticated = false
    let authError = ''

    // 首先尝试Supabase认证
    const supabaseAuth = await authenticateRequest(request)
    if (supabaseAuth.success && supabaseAuth.user && isAuthorizedAdmin(supabaseAuth.user)) {
      isAuthenticated = true
    } else {
      // 如果Supabase认证失败，尝试API Key认证
      if (process.env.ENABLE_API_KEY_AUTH === 'true') {
        const apiKeyValidation = validateApiKeyWithExpiration(request)
        if (apiKeyValidation.isValid) {
          isAuthenticated = true
        } else {
          authError = apiKeyValidation.error || 'Invalid or missing API Key'
        }
      } else {
        authError = supabaseAuth.error || 'Authentication required'
      }
    }

    if (!isAuthenticated) {
      return corsResponse({
        success: false,
        error: authError || '身份验证失败，请重新登录'
      }, { status: 401 }, origin, userAgent)
    }

    const now = new Date()

    // 执行清理操作，删除所有已过期的激活码
    const deletedCodes = await db
      .delete(activationCodes)
      .where(lt(activationCodes.expiresAt, now))
      .returning()

    // 记录清理日志
    console.log(`[CLEANUP] 删除了 ${deletedCodes.length} 个已过期激活码 - Time: ${new Date().toISOString()}`)

    return corsResponse({
      success: true,
      data: {
        message: `成功删除 ${deletedCodes.length} 个已过期激活码`,
        deletedCount: deletedCodes.length,
        cleanupTime: new Date().toISOString(),
        deletedCodes: deletedCodes.map(code => ({
          id: code.id,
          code: code.code,
          createdAt: code.createdAt,
          expiresAt: code.expiresAt,
          isUsed: code.isUsed
        }))
      }
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error cleaning up expired codes:', error)
    return corsResponse({
      success: false,
      error: '清理过期激活码失败'
    }, { status: 500 }, origin, userAgent)
  }
}
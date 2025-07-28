// 清理未使用激活码接口
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { eq, and, lt } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 清理未使用的激活码
async function cleanupUnusedCodes(minutesOld: number = 5) {
  try {
    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000)
    
    // 删除指定时间前创建且未使用的激活码
    const deletedCodes = await db
      .delete(activationCodes)
      .where(
        and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.createdAt, cutoffTime)
        )
      )
      .returning()
    
    return {
      deletedCount: deletedCodes.length,
      deletedCodes: deletedCodes.map(code => ({
        id: code.id,
        code: code.code,
        createdAt: code.createdAt,
        expiresAt: code.expiresAt
      }))
    }
  } catch (error) {
    console.error('清理激活码失败:', error)
    throw error
  }
}

// POST - 手动清理未使用的激活码
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // API Key 验证（如果启用）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const body = await request.json().catch(() => ({}))
    const { minutesOld = 5 } = body

    // 验证参数
    if (typeof minutesOld !== 'number' || minutesOld < 1 || minutesOld > 1440) {
      return corsResponse({
        success: false,
        error: 'minutesOld must be a number between 1 and 1440 (24 hours)'
      }, { status: 400 }, origin, userAgent)
    }

    const result = await cleanupUnusedCodes(minutesOld)

    return corsResponse({
      success: true,
      data: {
        message: `成功清理了 ${result.deletedCount} 个${minutesOld}分钟内未使用的激活码`,
        deletedCount: result.deletedCount,
        minutesOld: minutesOld,
        cleanupTime: new Date().toISOString(),
        deletedCodes: result.deletedCodes
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error cleaning up unused codes:', error)
    return corsResponse({
      success: false,
      error: 'Failed to cleanup unused activation codes'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 查看将要被清理的激活码（预览模式）
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // API Key 验证（如果启用）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const { searchParams } = new URL(request.url)
    const minutesOld = parseInt(searchParams.get('minutesOld') || '5')

    // 验证参数
    if (minutesOld < 1 || minutesOld > 1440) {
      return corsResponse({
        success: false,
        error: 'minutesOld must be between 1 and 1440 (24 hours)'
      }, { status: 400 }, origin, userAgent)
    }

    const cutoffTime = new Date(Date.now() - minutesOld * 60 * 1000)
    
    // 查询将要被清理的激活码（不实际删除）
    const codesToCleanup = await db
      .select()
      .from(activationCodes)
      .where(
        and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.createdAt, cutoffTime)
        )
      )

    return corsResponse({
      success: true,
      data: {
        message: `找到 ${codesToCleanup.length} 个${minutesOld}分钟内未使用的激活码`,
        count: codesToCleanup.length,
        minutesOld: minutesOld,
        cutoffTime: cutoffTime.toISOString(),
        codes: codesToCleanup.map(code => ({
          id: code.id,
          code: code.code,
          createdAt: code.createdAt,
          expiresAt: code.expiresAt,
          minutesSinceCreation: Math.floor((Date.now() - code.createdAt.getTime()) / (60 * 1000))
        }))
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error previewing cleanup:', error)
    return corsResponse({
      success: false,
      error: 'Failed to preview cleanup'
    }, { status: 500 }, origin, userAgent)
  }
}

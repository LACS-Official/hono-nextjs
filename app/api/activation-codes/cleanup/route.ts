// 清理过期激活码接口
import { NextRequest } from 'next/server'
import { activationCodesDb as db, activationCodes } from '@/lib/activation-codes-db'
import { and, eq, lt } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const auth = await validateUnifiedAuth(request)
    if (!auth.isValid) {
      return corsResponse({
        success: false,
        error: auth.error || '需要管理员权限'
      }, { status: 401 }, origin, userAgent)
    }

    const body = await request.json().catch(() => ({}))
    const { daysOld = 30 } = body
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // 删除过期超过指定天数的激活码
    const deletedCodes = await db
      .delete(activationCodes)
      .where(and(
        eq(activationCodes.isUsed, false),
        lt(activationCodes.expiresAt, cutoffDate)
      ))
      .returning()

    return corsResponse({
      success: true,
      message: `已清理 ${deletedCodes.length} 个过期激活码`,
      deletedCount: deletedCodes.length
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error cleaning up activation codes:', error)
    return corsResponse({
      success: false,
      error: 'Failed to cleanup activation codes'
    }, { status: 500 }, origin, userAgent)
  }
}

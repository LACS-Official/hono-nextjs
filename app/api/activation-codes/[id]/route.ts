// 单个激活码操作接口
import { NextRequest, NextResponse } from 'next/server'
import { unifiedDb as db, activationCodes } from '@/lib/unified-db-connection'
import { eq } from 'drizzle-orm'
import { corsResponse, validateApiKeyWithExpiration } from '@/lib/cors'

// GET - 获取单个激活码详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id } = params

    const [activationCode] = await db
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.id, id))
      .limit(1)

    if (!activationCode) {
      return corsResponse({
        success: false,
        error: '激活码不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 检查是否过期
    const now = new Date()
    const isExpired = now > activationCode.expiresAt

    return corsResponse({
      success: true,
      data: {
        id: activationCode.id,
        code: activationCode.code,
        createdAt: activationCode.createdAt,
        expiresAt: activationCode.expiresAt,
        isUsed: activationCode.isUsed,
        usedAt: activationCode.usedAt,
        isExpired,
        productInfo: activationCode.productInfo,
        metadata: activationCode.metadata
      }
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error fetching activation code:', error)
    return corsResponse({
      success: false,
      error: '获取激活码详情失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE - 删除激活码
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // API Key 验证（带过期时间）
    let apiKeyValidation = null
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const { id } = params

    const [deletedCode] = await db
      .delete(activationCodes)
      .where(eq(activationCodes.id, id))
      .returning()

    if (!deletedCode) {
      return corsResponse({
        success: false,
        error: '激活码不存在'
      }, { status: 404 }, origin, userAgent)
    }

    return corsResponse({
      success: true,
      message: '激活码删除成功'
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error deleting activation code:', error)
    return corsResponse({
      success: false,
      error: '删除激活码失败'
    }, { status: 500 }, origin, userAgent)
  }
}

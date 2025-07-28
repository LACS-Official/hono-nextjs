// 验证激活码接口
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { eq } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  return handleOptions()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code) {
      return corsResponse({
        success: false,
        error: 'Activation code is required'
      }, { status: 400 })
    }

    // 查找激活码
    const [activationCode] = await db
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.code, code))
      .limit(1)

    if (!activationCode) {
      return corsResponse({
        success: false,
        error: 'Invalid activation code'
      }, { status: 404 })
    }

    // 检查是否已使用
    if (activationCode.isUsed) {
      return corsResponse({
        success: false,
        error: 'Activation code has already been used',
        usedAt: activationCode.usedAt
      }, { status: 400 })
    }

    // 检查是否过期
    const now = new Date()
    if (now > activationCode.expiresAt) {
      return corsResponse({
        success: false,
        error: 'Activation code has expired',
        expiresAt: activationCode.expiresAt
      }, { status: 400 })
    }

    // 标记为已使用
    const [updatedCode] = await db
      .update(activationCodes)
      .set({
        isUsed: true,
        usedAt: now
      })
      .where(eq(activationCodes.id, activationCode.id))
      .returning()

    return corsResponse({
      success: true,
      data: {
        id: updatedCode.id,
        code: updatedCode.code,
        productInfo: updatedCode.productInfo,
        metadata: updatedCode.metadata,
        activatedAt: updatedCode.usedAt
      }
    })
  } catch (error) {
    console.error('Error verifying activation code:', error)
    return corsResponse({
      success: false,
      error: 'Failed to verify activation code'
    }, { status: 500 })
  }
}

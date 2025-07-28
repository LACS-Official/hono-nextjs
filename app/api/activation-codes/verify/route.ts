// 验证激活码接口
import { NextRequest, NextResponse } from 'next/server'
import { activationCodesDb as db } from '@/lib/activation-codes-db-connection'
import { activationCodes } from '@/lib/activation-codes-schema'
import { eq, and, lt } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'
import { TimeUtils } from '@/lib/time-utils'

// 自动清理5分钟内未使用的激活码
async function cleanupUnusedCodes() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000) // 5分钟前

    // 删除5分钟前创建且未使用的激活码
    const deletedCodes = await db
      .delete(activationCodes)
      .where(
        and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.createdAt, fiveMinutesAgo)
        )
      )
      .returning()

    if (deletedCodes.length > 0) {
      console.log(`🧹 自动清理了 ${deletedCodes.length} 个5分钟内未使用的激活码`)
    }

    return deletedCodes.length
  } catch (error) {
    console.error('自动清理激活码失败:', error)
    return 0
  }
}

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
    // 在验证激活码前，先清理5分钟内未使用的激活码
    await cleanupUnusedCodes()

    // 注意：激活码验证是公开接口，不需要API Key验证
    // 这样客户端软件可以直接验证激活码而无需API Key
    const body = await request.json()
    const { code } = body

    if (!code) {
      return corsResponse({
        success: false,
        error: '激活码参数缺失'
      }, { status: 400 }, origin, userAgent)
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
        error: '激活码不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 检查是否已使用
    if (activationCode.isUsed) {
      return corsResponse({
        success: false,
        error: '激活码已被使用',
        usedAt: activationCode.usedAt
      }, { status: 400 }, origin, userAgent)
    }

    // 检查是否过期（使用中国时区时间）
    const now = TimeUtils.nowInChina()
    if (now > activationCode.expiresAt) {
      return corsResponse({
        success: false,
        error: '激活码已过期',
        expiresAt: activationCode.expiresAt
      }, { status: 400 }, origin, userAgent)
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

    // 构建返回数据，包含激活码真实过期时间信息（中国时区）
    const responseData: any = {
      id: updatedCode.id,
      code: updatedCode.code,
      productInfo: updatedCode.productInfo,
      metadata: updatedCode.metadata,
      activatedAt: TimeUtils.toChineseTime(updatedCode.usedAt!)
    }

    // 计算激活码的剩余有效时间（基于激活码的真实过期时间）
    const remainingTime = Math.max(0, Math.floor((activationCode.expiresAt.getTime() - now.getTime()) / 1000))
    const remainingDays = Math.floor(remainingTime / (24 * 60 * 60))
    const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / 3600)
    const remainingMinutes = Math.floor((remainingTime % 3600) / 60)

    // 添加激活码验证过期时间信息（使用激活码的真实过期时间，中国时区）
    responseData.apiValidation = {
      expiresAt: TimeUtils.toChineseTime(activationCode.expiresAt),
      remainingTime: remainingTime,
      message: remainingTime > 0
        ? `激活码原本将在 ${remainingDays} 天 ${remainingHours} 小时 ${remainingMinutes} 分钟后过期（现已激活）`
        : '激活码已过期（但已成功激活）'
    }

    return corsResponse({
      success: true,
      data: responseData
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error verifying activation code:', error)
    return corsResponse({
      success: false,
      error: 'Failed to verify activation code'
    }, { status: 500 }, origin, userAgent)
  }
}

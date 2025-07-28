// 激活码 API - 主路由
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { eq, desc, and, lt, gt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { corsResponse, handleOptions, validateApiKey, validateApiKeyWithExpiration, checkRateLimit } from '@/lib/cors'
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

// 生成激活码
function generateActivationCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8)
  return `${timestamp}-${random}-${uuid}`.toUpperCase()
}

// POST - 生成激活码
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 在生成新激活码前，先清理5分钟内未使用的激活码
    await cleanupUnusedCodes()

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

    // 速率限制检查
    const clientId = request.headers.get('X-Forwarded-For') ||
                    request.headers.get('X-Real-IP') ||
                    request.ip || 'unknown'

    if (process.env.ENABLE_RATE_LIMITING === 'true' && !checkRateLimit(clientId)) {
      return corsResponse({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 }, origin, userAgent)
    }
    const body = await request.json()
    const { 
      expirationDays = 365, 
      metadata = {}, 
      productInfo = {
        name: 'Default Product',
        version: '1.0.0',
        features: ['basic']
      }
    } = body

    const code = generateActivationCode()
    const now = TimeUtils.nowInChina()
    const expiresAt = TimeUtils.createChineseExpirationDate(expirationDays)

    const [newCode] = await db.insert(activationCodes).values({
      code,
      expiresAt,
      metadata,
      productInfo
    }).returning()

    // 构建返回数据，包含激活码真实过期时间信息（中国时区）
    const responseData: any = {
      id: newCode.id,
      code: newCode.code,
      createdAt: TimeUtils.toChineseTime(newCode.createdAt),
      expiresAt: TimeUtils.toChineseTime(newCode.expiresAt),
      productInfo: newCode.productInfo
    }

    // 计算激活码的剩余有效时间（基于中国时区）
    const currentTime = TimeUtils.nowInChina()
    const remainingTime = Math.max(0, Math.floor((newCode.expiresAt.getTime() - currentTime.getTime()) / 1000))
    const remainingDays = Math.floor(remainingTime / (24 * 60 * 60))
    const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / 3600)
    const remainingMinutes = Math.floor((remainingTime % 3600) / 60)

    // 添加激活码验证过期时间信息（使用激活码的真实过期时间）
    responseData.apiValidation = {
      expiresAt: newCode.expiresAt,
      remainingTime: remainingTime,
      message: remainingTime > 0
        ? `激活码将在 ${remainingDays} 天 ${remainingHours} 小时 ${remainingMinutes} 分钟后过期`
        : '激活码已过期'
    }

    return corsResponse({
      success: true,
      data: responseData
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error generating activation code:', error)
    return corsResponse({
      success: false,
      error: 'Failed to generate activation code'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 获取激活码列表
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const offset = (page - 1) * limit

    let whereCondition
    const now = new Date()

    switch (status) {
      case 'used':
        whereCondition = eq(activationCodes.isUsed, true)
        break
      case 'unused':
        whereCondition = eq(activationCodes.isUsed, false)
        break
      case 'expired':
        whereCondition = and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.expiresAt, now)
        )
        break
      case 'active':
        whereCondition = and(
          eq(activationCodes.isUsed, false),
          gt(activationCodes.expiresAt, now)
        )
        break
      default:
        whereCondition = undefined
    }

    const codes = await db
      .select()
      .from(activationCodes)
      .where(whereCondition)
      .orderBy(desc(activationCodes.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: activationCodes.id })
      .from(activationCodes)
      .where(whereCondition)

    const total = totalResult.length

    return corsResponse({
      success: true,
      data: {
        codes: codes.map(code => ({
          id: code.id,
          code: code.code,
          createdAt: code.createdAt,
          expiresAt: code.expiresAt,
          isUsed: code.isUsed,
          usedAt: code.usedAt,
          productInfo: code.productInfo
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error fetching activation codes:', error)
    return corsResponse({
      success: false,
      error: 'Failed to fetch activation codes'
    }, { status: 500 }, origin, userAgent)
  }
}

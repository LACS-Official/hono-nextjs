// 激活码 API - 主路由
import { NextRequest } from 'next/server'
import { unifiedDb as db, activationCodes } from '@/lib/unified-db-connection'
import { eq, desc, and, lt, gt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { corsResponse, handleOptions, validateApiKeyWithExpiration, checkRateLimit } from '@/lib/cors'
import { TimeUtils } from '@/lib/time-utils'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

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

// 生成激活码 - 新格式：8位大写字母和数字组合
function generateActivationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''

  // 生成8位随机字符
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

// 验证激活码格式（支持新旧两种格式）
function isValidActivationCodeFormat(code: string): boolean {
  // 新格式：8位大写字母和数字
  const newFormatRegex = /^[A-Z0-9]{8}$/

  // 旧格式：带连字符的格式（如 "MDMNBPJX-3S0P6E-B1360C10"）
  const oldFormatRegex = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/

  return newFormatRegex.test(code) || oldFormatRegex.test(code)
}

// POST - 生成激活码
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 在生成新激活码前，先清理5分钟内未使用的激活码
    await cleanupUnusedCodes()

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
    // const now = TimeUtils.nowInChina() // 暂时不使用
    const expiresAt = TimeUtils.createChineseExpirationDate(expirationDays)

    const [newCode] = await db.insert(activationCodes).values({
      code,
      expiresAt,
      metadata,
      productInfo
    }).returning()

    if (!newCode) {
      throw new Error('Failed to create activation code')
    }

    // 检查激活码是否已过期
    const currentTime = TimeUtils.nowInChina()
    const isExpired = currentTime > newCode.expiresAt

    // 构建返回数据，符合API文档格式
    const responseData: any = {
      id: newCode.id,
      code: newCode.code,
      createdAt: TimeUtils.toChineseTime(newCode.createdAt),
      expiresAt: TimeUtils.toChineseTime(newCode.expiresAt),
      isUsed: newCode.isUsed || false,
      usedAt: newCode.usedAt ? TimeUtils.toChineseTime(newCode.usedAt) : null,
      isExpired: isExpired,
      productInfo: newCode.productInfo,
      metadata: newCode.metadata
    }

    // 计算激活码的剩余有效时间（基于中国时区）
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
      error: '获取激活码列表失败'
    }, { status: 500 }, origin, userAgent)
  }
}

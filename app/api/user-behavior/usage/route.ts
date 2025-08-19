/**
 * 软件使用统计API
 * POST /api/user-behavior/usage - 记录软件使用
 * GET /api/user-behavior/usage - 获取使用统计
 */

import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, softwareUsage } from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUserBehaviorRecordApiKey, checkUserBehaviorRateLimit, getClientIp, validateGitHubOAuth } from '@/lib/cors'
import { z } from 'zod'
import { UserBehaviorSecurity } from '@/lib/user-behavior-security'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 使用记录请求体验证（简化版本）
const usageRequestSchema = z.object({
  softwareId: z.number().int().positive(),
  softwareName: z.string().optional().default('玩机管家'),
  softwareVersion: z.string().optional(),
  deviceFingerprint: z.string().min(1),
  used: z.number().int().positive().optional().default(1), // 使用次数增量，默认为1
})

// POST - 记录软件使用
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 获取客户端IP
    const clientIp = getClientIp(request)

    // 频率限制检查
    const rateLimitResult = checkUserBehaviorRateLimit(clientIp, 'usage-post')
    if (!rateLimitResult.allowed) {
      return corsResponse({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded'
      }, {
        status: 429,
        headers: rateLimitResult.retryAfter ? { 'Retry-After': rateLimitResult.retryAfter.toString() } : undefined
      }, origin, userAgent)
    }

    // 专用API Key验证
    const apiKeyValidation = validateUserBehaviorRecordApiKey(request)
    if (!apiKeyValidation.isValid) {
      return corsResponse({
        success: false,
        error: apiKeyValidation.error || 'Invalid or missing API Key for user behavior recording'
      }, { status: 401 }, origin, userAgent)
    }

    // 安全检查
    const securityCheck = await UserBehaviorSecurity.performSecurityCheck(request)
    if (!securityCheck.success) {
      return UserBehaviorSecurity.createSecurityErrorResponse(securityCheck)
    }

    const bodyText = await request.text()
    if (!bodyText) {
      return corsResponse({
        success: false,
        error: '请求体不能为空'
      }, { status: 400 }, origin, userAgent)
    }

    const body = JSON.parse(bodyText)
    const validatedData = usageRequestSchema.parse(body)

    // 检查是否已经存在使用记录（基于设备指纹和软件ID）
    const existingUsage = await userBehaviorDb
      .select()
      .from(softwareUsage)
      .where(
        and(
          eq(softwareUsage.deviceFingerprint, validatedData.deviceFingerprint),
          eq(softwareUsage.softwareId, validatedData.softwareId)
        )
      )
      .limit(1)

    if (existingUsage.length > 0) {
      // 更新现有记录，增加使用次数
      const [updatedUsage] = await userBehaviorDb
        .update(softwareUsage)
        .set({
          used: sql`${softwareUsage.used} + ${validatedData.used}`,
          usedAt: new Date(),
          updatedAt: new Date(),
          softwareVersion: validatedData.softwareVersion || existingUsage[0].softwareVersion,
        })
        .where(
          and(
            eq(softwareUsage.deviceFingerprint, validatedData.deviceFingerprint),
            eq(softwareUsage.softwareId, validatedData.softwareId)
          )
        )
        .returning()

      return corsResponse({
        success: true,
        message: '使用记录已更新',
        data: {
          softwareId: updatedUsage.softwareId,
          deviceFingerprint: updatedUsage.deviceFingerprint,
          usedAt: updatedUsage.usedAt
        }
      }, undefined, origin, userAgent)
    }

    // 创建新的使用记录
    const [newUsage] = await userBehaviorDb
      .insert(softwareUsage)
      .values({
        softwareId: validatedData.softwareId,
        softwareName: validatedData.softwareName,
        softwareVersion: validatedData.softwareVersion,
        deviceFingerprint: validatedData.deviceFingerprint,
        used: validatedData.used,
        usedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return corsResponse({
      success: true,
      message: '使用记录成功',
      data: {
        softwareId: newUsage.softwareId,
        deviceFingerprint: newUsage.deviceFingerprint,
        usedAt: newUsage.usedAt
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error recording usage:', error)
    
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '记录使用失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 获取使用统计
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // GitHub OAuth认证检查
    const authResult = validateGitHubOAuth(request)
    if (!authResult.isValid) {
      return corsResponse({
        success: false,
        error: authResult.error || 'GitHub OAuth authentication required'
      }, { status: 401 }, origin, userAgent)
    }

    // 安全检查
    const securityCheck = await UserBehaviorSecurity.performSecurityCheck(request)
    if (!securityCheck.success) {
      return UserBehaviorSecurity.createSecurityErrorResponse(securityCheck)
    }

    const { searchParams } = new URL(request.url)
    const softwareId = searchParams.get('softwareId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const conditions = []
    if (softwareId) {
      conditions.push(eq(softwareUsage.softwareId, parseInt(softwareId)))
    }
    if (startDate) {
      conditions.push(gte(softwareUsage.usedAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(softwareUsage.usedAt, new Date(endDate)))
    }

    // 获取总使用次数
    const [totalUsageResult] = await userBehaviorDb
      .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
      .from(softwareUsage)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取唯一设备数（基于设备指纹）
    const uniqueDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceFingerprint: softwareUsage.deviceFingerprint })
      .from(softwareUsage)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取最近的使用记录
    const recentUsage = await userBehaviorDb
      .select({
        id: softwareUsage.id,
        softwareName: softwareUsage.softwareName,
        softwareVersion: softwareUsage.softwareVersion,
        deviceFingerprint: softwareUsage.deviceFingerprint,
        used: softwareUsage.used,
        usedAt: softwareUsage.usedAt,
      })
      .from(softwareUsage)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(softwareUsage.usedAt))
      .limit(10)

    const totalUsage = totalUsageResult.totalUsed || 0
    const uniqueDevices = uniqueDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalUsage,
        uniqueDevices,
        recentUsage,
        summary: {
          totalUsage,
          uniqueDevices,
          averageUsagePerDevice: uniqueDevices > 0 ? (totalUsage / uniqueDevices).toFixed(2) : '0'
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting usage stats:', error)
    return corsResponse({
      success: false,
      error: '获取使用统计失败'
    }, { status: 500 }, origin, userAgent)
  }
}

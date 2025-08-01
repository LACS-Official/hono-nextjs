/**
 * 软件激活统计API
 * POST /api/user-behavior/activations - 记录软件激活
 * GET /api/user-behavior/activations - 获取激活统计
 */

import { NextRequest } from 'next/server'
import { userBehaviorDb } from '@/lib/user-behavior-db-connection'
import { softwareActivations } from '@/lib/user-behavior-schema'
import { eq, count, desc, and, gte, lte } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { z } from 'zod'
import { UserBehaviorSecurity } from '@/lib/user-behavior-security'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 激活记录请求体验证
const activationRequestSchema = z.object({
  softwareId: z.number().int().positive(),
  softwareName: z.string().optional().default('玩机管家'),
  softwareVersion: z.string().optional(),
  deviceFingerprint: z.string().min(1),
  deviceOs: z.string().optional(),
  deviceArch: z.string().optional(),
  activationCode: z.string().optional(),
  username: z.string().optional(),
  userEmail: z.string().optional(),
  ipAddress: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
})

// POST - 记录软件激活
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 安全检查
    const bodyText = await request.text()
    const securityCheck = await UserBehaviorSecurity.performSecurityCheck(request, bodyText)
    if (!securityCheck.success) {
      return UserBehaviorSecurity.createSecurityErrorResponse(securityCheck)
    }

    const body = JSON.parse(bodyText)
    const validatedData = activationRequestSchema.parse(body)

    // 检查是否已经激活过（基于设备指纹和软件ID）
    const existingActivation = await userBehaviorDb
      .select()
      .from(softwareActivations)
      .where(
        and(
          eq(softwareActivations.deviceFingerprint, validatedData.deviceFingerprint),
          eq(softwareActivations.softwareId, validatedData.softwareId)
        )
      )
      .limit(1)

    if (existingActivation.length > 0) {
      return corsResponse({
        success: true,
        message: '设备已激活过，更新激活记录',
        data: {
          id: existingActivation[0].id,
          isNewActivation: false,
          activatedAt: existingActivation[0].activatedAt
        }
      }, undefined, origin, userAgent)
    }

    // 创建新的激活记录
    const [newActivation] = await userBehaviorDb
      .insert(softwareActivations)
      .values({
        ...validatedData,
        activatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return corsResponse({
      success: true,
      message: '激活记录已保存',
      data: {
        id: newActivation.id,
        isNewActivation: true,
        activatedAt: newActivation.activatedAt
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error recording activation:', error)
    
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '记录激活失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 获取激活统计
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
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
      conditions.push(eq(softwareActivations.softwareId, parseInt(softwareId)))
    }
    if (startDate) {
      conditions.push(gte(softwareActivations.activatedAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(softwareActivations.activatedAt, new Date(endDate)))
    }

    // 获取总激活数
    const [totalResult] = await userBehaviorDb
      .select({ count: count() })
      .from(softwareActivations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取唯一设备数（基于设备指纹）
    const uniqueDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceFingerprint: softwareActivations.deviceFingerprint })
      .from(softwareActivations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取最近的激活记录
    const recentActivations = await userBehaviorDb
      .select({
        id: softwareActivations.id,
        softwareName: softwareActivations.softwareName,
        softwareVersion: softwareActivations.softwareVersion,
        deviceOs: softwareActivations.deviceOs,
        deviceArch: softwareActivations.deviceArch,
        activatedAt: softwareActivations.activatedAt,
        country: softwareActivations.country,
        region: softwareActivations.region,
        city: softwareActivations.city,
      })
      .from(softwareActivations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(softwareActivations.activatedAt))
      .limit(10)

    const totalActivations = totalResult.count || 0
    const uniqueDevices = uniqueDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalActivations,
        uniqueDevices,
        recentActivations,
        summary: {
          totalActivations,
          uniqueDevices,
          averageActivationsPerDevice: uniqueDevices > 0 ? (totalActivations / uniqueDevices).toFixed(2) : '0'
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting activation stats:', error)
    return corsResponse({
      success: false,
      error: '获取激活统计失败'
    }, { status: 500 }, origin, userAgent)
  }
}

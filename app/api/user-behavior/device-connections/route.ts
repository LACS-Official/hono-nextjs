/**
 * 设备连接统计API
 * POST /api/user-behavior/device-connections - 记录设备连接
 * GET /api/user-behavior/device-connections - 获取设备连接统计
 */

import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, deviceConnections } from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { z } from 'zod'
import crypto from 'crypto'
import { UserBehaviorSecurity } from '@/lib/user-behavior-security'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 设备连接记录请求体验证（简化版本）
const deviceConnectionRequestSchema = z.object({
  deviceSerial: z.string().min(1),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  softwareId: z.number().int().positive(),
  userDeviceFingerprint: z.string().optional(),
})



// POST - 记录设备连接
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
    const validatedData = deviceConnectionRequestSchema.parse(body)

    // 创建设备连接记录（简化版本）
    const [newConnection] = await userBehaviorDb
      .insert(deviceConnections)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return corsResponse({
      success: true,
      message: '设备连接记录已保存',
      data: {
        id: newConnection.id,
        deviceSerial: newConnection.deviceSerial,
        deviceBrand: newConnection.deviceBrand,
        deviceModel: newConnection.deviceModel
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error recording device connection:', error)
    
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '记录设备连接失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 获取设备连接统计
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
      conditions.push(eq(deviceConnections.softwareId, parseInt(softwareId)))
    }
    if (startDate) {
      conditions.push(gte(deviceConnections.createdAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(deviceConnections.createdAt, new Date(endDate)))
    }

    // 获取总连接次数
    const [totalConnectionsResult] = await userBehaviorDb
      .select({ count: count() })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取唯一设备数（基于设备序列号）
    const uniqueDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceSerial: deviceConnections.deviceSerial })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    // 获取设备品牌统计
    const brandStatsResult = await userBehaviorDb
      .select({
        brand: deviceConnections.deviceBrand,
        count: count()
      })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(deviceConnections.deviceBrand)
      .orderBy(desc(count()))
      .limit(10)

    // 获取设备型号统计
    const deviceModelStatsResult = await userBehaviorDb
      .select({
        deviceModel: deviceConnections.deviceModel,
        count: count()
      })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(deviceConnections.deviceModel)
      .orderBy(desc(count()))
      .limit(10)

    // 获取最近的连接记录（简化版本）
    const recentConnections = await userBehaviorDb
      .select({
        id: deviceConnections.id,
        deviceSerial: deviceConnections.deviceSerial,
        deviceBrand: deviceConnections.deviceBrand,
        deviceModel: deviceConnections.deviceModel,
        softwareId: deviceConnections.softwareId,
        createdAt: deviceConnections.createdAt,
      })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deviceConnections.createdAt))
      .limit(20)

    const totalConnections = totalConnectionsResult.count || 0
    const uniqueDevices = uniqueDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalConnections,
        uniqueDevices,
        brandStats: brandStatsResult,
        deviceModelStats: deviceModelStatsResult,
        recentConnections,
        summary: {
          totalConnections,
          uniqueDevices,
          averageConnectionsPerDevice: uniqueDevices > 0 ? (totalConnections / uniqueDevices).toFixed(2) : '0'
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting device connection stats:', error)
    return corsResponse({
      success: false,
      error: '获取设备连接统计失败'
    }, { status: 500 }, origin, userAgent)
  }
}

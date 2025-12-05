/**
 * 设备连接统计API
 * POST /api/user-behavior/device-connections - 记录设备连接
 * GET /api/user-behavior/device-connections - 获取设备连接统计
 */

import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, deviceConnections } from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, getClientIp } from '@/lib/cors'
import { checkUserBehaviorRateLimit } from '@/lib/user-behavior-rate-limit'
import { z } from 'zod'
import crypto from 'crypto'
import { UserBehaviorSecurity } from '@/lib/user-behavior-security'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 设备连接记录请求体验证（简化版本）
const deviceConnectionRequestSchema = z.object({
  deviceSerial: z.string().min(1), // 设备序列号（必需）
  softwareId: z.number().int().positive(), // 软件ID（必需）
  userDeviceFingerprint: z.string().optional(), // 用户设备指纹（可选）
})



// POST - 记录设备连接
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 获取客户端IP
    const clientIp = getClientIp(request)

    // 频率限制检查
    const rateLimitResult = checkUserBehaviorRateLimit(clientIp, 'device-connections-post')
    if (!rateLimitResult.allowed) {
      return corsResponse({
        success: false,
        error: rateLimitResult.error || 'Rate limit exceeded'
      }, {
        status: 429,
        headers: rateLimitResult.retryAfter ? { 'Retry-After': rateLimitResult.retryAfter.toString() } : undefined
      }, origin, userAgent)
    }

    // 移除API Key验证 - 现在只依赖频率限制进行访问控制
    console.log('ℹ️ [DEBUG] 跳过API Key验证，仅使用频率限制控制访问')

    // 完全跳过安全检查 - POST记录端点只依赖频率限制
    console.log('ℹ️ [DEBUG] 完全跳过安全检查，POST记录端点只使用频率限制')
    const bodyText = await request.text()

    const body = JSON.parse(bodyText)
    const validatedData = deviceConnectionRequestSchema.parse(body)

    // 检查设备序列号是否已存在
    const existingDevice = await userBehaviorDb
      .select()
      .from(deviceConnections)
      .where(eq(deviceConnections.deviceSerial, validatedData.deviceSerial))
      .limit(1)

    let result
    if (existingDevice.length > 0) {
      // 设备已存在，更新 linked 字段自增
      const [updatedConnection] = await userBehaviorDb
        .update(deviceConnections)
        .set({
          linked: existingDevice[0].linked + 1,
          updatedAt: new Date(),
        })
        .where(eq(deviceConnections.deviceSerial, validatedData.deviceSerial))
        .returning()

      result = updatedConnection
    } else {
      // 设备不存在，创建新记录
      const [newConnection] = await userBehaviorDb
        .insert(deviceConnections)
        .values({
          deviceSerial: validatedData.deviceSerial,
          softwareId: validatedData.softwareId,
          userDeviceFingerprint: validatedData.userDeviceFingerprint,
          linked: 1, // 初始连接次数为1
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      result = newConnection
    }

    return corsResponse({
      success: true,
      message: existingDevice.length > 0 ? '设备连接次数已更新' : '设备连接记录已创建',
      data: {
        id: result.id,
        deviceSerial: result.deviceSerial,
        softwareId: result.softwareId,
        linked: result.linked,
        isNewDevice: existingDevice.length === 0
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
    // Supabase认证检查
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required'
      }, { status: 401 }, origin, userAgent)
    }

    // 检查管理员权限
    if (!isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: 'Insufficient permissions - admin access required'
      }, { status: 403 }, origin, userAgent)
    }

    console.log('[DEBUG] GET端点使用Supabase认证，用户:', authResult.user.email)

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

    // 获取总连接次数（基于 linked 字段的总和）
    const [totalConnectionsResult] = await userBehaviorDb
      .select({
        totalConnections: sql<number>`sum(${deviceConnections.linked})`,
        totalRecords: count()
      })
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

    // 获取最近的连接记录（包含连接次数）
    const recentConnections = await userBehaviorDb
      .select({
        id: deviceConnections.id,
        deviceSerial: deviceConnections.deviceSerial,
        deviceBrand: deviceConnections.deviceBrand,
        deviceModel: deviceConnections.deviceModel,
        softwareId: deviceConnections.softwareId,
        linked: deviceConnections.linked,
        createdAt: deviceConnections.createdAt,
        updatedAt: deviceConnections.updatedAt,
      })
      .from(deviceConnections)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deviceConnections.updatedAt))
      .limit(20)

    // 对 deviceSerial 进行脱敏处理
    const maskedRecentConnections = recentConnections.map(connection => ({
      ...connection,
      deviceSerial: connection.deviceSerial.length > 4
        ? `${connection.deviceSerial.substring(0, 2)}****${connection.deviceSerial.substring(connection.deviceSerial.length - 2)}`
        : connection.deviceSerial
    }));

    const totalConnections = totalConnectionsResult.totalConnections || 0
    const totalRecords = totalConnectionsResult.totalRecords || 0
    const uniqueDevices = uniqueDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalConnections, // 总连接次数（基于 linked 字段）
        totalRecords, // 总记录数（唯一设备数）
        uniqueDevices, // 唯一设备数（与 totalRecords 相同）
        brandStats: brandStatsResult,
        deviceModelStats: deviceModelStatsResult,
        recentConnections: maskedRecentConnections,
        summary: {
          totalConnections,
          totalRecords,
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

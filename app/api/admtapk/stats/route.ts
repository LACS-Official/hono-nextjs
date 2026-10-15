/**
 * 玩机管家安卓版 (ADMTAPK, softwareId = 19) 用户行为统计接口
 * GET /api/admtapk/stats - 获取安卓端使用与设备连接统计
 */

import { NextRequest } from 'next/server'
import {
  unifiedDb as userBehaviorDb,
  softwareUsage,
  deviceConnections,
} from '@/lib/unified-db-connection'
import { eq, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// 安卓版专属软件ID
const ADMT_APK_SOFTWARE_ID = 19

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取 ADMTAPK 统计数据 (映射到官网首页四大指标)
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 1. 累计使用: 软件使用总次数 (softwareUsage WHERE softwareId = 19)
    const [totalUsageResult] = await userBehaviorDb
      .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
      .from(softwareUsage)
      .where(eq(softwareUsage.softwareId, ADMT_APK_SOFTWARE_ID))

    // 2. 活跃设备: 唯一设备数 (基于设备指纹，WHERE softwareId = 19)
    const uniqueDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceFingerprint: softwareUsage.deviceFingerprint })
      .from(softwareUsage)
      .where(eq(softwareUsage.softwareId, ADMT_APK_SOFTWARE_ID))

    // 3. 累计连接: 设备连接总次数 (deviceConnections WHERE softwareId = 19)
    const [totalConnectionsResult] = await userBehaviorDb
      .select({ totalConnections: sql<number>`sum(${deviceConnections.linked})` })
      .from(deviceConnections)
      .where(eq(deviceConnections.softwareId, ADMT_APK_SOFTWARE_ID))

    // 4. 在线设备 / 连接设备数: 唯一连接设备数 (基于设备序列号，WHERE softwareId = 19)
    const uniqueConnectionDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceSerial: deviceConnections.deviceSerial })
      .from(deviceConnections)
      .where(eq(deviceConnections.softwareId, ADMT_APK_SOFTWARE_ID))

    const totalUsage = Number(totalUsageResult?.totalUsed) || 0
    const uniqueDevices = uniqueDevicesResult.length
    const totalConnections = Number(totalConnectionsResult?.totalConnections) || 0
    const uniqueConnectionDevices = uniqueConnectionDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalUsage: totalUsage.toString(),
        uniqueDevices,
        totalConnections: totalConnections.toString(),
        uniqueConnectionDevices,
        softwareId: ADMT_APK_SOFTWARE_ID,
        softwareName: '玩机管家安卓版'
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting ADMTAPK stats:', error)
    return corsResponse({
      success: false,
      error: '获取安卓端统计信息失败'
    }, { status: 500 }, origin, userAgent)
  }
}

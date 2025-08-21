import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, softwareUsage, deviceConnections } from '@/lib/unified-db-connection'
import { sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取 ADMT 统计数据
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  const referer = request.headers.get('Referer')
  const host = request.headers.get('Host')

  // 检查请求来源是否为 admt.lacs.cc
  const isAllowedOrigin = origin?.includes('admt.lacs.cc') || 
                          referer?.includes('admt.lacs.cc') || 
                          host === 'admt.lacs.cc'

  if (!isAllowedOrigin) {
    return corsResponse({
      success: false,
      error: 'Access denied. Only admt.lacs.cc is allowed.'
    }, { status: 403 }, origin, userAgent)
  }

  try {
    // 获取软件使用总次数
    const [totalUsageResult] = await userBehaviorDb
      .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
      .from(softwareUsage)

    // 获取唯一设备数（基于设备指纹）
    const uniqueDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceFingerprint: softwareUsage.deviceFingerprint })
      .from(softwareUsage)

    // 获取设备连接总次数
    const [totalConnectionsResult] = await userBehaviorDb
      .select({ totalConnections: sql<number>`sum(${deviceConnections.linked})` })
      .from(deviceConnections)

    // 获取设备连接唯一设备数
    const uniqueConnectionDevicesResult = await userBehaviorDb
      .selectDistinct({ deviceSerial: deviceConnections.deviceSerial })
      .from(deviceConnections)

    const totalUsage = totalUsageResult.totalUsed || 0
    const uniqueDevices = uniqueDevicesResult.length
    const totalConnections = totalConnectionsResult.totalConnections || 0
    const uniqueConnectionDevices = uniqueConnectionDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        totalUsage: totalUsage.toString(),
        uniqueDevices,
        totalConnections: totalConnections.toString(),
        uniqueConnectionDevices
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting ADMT stats:', error)
    return corsResponse({
      success: false,
      error: '获取统计信息失败'
    }, { status: 500 }, origin, userAgent)
  }
}
/**
 * 用户行为统计汇总API
 * GET /api/user-behavior/stats - 获取综合统计信息
 */

import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, softwareUsage, deviceConnections } from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, validateGitHubOAuth } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取综合统计信息
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

    const { searchParams } = new URL(request.url)
    const softwareId = searchParams.get('softwareId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const usageConditions = []
    const connectionConditions = []

    if (softwareId) {
      usageConditions.push(eq(softwareUsage.softwareId, parseInt(softwareId)))
      connectionConditions.push(eq(deviceConnections.softwareId, parseInt(softwareId)))
    }
    if (startDate) {
      usageConditions.push(gte(softwareUsage.usedAt, new Date(startDate)))
      connectionConditions.push(gte(deviceConnections.createdAt, new Date(startDate)))
    }
    if (endDate) {
      usageConditions.push(lte(softwareUsage.usedAt, new Date(endDate)))
      connectionConditions.push(lte(deviceConnections.createdAt, new Date(endDate)))
    }

    // 并行查询各种统计数据
    const [
      // 使用统计
      totalUsageResult,
      uniqueUsedDevicesResult,

      // 设备连接统计
      totalConnectionsResult,
      uniqueConnectedDevicesResult,

      // 最近7天的使用趋势
      recentUsageTrendResult,

      // 最近7天的连接趋势
      recentConnectionTrendResult,

      // 设备品牌统计
      brandStatsResult
    ] = await Promise.all([
      // 总使用次数
      userBehaviorDb
        .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
        .from(softwareUsage)
        .where(usageConditions.length > 0 ? and(...usageConditions) : undefined),

      // 唯一使用设备数
      userBehaviorDb
        .selectDistinct({ deviceFingerprint: softwareUsage.deviceFingerprint })
        .from(softwareUsage)
        .where(usageConditions.length > 0 ? and(...usageConditions) : undefined),
      
      // 总连接次数
      userBehaviorDb
        .select({ count: count() })
        .from(deviceConnections)
        .where(connectionConditions.length > 0 ? and(...connectionConditions) : undefined),
      
      // 唯一连接设备数
      userBehaviorDb
        .selectDistinct({ deviceSerial: deviceConnections.deviceSerial })
        .from(deviceConnections)
        .where(connectionConditions.length > 0 ? and(...connectionConditions) : undefined),
      
      // 最近7天使用趋势
      userBehaviorDb
        .select({
          date: sql<string>`DATE(${softwareUsage.usedAt})`,
          count: sql<number>`sum(${softwareUsage.used})`
        })
        .from(softwareUsage)
        .where(
          and(
            gte(softwareUsage.usedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            ...(usageConditions.length > 0 ? usageConditions : [])
          )
        )
        .groupBy(sql`DATE(${softwareUsage.usedAt})`)
        .orderBy(sql`DATE(${softwareUsage.usedAt})`),
      
      // 最近7天连接趋势
      userBehaviorDb
        .select({
          date: sql<string>`DATE(${deviceConnections.createdAt})`,
          count: count()
        })
        .from(deviceConnections)
        .where(
          and(
            gte(deviceConnections.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            ...(connectionConditions.length > 0 ? connectionConditions : [])
          )
        )
        .groupBy(sql`DATE(${deviceConnections.createdAt})`)
        .orderBy(sql`DATE(${deviceConnections.createdAt})`),
      
      // 设备品牌统计（基于连接数据）
      userBehaviorDb
        .select({
          brand: deviceConnections.deviceBrand,
          count: count()
        })
        .from(deviceConnections)
        .where(
          and(
            sql`${deviceConnections.deviceBrand} IS NOT NULL`,
            ...(connectionConditions.length > 0 ? connectionConditions : [])
          )
        )
        .groupBy(deviceConnections.deviceBrand)
        .orderBy(desc(count()))
        .limit(10)
    ])

    // 处理统计结果
    const totalUsage = totalUsageResult[0]?.totalUsed || 0
    const uniqueUsedDevices = uniqueUsedDevicesResult.length
    const totalConnections = totalConnectionsResult[0]?.count || 0
    const uniqueConnectedDevices = uniqueConnectedDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        // 核心指标
        summary: {
          totalUsage,
          uniqueUsedDevices,
          totalConnections,
          uniqueConnectedDevices,
          averageUsagePerDevice: uniqueUsedDevices > 0 ?
            (totalUsage / uniqueUsedDevices).toFixed(2) : '0',
          averageConnectionsPerDevice: uniqueConnectedDevices > 0 ?
            (totalConnections / uniqueConnectedDevices).toFixed(2) : '0'
        },

        // 趋势数据
        trends: {
          usageTrend: recentUsageTrendResult,
          connectionTrend: recentConnectionTrendResult
        },

        // 设备品牌分布
        brandDistribution: brandStatsResult,

        // 元数据
        metadata: {
          queryParams: {
            softwareId: softwareId ? parseInt(softwareId) : null,
            startDate,
            endDate
          },
          generatedAt: new Date().toISOString()
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error getting comprehensive stats:', error)
    return corsResponse({
      success: false,
      error: '获取综合统计失败'
    }, { status: 500 }, origin, userAgent)
  }
}

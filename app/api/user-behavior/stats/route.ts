/**
 * 用户行为统计汇总API
 * GET /api/user-behavior/stats - 获取综合统计信息
 */

import { NextRequest } from 'next/server'
import { unifiedDb as userBehaviorDb, softwareActivations, deviceConnections } from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

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
    const { searchParams } = new URL(request.url)
    const softwareId = searchParams.get('softwareId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 构建查询条件
    const activationConditions = []
    const connectionConditions = []
    
    if (softwareId) {
      activationConditions.push(eq(softwareActivations.softwareId, parseInt(softwareId)))
      connectionConditions.push(eq(deviceConnections.softwareId, parseInt(softwareId)))
    }
    if (startDate) {
      activationConditions.push(gte(softwareActivations.activatedAt, new Date(startDate)))
      connectionConditions.push(gte(deviceConnections.createdAt, new Date(startDate)))
    }
    if (endDate) {
      activationConditions.push(lte(softwareActivations.activatedAt, new Date(endDate)))
      connectionConditions.push(lte(deviceConnections.createdAt, new Date(endDate)))
    }

    // 并行查询各种统计数据
    const [
      // 激活统计
      totalActivationsResult,
      uniqueActivatedDevicesResult,
      
      // 设备连接统计
      totalConnectionsResult,
      uniqueConnectedDevicesResult,
      
      // 最近7天的激活趋势
      recentActivationTrendResult,
      
      // 最近7天的连接趋势
      recentConnectionTrendResult,
      
      // 地理分布统计
      geoStatsResult,
      
      // 设备品牌统计
      brandStatsResult
    ] = await Promise.all([
      // 总激活数
      userBehaviorDb
        .select({ count: count() })
        .from(softwareActivations)
        .where(activationConditions.length > 0 ? and(...activationConditions) : undefined),
      
      // 唯一激活设备数
      userBehaviorDb
        .selectDistinct({ deviceFingerprint: softwareActivations.deviceFingerprint })
        .from(softwareActivations)
        .where(activationConditions.length > 0 ? and(...activationConditions) : undefined),
      
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
      
      // 最近7天激活趋势
      userBehaviorDb
        .select({
          date: sql<string>`DATE(${softwareActivations.activatedAt})`,
          count: count()
        })
        .from(softwareActivations)
        .where(
          and(
            gte(softwareActivations.activatedAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
            ...(activationConditions.length > 0 ? activationConditions : [])
          )
        )
        .groupBy(sql`DATE(${softwareActivations.activatedAt})`)
        .orderBy(sql`DATE(${softwareActivations.activatedAt})`),
      
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
      
      // 地理分布统计（基于激活数据）
      userBehaviorDb
        .select({
          country: softwareActivations.country,
          region: softwareActivations.region,
          count: count()
        })
        .from(softwareActivations)
        .where(
          and(
            sql`${softwareActivations.country} IS NOT NULL`,
            ...(activationConditions.length > 0 ? activationConditions : [])
          )
        )
        .groupBy(softwareActivations.country, softwareActivations.region)
        .orderBy(desc(count()))
        .limit(10),
      
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
    const totalActivations = totalActivationsResult[0]?.count || 0
    const uniqueActivatedDevices = uniqueActivatedDevicesResult.length
    const totalConnections = totalConnectionsResult[0]?.count || 0
    const uniqueConnectedDevices = uniqueConnectedDevicesResult.length

    return corsResponse({
      success: true,
      data: {
        // 核心指标
        summary: {
          totalActivations,
          uniqueActivatedDevices,
          totalConnections,
          uniqueConnectedDevices,
          averageConnectionsPerDevice: uniqueConnectedDevices > 0 ? 
            (totalConnections / uniqueConnectedDevices).toFixed(2) : '0'
        },
        
        // 趋势数据
        trends: {
          activationTrend: recentActivationTrendResult,
          connectionTrend: recentConnectionTrendResult
        },
        
        // 地理分布
        geoDistribution: geoStatsResult,
        
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

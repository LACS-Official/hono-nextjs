/**
 * 软件资源网站综合统计API
 * GET /api/software-resource/stats - 获取软件资源网站的综合统计信息
 */

import { NextRequest } from 'next/server'
import { 
  unifiedDb as db, 
  websites, 
  websiteUsers, 
  banners, 
  websitePages,
  softwareActivations,
  deviceConnections,
  software
} from '@/lib/unified-db-connection'
import { eq, count, desc, and, gte, lte, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取软件资源网站综合统计
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { searchParams } = new URL(request.url)
    const websiteId = searchParams.get('websiteId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || '30' // 默认30天

    // 计算时间范围
    const now = new Date()
    const defaultStartDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)
    
    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate
    const queryEndDate = endDate ? new Date(endDate) : now

    // 基础查询条件
    const timeRangeCondition = and(
      gte(sql`created_at`, queryStartDate),
      lte(sql`created_at`, queryEndDate)
    )

    // 1. 网站基础统计
    const [totalWebsitesResult] = await db
      .select({ count: count() })
      .from(websites)

    const [activeWebsitesResult] = await db
      .select({ count: count() })
      .from(websites)
      .where(eq(websites.isActive, true))

    // 2. 用户统计
    let userConditions = []
    if (websiteId) {
      userConditions.push(eq(websiteUsers.websiteId, parseInt(websiteId)))
    }

    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(userConditions.length > 0 ? and(...userConditions) : undefined)

    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(
        ...(userConditions.length > 0 ? userConditions : []),
        eq(websiteUsers.status, 'active')
      ))

    const [verifiedUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(
        ...(userConditions.length > 0 ? userConditions : []),
        eq(websiteUsers.emailVerified, true)
      ))

    // 3. 轮播图统计
    let bannerConditions = []
    if (websiteId) {
      bannerConditions.push(eq(banners.websiteId, parseInt(websiteId)))
    }

    const [totalBannersResult] = await db
      .select({ count: count() })
      .from(banners)
      .where(bannerConditions.length > 0 ? and(...bannerConditions) : undefined)

    const [activeBannersResult] = await db
      .select({ count: count() })
      .from(banners)
      .where(and(
        ...(bannerConditions.length > 0 ? bannerConditions : []),
        eq(banners.isActive, true),
        eq(banners.isPublished, true)
      ))

    // 4. 软件相关统计
    const [totalSoftwareResult] = await db
      .select({ count: count() })
      .from(software)

    const [totalActivationsResult] = await db
      .select({ count: count() })
      .from(softwareActivations)

    const [totalConnectionsResult] = await db
      .select({ count: count() })
      .from(deviceConnections)

    // 5. 趋势数据 - 最近7天的用户注册趋势
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const userTrendResult = await db
      .select({
        date: sql<string>`DATE(${websiteUsers.createdAt})`,
        count: count()
      })
      .from(websiteUsers)
      .where(and(
        ...(userConditions.length > 0 ? userConditions : []),
        gte(websiteUsers.createdAt, sevenDaysAgo)
      ))
      .groupBy(sql`DATE(${websiteUsers.createdAt})`)
      .orderBy(sql`DATE(${websiteUsers.createdAt})`)

    // 6. 轮播图点击统计
    const bannerStatsResult = await db
      .select({
        totalViews: sql<number>`SUM(${banners.viewCount})`,
        totalClicks: sql<number>`SUM(${banners.clickCount})`,
        avgClickRate: sql<number>`CASE WHEN SUM(${banners.viewCount}) > 0 THEN (SUM(${banners.clickCount}) * 100.0 / SUM(${banners.viewCount})) ELSE 0 END`
      })
      .from(banners)
      .where(bannerConditions.length > 0 ? and(...bannerConditions) : undefined)

    // 7. 用户角色分布
    const userRoleDistribution = await db
      .select({
        role: websiteUsers.role,
        count: count()
      })
      .from(websiteUsers)
      .where(userConditions.length > 0 ? and(...userConditions) : undefined)
      .groupBy(websiteUsers.role)

    // 8. 最受欢迎的软件（按激活次数）
    const popularSoftwareResult = await db
      .select({
        softwareId: softwareActivations.softwareId,
        softwareName: software.name,
        activationCount: count()
      })
      .from(softwareActivations)
      .leftJoin(software, eq(softwareActivations.softwareId, software.id))
      .groupBy(softwareActivations.softwareId, software.name)
      .orderBy(desc(count()))
      .limit(10)

    // 9. 设备连接统计
    const deviceStatsResult = await db
      .select({
        totalDevices: sql<number>`COUNT(DISTINCT ${deviceConnections.deviceFingerprint})`,
        totalConnections: count()
      })
      .from(deviceConnections)

    return corsResponse({
      success: true,
      data: {
        summary: {
          websites: {
            total: totalWebsitesResult.count,
            active: activeWebsitesResult.count
          },
          users: {
            total: totalUsersResult.count,
            active: activeUsersResult.count,
            verified: verifiedUsersResult.count,
            verificationRate: totalUsersResult.count > 0 
              ? ((verifiedUsersResult.count / totalUsersResult.count) * 100).toFixed(2) + '%'
              : '0%'
          },
          banners: {
            total: totalBannersResult.count,
            active: activeBannersResult.count,
            totalViews: bannerStatsResult[0]?.totalViews || 0,
            totalClicks: bannerStatsResult[0]?.totalClicks || 0,
            avgClickRate: bannerStatsResult[0]?.avgClickRate || 0
          },
          software: {
            total: totalSoftwareResult.count,
            totalActivations: totalActivationsResult.count,
            totalConnections: totalConnectionsResult.count,
            uniqueDevices: deviceStatsResult[0]?.totalDevices || 0
          }
        },
        trends: {
          userRegistrations: userTrendResult
        },
        distributions: {
          userRoles: userRoleDistribution.map(item => ({
            role: item.role,
            count: item.count,
            percentage: totalUsersResult.count > 0 
              ? ((item.count / totalUsersResult.count) * 100).toFixed(2) + '%'
              : '0%'
          }))
        },
        popularSoftware: popularSoftwareResult,
        performance: {
          bannerClickRate: bannerStatsResult[0]?.avgClickRate || 0,
          avgActivationsPerSoftware: totalSoftwareResult.count > 0 
            ? (totalActivationsResult.count / totalSoftwareResult.count).toFixed(2)
            : '0',
          avgConnectionsPerDevice: deviceStatsResult[0]?.totalDevices > 0
            ? (deviceStatsResult[0]?.totalConnections / deviceStatsResult[0]?.totalDevices).toFixed(2)
            : '0'
        },
        metadata: {
          queryParams: {
            websiteId: websiteId ? parseInt(websiteId) : null,
            startDate: queryStartDate.toISOString(),
            endDate: queryEndDate.toISOString(),
            period: parseInt(period)
          },
          generatedAt: new Date().toISOString()
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取软件资源网站统计失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

/**
 * 软件资源网站用户统计API
 * GET /api/websites/[id]/users/stats - 获取用户统计数据
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, websiteUsers } from '@/lib/unified-db-connection'
import { eq, count, desc, gte, lte, sql, and } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取用户统计数据
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id } = params
    const websiteId = parseInt(id)

    if (isNaN(websiteId)) {
      return corsResponse({
        success: false,
        error: '无效的网站ID'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')
    const period = url.searchParams.get('period') || '30' // 默认30天

    // 计算时间范围
    const now = new Date()
    const defaultStartDate = new Date(now.getTime() - parseInt(period) * 24 * 60 * 60 * 1000)
    
    const queryStartDate = startDate ? new Date(startDate) : defaultStartDate
    const queryEndDate = endDate ? new Date(endDate) : now

    // 基础统计查询条件
    const baseConditions = [eq(websiteUsers.websiteId, websiteId)]
    const timeRangeConditions = [
      ...baseConditions,
      gte(websiteUsers.createdAt, queryStartDate),
      lte(websiteUsers.createdAt, queryEndDate)
    ]

    // 1. 总用户数
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(...baseConditions))

    // 2. 新增用户数（指定时间范围内）
    const [newUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(...timeRangeConditions))

    // 3. 活跃用户数（最近30天内登录过的用户）
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        gte(websiteUsers.lastLoginAt, thirtyDaysAgo)
      ))

    // 4. 邮箱验证用户数
    const [verifiedUsersResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        eq(websiteUsers.emailVerified, true)
      ))

    // 5. 按状态分组统计
    const statusStatsResult = await db
      .select({
        status: websiteUsers.status,
        count: count()
      })
      .from(websiteUsers)
      .where(eq(websiteUsers.websiteId, websiteId))
      .groupBy(websiteUsers.status)

    // 6. 按角色分组统计
    const roleStatsResult = await db
      .select({
        role: websiteUsers.role,
        count: count()
      })
      .from(websiteUsers)
      .where(eq(websiteUsers.websiteId, websiteId))
      .groupBy(websiteUsers.role)

    // 7. 每日新增用户趋势（最近7天）
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const dailyNewUsersResult = await db
      .select({
        date: sql<string>`DATE(${websiteUsers.createdAt})`,
        count: count()
      })
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        gte(websiteUsers.createdAt, sevenDaysAgo)
      ))
      .groupBy(sql`DATE(${websiteUsers.createdAt})`)
      .orderBy(sql`DATE(${websiteUsers.createdAt})`)

    // 8. 最近注册的用户列表
    const recentUsersResult = await db
      .select({
        id: websiteUsers.id,
        username: websiteUsers.username,
        displayName: websiteUsers.displayName,
        email: websiteUsers.email,
        status: websiteUsers.status,
        role: websiteUsers.role,
        emailVerified: websiteUsers.emailVerified,
        loginCount: websiteUsers.loginCount,
        lastLoginAt: websiteUsers.lastLoginAt,
        createdAt: websiteUsers.createdAt
      })
      .from(websiteUsers)
      .where(eq(websiteUsers.websiteId, websiteId))
      .orderBy(desc(websiteUsers.createdAt))
      .limit(10)

    // 9. 登录活跃度统计
    const loginStatsResult = await db
      .select({
        avgLoginCount: sql<number>`AVG(${websiteUsers.loginCount})`,
        maxLoginCount: sql<number>`MAX(${websiteUsers.loginCount})`,
        usersWithLogin: count(websiteUsers.id)
      })
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        sql`${websiteUsers.loginCount} > 0`
      ))

    return corsResponse({
      success: true,
      data: {
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        },
        summary: {
          totalUsers: totalUsersResult.count,
          newUsers: newUsersResult.count,
          activeUsers: activeUsersResult.count,
          verifiedUsers: verifiedUsersResult.count,
          verificationRate: totalUsersResult.count > 0 
            ? ((verifiedUsersResult.count / totalUsersResult.count) * 100).toFixed(2) + '%'
            : '0%'
        },
        statusDistribution: statusStatsResult.map(item => ({
          status: item.status,
          count: item.count,
          percentage: totalUsersResult.count > 0 
            ? ((item.count / totalUsersResult.count) * 100).toFixed(2) + '%'
            : '0%'
        })),
        roleDistribution: roleStatsResult.map(item => ({
          role: item.role,
          count: item.count,
          percentage: totalUsersResult.count > 0 
            ? ((item.count / totalUsersResult.count) * 100).toFixed(2) + '%'
            : '0%'
        })),
        trends: {
          dailyNewUsers: dailyNewUsersResult
        },
        loginStats: {
          averageLoginCount: loginStatsResult[0]?.avgLoginCount || 0,
          maxLoginCount: loginStatsResult[0]?.maxLoginCount || 0,
          usersWithLogin: loginStatsResult[0]?.usersWithLogin || 0
        },
        recentUsers: recentUsersResult,
        metadata: {
          queryParams: {
            websiteId,
            startDate: queryStartDate.toISOString(),
            endDate: queryEndDate.toISOString(),
            period: parseInt(period)
          },
          generatedAt: new Date().toISOString()
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取用户统计失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

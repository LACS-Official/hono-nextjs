/**
 * 管理仪表板统计API
 * GET /api/admin/dashboard/stats - 获取仪表板统计数据
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, software, activationCodes, softwareUsage } from '@/lib/unified-db-connection'
import { count, eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /api/admin/dashboard/stats - 获取仪表板统计数据
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 统一认证验证（需要管理员权限）
    const authValidation = validateUnifiedAuth(request)
    if (!authValidation.isValid) {
      return corsResponse({
        success: false,
        error: authValidation.error || 'Authentication required for dashboard access',
        authType: authValidation.authType
      }, { status: 401 }, origin, userAgent)
    }

    // 记录访问日志
    const logInfo = authValidation.authType === 'github-oauth' 
      ? `User: ${authValidation.user?.login} (${authValidation.user?.email})`
      : `API Key authentication`
    console.log(`[DASHBOARD_STATS] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    // 并行获取各种统计数据
    const [
      softwareStats,
      activationCodeStats,
      userBehaviorStats,
      systemHealth
    ] = await Promise.all([
      getSoftwareStats(),
      getActivationCodeStats(),
      getUserBehaviorStats(),
      getSystemHealth()
    ])

    return corsResponse({
      success: true,
      data: {
        software: softwareStats,
        activationCodes: activationCodeStats,
        userBehavior: userBehaviorStats,
        system: systemHealth,
        lastUpdated: new Date().toISOString()
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return corsResponse({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    }, { status: 500 }, origin, userAgent)
  }
}

// 获取软件统计数据
async function getSoftwareStats() {
  try {
    // 总软件数量
    const [totalSoftware] = await db
      .select({ count: count() })
      .from(software)

    // 活跃软件数量（isActive = true）
    const [activeSoftware] = await db
      .select({ count: count() })
      .from(software)
      .where(eq(software.isActive, true))

    // 最近添加的软件（最近7天）
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const [recentSoftware] = await db
      .select({ count: count() })
      .from(software)
      .where(gte(software.createdAt, sevenDaysAgo))

    // 按分类统计
    const categoryStats = await db
      .select({
        category: software.category,
        count: count()
      })
      .from(software)
      .where(eq(software.isActive, true))
      .groupBy(software.category)
      .orderBy(desc(count()))
      .limit(10)

    return {
      total: totalSoftware.count,
      active: activeSoftware.count,
      inactive: totalSoftware.count - activeSoftware.count,
      recentlyAdded: recentSoftware.count,
      categories: categoryStats
    }
  } catch (error) {
    console.error('Error fetching software stats:', error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      recentlyAdded: 0,
      categories: []
    }
  }
}

// 获取激活码统计数据
async function getActivationCodeStats() {
  try {
    // 总激活码数量
    const [totalCodes] = await db
      .select({ count: count() })
      .from(activationCodes)

    // 已使用的激活码
    const [usedCodes] = await db
      .select({ count: count() })
      .from(activationCodes)
      .where(eq(activationCodes.isUsed, true))

    // 已过期的激活码
    const now = new Date()
    const [expiredCodes] = await db
      .select({ count: count() })
      .from(activationCodes)
      .where(and(
        eq(activationCodes.isUsed, false),
        lte(activationCodes.expiresAt, now)
      ))

    // 最近7天生成的激活码
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const [recentCodes] = await db
      .select({ count: count() })
      .from(activationCodes)
      .where(gte(activationCodes.createdAt, sevenDaysAgo))

    // 最近7天使用的激活码
    const [recentlyUsed] = await db
      .select({ count: count() })
      .from(activationCodes)
      .where(and(
        eq(activationCodes.isUsed, true),
        gte(activationCodes.usedAt, sevenDaysAgo)
      ))

    const availableCodes = totalCodes.count - usedCodes.count - expiredCodes.count

    return {
      total: totalCodes.count,
      used: usedCodes.count,
      available: availableCodes,
      expired: expiredCodes.count,
      recentlyGenerated: recentCodes.count,
      recentlyUsed: recentlyUsed.count,
      usageRate: totalCodes.count > 0 ? Math.round((usedCodes.count / totalCodes.count) * 100) : 0
    }
  } catch (error) {
    console.error('Error fetching activation code stats:', error)
    return {
      total: 0,
      used: 0,
      available: 0,
      expired: 0,
      recentlyGenerated: 0,
      recentlyUsed: 0,
      usageRate: 0
    }
  }
}

// 获取用户行为统计数据
async function getUserBehaviorStats() {
  try {
    // 总使用次数
    const [totalUsageResult] = await db
      .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
      .from(softwareUsage)

    // 最近7天的使用次数
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentUsageResult] = await db
      .select({ totalUsed: sql<number>`sum(${softwareUsage.used})` })
      .from(softwareUsage)
      .where(gte(softwareUsage.usedAt, sevenDaysAgo))

    // 独特设备数量（基于设备指纹）
    const uniqueDevices = await db
      .selectDistinct({ deviceFingerprint: softwareUsage.deviceFingerprint })
      .from(softwareUsage)

    // 最受欢迎的软件（按使用次数）
    const popularSoftware = await db
      .select({
        softwareName: softwareUsage.softwareName,
        totalUsed: sql<number>`sum(${softwareUsage.used})`
      })
      .from(softwareUsage)
      .groupBy(softwareUsage.softwareName)
      .orderBy(desc(sql`sum(${softwareUsage.used})`))
      .limit(5)

    return {
      totalUsage: totalUsageResult.totalUsed || 0,
      recentUsage: recentUsageResult.totalUsed || 0,
      uniqueDevices: uniqueDevices.length,
      popularSoftware: popularSoftware
    }
  } catch (error) {
    console.error('Error fetching user behavior stats:', error)
    return {
      totalUsage: 0,
      recentUsage: 0,
      uniqueDevices: 0,
      popularSoftware: []
    }
  }
}

// 获取系统健康状态
async function getSystemHealth() {
  try {
    const healthChecks = {
      database: false,
      apiResponse: true, // 如果能执行到这里，API响应是正常的
      timestamp: new Date().toISOString()
    }

    // 测试数据库连接
    try {
      await db.select({ count: count() }).from(software).limit(1)
      healthChecks.database = true
    } catch (error) {
      console.error('Database health check failed:', error)
      healthChecks.database = false
    }

    const overallHealth = healthChecks.database && healthChecks.apiResponse

    return {
      status: overallHealth ? 'healthy' : 'degraded',
      checks: healthChecks,
      uptime: process.uptime(), // 进程运行时间（秒）
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }
  } catch (error) {
    console.error('Error checking system health:', error)
    return {
      status: 'error',
      checks: {
        database: false,
        apiResponse: false,
        timestamp: new Date().toISOString()
      },
      uptime: 0,
      memory: {},
      version: 'unknown'
    }
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { crashDb, clientCrashReports, ensureCrashReportsTable } from '@/lib/crash-reports-db'
import { eq, gte, desc, sql } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

/**
 * GET /api/admin/telemetry/crash/stats - 获取崩溃统计指标、趋势与筛选项
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const apiKeyResult = validateApiKeyWithExpiration(request)
    const isAuthorized = (authResult.success && authResult.user && isAuthorizedAdmin(authResult.user)) || apiKeyResult.isValid

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: '未授权访问：需要管理员权限' },
        { status: 401 }
      )
    }

    await ensureCrashReportsTable()

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // 并行执行各项聚合统计
    const [
      totalCountResult,
      todayCountResult,
      statusCountsResult,
      topSoftwareResult,
      osDistributionResult,
      softwareListResult
    ] = await Promise.all([
      // 1. 累计总崩溃次数
      crashDb
        .select({ count: sql<number>`count(*)::int` })
        .from(clientCrashReports),

      // 2. 今日 (24小时内) 崩溃数
      crashDb
        .select({ count: sql<number>`count(*)::int` })
        .from(clientCrashReports)
        .where(gte(clientCrashReports.createdAt, oneDayAgo)),

      // 3. 各状态问题组数 (按 hash 聚合)
      crashDb
        .select({
          status: clientCrashReports.status,
          groups: sql<number>`count(DISTINCT ${clientCrashReports.crashHash})::int`,
          crashes: sql<number>`count(*)::int`
        })
        .from(clientCrashReports)
        .groupBy(clientCrashReports.status),

      // 4. 崩溃最多的软件 Top 5
      crashDb
        .select({
          softwareName: clientCrashReports.softwareName,
          crashes: sql<number>`count(*)::int`
        })
        .from(clientCrashReports)
        .groupBy(clientCrashReports.softwareName)
        .orderBy(desc(sql`count(*)`))
        .limit(5),

      // 5. 操作系统分布
      crashDb
        .select({
          osName: clientCrashReports.osName,
          count: sql<number>`count(*)::int`
        })
        .from(clientCrashReports)
        .groupBy(clientCrashReports.osName)
        .orderBy(desc(sql`count(*)`))
        .limit(6),

      // 6. 可选的软件与对应版本列表 (用于前端动态下拉筛选)
      crashDb
        .select({
          softwareName: clientCrashReports.softwareName,
          versions: sql<string[]>`array_agg(DISTINCT ${clientCrashReports.appVersion})`
        })
        .from(clientCrashReports)
        .groupBy(clientCrashReports.softwareName)
    ])

    const totalCrashes = Number(totalCountResult[0]?.count || 0)
    const todayCrashes = Number(todayCountResult[0]?.count || 0)

    let unresolvedIssues = 0
    let investigatingIssues = 0
    let resolvedIssues = 0
    let ignoredIssues = 0

    statusCountsResult.forEach(row => {
      const g = Number(row.groups || 0)
      if (row.status === 'unresolved') unresolvedIssues = g
      else if (row.status === 'investigating') investigatingIssues = g
      else if (row.status === 'resolved') resolvedIssues = g
      else if (row.status === 'ignored') ignoredIssues = g
    })

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCrashes,
          todayCrashes,
          unresolvedIssues,
          investigatingIssues,
          resolvedIssues,
          ignoredIssues,
          totalIssues: unresolvedIssues + investigatingIssues + resolvedIssues + ignoredIssues
        },
        topSoftware: topSoftwareResult,
        osDistribution: osDistributionResult,
        filters: {
          softwareList: softwareListResult
        }
      }
    })
  } catch (error: any) {
    console.error('获取崩溃统计失败:', error)
    return NextResponse.json(
      { success: false, error: '获取崩溃统计失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { crashDb, clientCrashReports, ensureCrashReportsTable } from '@/lib/crash-reports-db'
import { eq, and, desc, asc, like, sql, inArray } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

/**
 * GET /api/admin/telemetry/crash - 获取崩溃报告列表或聚合分组
 */
export async function GET(request: NextRequest) {
  try {
    // 权限校验
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

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'grouped' // 'grouped' | 'list'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))
    const offset = (page - 1) * limit

    const softwareName = searchParams.get('softwareName') || ''
    const appVersion = searchParams.get('appVersion') || ''
    const status = searchParams.get('status') || ''
    const search = searchParams.get('search') || ''

    // 构建过滤条件
    const conditions = []
    if (softwareName && softwareName !== 'all') {
      conditions.push(eq(clientCrashReports.softwareName, softwareName))
    }
    if (appVersion && appVersion !== 'all') {
      conditions.push(eq(clientCrashReports.appVersion, appVersion))
    }
    if (status && status !== 'all') {
      conditions.push(eq(clientCrashReports.status, status))
    }
    if (search) {
      conditions.push(
        sql`(${clientCrashReports.errorMessage} ILIKE ${`%${search}%`} OR 
             ${clientCrashReports.errorType} ILIKE ${`%${search}%`} OR 
             ${clientCrashReports.crashModule} ILIKE ${`%${search}%`} OR 
             ${clientCrashReports.deviceModel} ILIKE ${`%${search}%`})`
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    if (mode === 'grouped') {
      // 聚合模式：按 crash_hash 聚合 Top 问题
      const groupedQuery = crashDb
        .select({
          crashHash: clientCrashReports.crashHash,
          softwareName: sql<string>`min(${clientCrashReports.softwareName})`,
          errorType: sql<string>`min(${clientCrashReports.errorType})`,
          errorMessage: sql<string>`min(${clientCrashReports.errorMessage})`,
          crashModule: sql<string>`min(${clientCrashReports.crashModule})`,
          status: sql<string>`min(${clientCrashReports.status})`,
          sampleStack: sql<string>`min(${clientCrashReports.errorStack})`,
          sampleDevice: sql<string>`min(${clientCrashReports.deviceModel})`,
          sampleGpu: sql<string>`min(${clientCrashReports.gpuRenderer})`,
          sampleOs: sql<string>`min(${clientCrashReports.osName})`,
          occurrences: sql<number>`count(*)::int`,
          affectedVersions: sql<string[]>`array_agg(DISTINCT ${clientCrashReports.appVersion})`,
          affectedPlatforms: sql<string[]>`array_agg(DISTINCT ${clientCrashReports.osName})`,
          firstSeenAt: sql<string>`min(${clientCrashReports.createdAt})::text`,
          lastSeenAt: sql<string>`max(${clientCrashReports.createdAt})::text`,
        })
        .from(clientCrashReports)
        .where(whereClause)
        .groupBy(clientCrashReports.crashHash)
        .orderBy(desc(sql`count(*)`))
        .limit(limit)
        .offset(offset)

      // 总分组数
      const countQuery = crashDb
        .select({
          totalGroups: sql<number>`count(DISTINCT ${clientCrashReports.crashHash})::int`
        })
        .from(clientCrashReports)
        .where(whereClause)

      const [groups, countResult] = await Promise.all([groupedQuery, countQuery])
      const total = Number(countResult[0]?.totalGroups || 0)

      return NextResponse.json({
        success: true,
        data: {
          mode: 'grouped',
          groups,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    } else {
      // 原始流水模式：按创建时间倒序返回具体单条日志
      const listQuery = crashDb
        .select()
        .from(clientCrashReports)
        .where(whereClause)
        .orderBy(desc(clientCrashReports.createdAt))
        .limit(limit)
        .offset(offset)

      const countQuery = crashDb
        .select({ count: sql<number>`count(*)::int` })
        .from(clientCrashReports)
        .where(whereClause)

      const [reports, countResult] = await Promise.all([listQuery, countQuery])
      const total = Number(countResult[0]?.count || 0)

      return NextResponse.json({
        success: true,
        data: {
          mode: 'list',
          reports,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    }
  } catch (error: any) {
    console.error('获取崩溃报告列表失败:', error)
    return NextResponse.json(
      { success: false, error: '获取崩溃报告失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

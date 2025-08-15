import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { eq, sql, desc, gte, lte, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /admin/software/view-count - 获取访问量统计数据
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 验证管理员权限
    const authResult = await validateUnifiedAuth(request)
    if (!authResult.success) {
      return corsResponse({
        success: false,
        error: authResult.error
      }, { status: 401 }, origin, userAgent)
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // json, csv, excel
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const minViewCount = searchParams.get('minViewCount')
    const maxViewCount = searchParams.get('maxViewCount')

    // 构建查询条件
    const conditions = [eq(software.isActive, true)]

    if (startDate) {
      conditions.push(gte(software.createdAt, new Date(startDate)))
    }
    if (endDate) {
      conditions.push(lte(software.createdAt, new Date(endDate)))
    }
    if (minViewCount) {
      const minCount = parseInt(minViewCount)
      if (!isNaN(minCount)) {
        conditions.push(gte(software.viewCount, minCount))
      }
    }
    if (maxViewCount) {
      const maxCount = parseInt(maxViewCount)
      if (!isNaN(maxCount)) {
        conditions.push(lte(software.viewCount, maxCount))
      }
    }

    // 查询统计数据
    const softwareStats = await db
      .select({
        id: software.id,
        name: software.name,
        nameEn: software.nameEn,
        category: software.category,
        viewCount: software.viewCount,
        createdAt: software.createdAt,
        updatedAt: software.updatedAt
      })
      .from(software)
      .where(and(...conditions))
      .orderBy(desc(software.viewCount))

    // 计算汇总统计
    const [summary] = await db
      .select({
        totalSoftware: sql<number>`count(*)`,
        totalViews: sql<number>`sum(${software.viewCount})`,
        averageViews: sql<number>`avg(${software.viewCount})`,
        maxViews: sql<number>`max(${software.viewCount})`,
        minViews: sql<number>`min(${software.viewCount})`
      })
      .from(software)
      .where(and(...conditions))

    // 根据格式返回数据
    if (format === 'csv') {
      // 生成CSV格式
      const csvHeader = 'ID,软件名称,英文名称,分类,访问量,创建时间,更新时间\n'
      const csvData = softwareStats.map(item => 
        `${item.id},"${item.name}","${item.nameEn || ''}","${item.category || ''}",${item.viewCount},"${item.createdAt}","${item.updatedAt}"`
      ).join('\n')
      
      const csvContent = csvHeader + csvData

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="software-view-stats-${new Date().toISOString().split('T')[0]}.csv"`,
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key'
        }
      })
    }

    // 默认返回JSON格式
    return corsResponse({
      success: true,
      data: {
        statistics: softwareStats,
        summary: {
          totalSoftware: summary.totalSoftware || 0,
          totalViews: summary.totalViews || 0,
          averageViews: Math.round(summary.averageViews || 0),
          maxViews: summary.maxViews || 0,
          minViews: summary.minViews || 0
        },
        metadata: {
          queryParams: {
            format,
            startDate,
            endDate,
            minViewCount,
            maxViewCount
          },
          generatedAt: new Date().toISOString()
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取访问量统计失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST /admin/software/view-count - 重置访问量
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 验证管理员权限
    const authResult = await validateUnifiedAuth(request)
    if (!authResult.success) {
      return corsResponse({
        success: false,
        error: authResult.error
      }, { status: 401 }, origin, userAgent)
    }

    const body = await request.json()
    const { action, softwareId, newValue } = body

    if (action === 'reset') {
      if (softwareId) {
        // 重置特定软件的访问量
        const softwareIdNum = parseInt(softwareId)
        if (isNaN(softwareIdNum)) {
          return corsResponse({
            success: false,
            error: '无效的软件ID'
          }, { status: 400 }, origin, userAgent)
        }

        const resetValue = typeof newValue === 'number' ? newValue : 0

        const [updatedSoftware] = await db
          .update(software)
          .set({
            viewCount: resetValue,
            updatedAt: new Date()
          })
          .where(eq(software.id, softwareIdNum))
          .returning()

        if (!updatedSoftware) {
          return corsResponse({
            success: false,
            error: '未找到指定的软件'
          }, { status: 404 }, origin, userAgent)
        }

        return corsResponse({
          success: true,
          data: {
            id: updatedSoftware.id,
            name: updatedSoftware.name,
            oldViewCount: 'unknown',
            newViewCount: updatedSoftware.viewCount
          },
          message: `软件 "${updatedSoftware.name}" 的访问量已重置为 ${resetValue}`
        }, undefined, origin, userAgent)

      } else {
        // 重置所有软件的访问量
        const resetValue = typeof newValue === 'number' ? newValue : 0

        const result = await db
          .update(software)
          .set({
            viewCount: resetValue,
            updatedAt: new Date()
          })
          .where(eq(software.isActive, true))

        return corsResponse({
          success: true,
          data: {
            affectedCount: result.rowCount || 0,
            newViewCount: resetValue
          },
          message: `已重置所有软件的访问量为 ${resetValue}`
        }, undefined, origin, userAgent)
      }
    }

    return corsResponse({
      success: false,
      error: '不支持的操作类型'
    }, { status: 400 }, origin, userAgent)

  } catch (error) {
    console.error('重置访问量失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

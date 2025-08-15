import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { desc, asc, eq, gte, and, or, sql, like } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/ranking - 获取软件访问量排行榜
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    
    // 分页参数
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const offset = (page - 1) * limit

    // 筛选参数
    const category = searchParams.get('category')
    const tags = searchParams.get('tags')
    const minViewCount = searchParams.get('minViewCount')
    const search = searchParams.get('search')

    // 构建查询条件
    const conditions = [
      eq(software.isActive, true) // 只显示活跃的软件
    ]

    // 分类筛选
    if (category) {
      conditions.push(eq(software.category, category))
    }

    // 标签筛选
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean)
      if (tagList.length > 0) {
        // 使用 JSON 操作符检查标签数组是否包含任意一个指定标签
        const tagConditions = tagList.map(tag => 
          sql`${software.tags} ? ${tag}`
        )
        conditions.push(or(...tagConditions))
      }
    }

    // 最小访问量筛选
    if (minViewCount) {
      const minCount = parseInt(minViewCount)
      if (!isNaN(minCount) && minCount > 0) {
        conditions.push(gte(software.viewCount, minCount))
      }
    }

    // 搜索关键词
    if (search) {
      const searchTerm = `%${search}%`
      conditions.push(
        or(
          like(software.name, searchTerm),
          like(software.nameEn, searchTerm),
          like(software.description, searchTerm),
          like(software.descriptionEn, searchTerm)
        )
      )
    }

    // 查询软件列表（按访问量降序排列）
    const softwareList = await db
      .select({
        id: software.id,
        name: software.name,
        nameEn: software.nameEn,
        description: software.description,
        descriptionEn: software.descriptionEn,
        currentVersion: software.currentVersion,
        category: software.category,
        tags: software.tags,
        viewCount: software.viewCount,
        officialWebsite: software.officialWebsite,
        openname: software.openname,
        filetype: software.filetype,
        createdAt: software.createdAt,
        updatedAt: software.updatedAt
      })
      .from(software)
      .where(and(...conditions))
      .orderBy(desc(software.viewCount), desc(software.updatedAt))
      .limit(limit)
      .offset(offset)

    // 查询总数
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(software)
      .where(and(...conditions))

    // 添加排名信息
    const rankedSoftware = softwareList.map((item, index) => ({
      ...item,
      rank: offset + index + 1
    }))

    // 计算统计信息
    const [stats] = await db
      .select({
        totalSoftware: sql<number>`count(*)`,
        totalViews: sql<number>`sum(${software.viewCount})`,
        averageViews: sql<number>`avg(${software.viewCount})`
      })
      .from(software)
      .where(eq(software.isActive, true))

    const totalPages = Math.ceil(count / limit)

    return corsResponse({
      success: true,
      data: rankedSoftware,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      },
      summary: {
        totalSoftware: stats.totalSoftware || 0,
        totalViews: stats.totalViews || 0,
        averageViews: Math.round(stats.averageViews || 0)
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取软件排行榜失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

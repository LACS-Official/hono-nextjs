import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { eq, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/tags - 获取所有可用的软件标签
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    
    // 查询参数
    const includeCount = searchParams.get('includeCount') === 'true'
    const minCount = parseInt(searchParams.get('minCount') || '1')
    const sortBy = searchParams.get('sortBy') || 'name' // name, count
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // 查询所有活跃软件的标签
    const softwareList = await db
      .select({
        tags: software.tags
      })
      .from(software)
      .where(eq(software.isActive, true))

    // 统计所有标签
    const tagCounts = new Map<string, number>()
    
    softwareList.forEach(sw => {
      if (sw.tags && Array.isArray(sw.tags)) {
        sw.tags.forEach((tag: string) => {
          if (tag && typeof tag === 'string' && tag.trim()) {
            const normalizedTag = tag.trim()
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
          }
        })
      }
    })

    // 过滤最小使用次数
    const filteredTags = Array.from(tagCounts.entries())
      .filter(([_, count]) => count >= minCount)

    // 排序
    filteredTags.sort((a, b) => {
      if (sortBy === 'count') {
        const countDiff = sortOrder === 'desc' ? b[1] - a[1] : a[1] - b[1]
        if (countDiff !== 0) return countDiff
        // 如果使用次数相同，按名称排序
        return a[0].localeCompare(b[0])
      } else {
        // 按名称排序
        return sortOrder === 'desc' ? b[0].localeCompare(a[0]) : a[0].localeCompare(b[0])
      }
    })

    // 构建响应数据
    let responseData
    if (includeCount) {
      responseData = {
        tags: filteredTags.map(([tag, count]) => ({
          name: tag,
          count: count
        })),
        total: filteredTags.length,
        totalSoftware: softwareList.length
      }
    } else {
      responseData = {
        tags: filteredTags.map(([tag]) => tag),
        total: filteredTags.length
      }
    }

    return corsResponse({
      success: true,
      data: responseData
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取软件标签失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

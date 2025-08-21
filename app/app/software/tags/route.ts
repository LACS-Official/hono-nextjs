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
    const tags = searchParams.getAll('tags').map(tag => decodeURIComponent(tag));

    // 查询所有软件标签
    const softwareList = await db
      .select({
        tags: software.tags,
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
      .filter(([_, count]) => count >= 1)

    // 过滤出同时具有所有 tags 的标签
    const resultTags = filteredTags.filter(([tag]) => tags.every(t => tag.includes(t)))

    // 构建响应数据
    const responseData = {
      tags: resultTags.map(([tag]) => tag),
    }

    return corsResponse({
      success: true,
      data: responseData,
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('获取软件标签失败:', {
      error: error instanceof Error ? error.stack : error,
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      }
    })
    return corsResponse({
      success: false,
      error: '服务器内部错误',
<<<<<<< HEAD
=======
      requestId: Math.random().toString(36).substring(2, 15)
>>>>>>> e29c0d3907d48af3593e9d1a26127413414d7fd9
    }, { status: 500 }, origin, userAgent)
  }
}

import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { and, eq, sql } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software - 根据标签过滤软件
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    const tagsParam = searchParams.get('tags')
    
    if (!tagsParam) {
      return corsResponse({
        success: false,
        error: '缺少tags参数'
      }, { status: 400 }, origin, userAgent)
    }

    // 解析标签参数，支持逗号分隔的多个标签
    const tags = tagsParam.split(',').map(tag => tag.trim()).filter(Boolean)
    
    // 构建查询条件 - 要求软件包含所有指定的标签
    const conditions = tags.map(tag => 
      sql`${software.tags}::jsonb @> '["${tag}"]'::jsonb`
    )

    // 查询符合条件的软件
    const filteredSoftware = await db
      .select()
      .from(software)
      .where(
        and(
          eq(software.isActive, true),
          ...conditions
        )
      )

    return corsResponse({
      success: true,
      data: {
        software: filteredSoftware,
        count: filteredSoftware.length
      }
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('根据标签过滤软件失败:', {
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
      requestId: Math.random().toString(36).substring(2, 15)
    }, { status: 500 }, origin, userAgent)
  }
}

import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { eq, like, and, desc, asc, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'
import { getLatestVersion, getLatestVersionWithId } from '@/lib/version-manager'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software - 获取所有可用软件列表
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    
    // 查询参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const tags = searchParams.get('tags') || '' // 新增：标签筛选
    const isActive = searchParams.get('active')
    const sortBy = searchParams.get('sortBy') || 'sortOrder'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // 验证分页参数
    if (page < 1 || limit < 1 || limit > 10000) {
      return corsResponse({
        success: false,
        error: '无效的分页参数'
      }, { status: 400 }, origin, userAgent)
    }
    
    const offset = (page - 1) * limit
    
    // 构建查询条件
    let whereConditions = []
    
    // 活跃状态过滤
    if (isActive !== null && isActive !== undefined) {
      const activeValue = isActive === 'true' || isActive === '1'
      whereConditions.push(eq(software.isActive, activeValue))
    } else {
      // 默认只显示活跃的软件
      whereConditions.push(eq(software.isActive, true))
    }
    
    // 分类过滤
    if (category) {
      whereConditions.push(eq(software.category, category))
    }
    
    // 搜索过滤
    if (search) {
      whereConditions.push(
        like(software.name, `%${search}%`)
      )
    }

    // 标签过滤
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      if (tagList.length > 0) {
        // 使用 PostgreSQL 的 jsonb 操作符来检查标签
        // 支持多个标签的 OR 查询：任何一个标签匹配即可
        const tagConditions = tagList.map(tag =>
          sql`${software.tags} @> ${JSON.stringify([tag])}`
        )

        if (tagConditions.length === 1) {
          whereConditions.push(tagConditions[0])
        } else {
          // 多个标签使用 OR 连接
          whereConditions.push(sql`(${tagConditions.join(' OR ')})`)
        }
      }
    }
    
    // 构建排序
    let orderBy
    switch (sortBy) {
      case 'name':
        orderBy = sortOrder === 'desc' ? desc(software.name) : asc(software.name)
        break
      case 'createdAt':
        orderBy = sortOrder === 'desc' ? desc(software.createdAt) : asc(software.createdAt)
        break
      case 'updatedAt':
        orderBy = sortOrder === 'desc' ? desc(software.updatedAt) : asc(software.updatedAt)
        break
      default:
        orderBy = sortOrder === 'desc' ? desc(software.sortOrder) : asc(software.sortOrder)
    }
    
    // 查询软件列表
    const softwareList = await db
      .select()
      .from(software)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset)

    // 为每个软件添加最新版本信息和版本ID
    const enhancedSoftwareList = await Promise.all(
      softwareList.map(async (sw) => {
        try {
          const latestVersionInfo = await getLatestVersionWithId(sw.id)
          return {
            ...sw,
            currentVersionId: latestVersionInfo?.id || null,
            latestVersion: latestVersionInfo?.version || sw.currentVersion
          }
        } catch (error) {
          console.warn(`获取软件 ${sw.id} 最新版本失败:`, error)
          return {
            ...sw,
            currentVersionId: null,
            latestVersion: sw.currentVersion
          }
        }
      })
    )

    // 查询总数
    const totalCountResult = await db
      .select({ count: software.id })
      .from(software)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)

    const totalCount = totalCountResult.length
    const totalPages = Math.ceil(totalCount / limit)

    return corsResponse({
      success: true,
      data: {
        software: enhancedSoftwareList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取软件列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST /app/software - 创建新软件（管理员功能）
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // API Key 验证（写操作需要认证）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const body = await request.json()
    
    // 基本字段验证
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      currentVersion,
      officialWebsite,
      category,
      tags,
      systemRequirements,
      openname,
      filetype,
      isActive = true,
      sortOrder = 0,
      metadata = {}
    } = body

    // 必填字段验证
    if (!name || !currentVersion) {
      return corsResponse({
        success: false,
        error: '软件名称和当前版本为必填字段'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 检查软件名称是否已存在
    const existingSoftware = await db
      .select()
      .from(software)
      .where(eq(software.name, name))
      .limit(1)
    
    if (existingSoftware.length > 0) {
      return corsResponse({
        success: false,
        error: '软件名称已存在'
      }, { status: 409 }, origin, userAgent)
    }
    
    // 创建新软件记录
    const [newSoftware] = await db
      .insert(software)
      .values({
        name,
        nameEn,
        description,
        descriptionEn,
        currentVersion,
        officialWebsite,
        category,
        tags,
        systemRequirements,
        openname,
        filetype,
        isActive,
        sortOrder,
        metadata
      })
      .returning()
    
    return corsResponse({
      success: true,
      data: newSoftware
    }, { status: 201 }, origin, userAgent)
    
  } catch (error) {
    console.error('创建软件失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

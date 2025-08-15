/**
 * 网站管理API
 * GET /api/websites - 获取网站列表
 * POST /api/websites - 创建新网站
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites } from '@/lib/unified-db-connection'
import { desc, eq, like, or } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 网站创建验证模式
const createWebsiteSchema = z.object({
  name: z.string().min(1, '网站名称不能为空'),
  domain: z.string().min(1, '域名不能为空'),
  title: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  config: z.object({
    theme: z.object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    }).optional(),
    layout: z.object({
      headerStyle: z.string().optional(),
      footerStyle: z.string().optional(),
      sidebarEnabled: z.boolean().optional(),
    }).optional(),
    features: z.object({
      searchEnabled: z.boolean().optional(),
      categoriesEnabled: z.boolean().optional(),
      tagsEnabled: z.boolean().optional(),
      commentsEnabled: z.boolean().optional(),
    }).optional(),
    seo: z.object({
      keywords: z.array(z.string()).optional(),
      author: z.string().optional(),
      robots: z.string().optional(),
    }).optional(),
    analytics: z.object({
      googleAnalyticsId: z.string().optional(),
      baiduAnalyticsId: z.string().optional(),
    }).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

// GET - 获取网站列表
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证管理员权限
    const authResult = validateUnifiedAuth(request)
    if (!authResult.isValid) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') // active, inactive, all

    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions: any[] = []

    if (search) {
      whereConditions.push(
        or(
          like(websites.name, `%${search}%`),
          like(websites.domain, `%${search}%`),
          like(websites.title, `%${search}%`)
        )
      )
    }

    if (status === 'active') {
      whereConditions.push(eq(websites.isActive, true))
    } else if (status === 'inactive') {
      whereConditions.push(eq(websites.isActive, false))
    }

    // 获取网站列表
    const websiteList = await db
      .select()
      .from(websites)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(websites.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: websites.id })
      .from(websites)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)

    const total = totalResult.length

    return corsResponse({
      success: true,
      data: {
        websites: websiteList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取网站列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 创建新网站
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证管理员权限
    const authResult = validateUnifiedAuth(request)
    if (!authResult.isValid) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = createWebsiteSchema.parse(body)

    // 检查域名是否已存在
    const existingWebsite = await db
      .select()
      .from(websites)
      .where(eq(websites.domain, validatedData.domain))
      .limit(1)

    if (existingWebsite.length > 0) {
      return corsResponse({
        success: false,
        error: '该域名已被使用'
      }, { status: 400 }, origin, userAgent)
    }

    // 创建新网站
    const [newWebsite] = await db
      .insert(websites)
      .values({
        name: validatedData.name,
        domain: validatedData.domain,
        title: validatedData.title,
        description: validatedData.description,
        logo: validatedData.logo,
        favicon: validatedData.favicon,
        config: validatedData.config || {},
        isActive: validatedData.isActive ?? true,
        isPublic: validatedData.isPublic ?? true,
      })
      .returning()

    return corsResponse({
      success: true,
      data: newWebsite,
      message: '网站创建成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    console.error('创建网站失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

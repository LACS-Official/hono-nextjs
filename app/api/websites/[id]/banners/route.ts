/**
 * 轮播图管理API
 * GET /api/websites/[id]/banners - 获取网站轮播图列表
 * POST /api/websites/[id]/banners - 创建新轮播图
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, banners } from '@/lib/unified-db-connection'
import { eq, desc, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 轮播图创建验证模式
const createBannerSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1, '图片URL不能为空'),
  imageAlt: z.string().optional(),
  linkUrl: z.string().optional(),
  linkTarget: z.enum(['_self', '_blank']).default('_self'),
  position: z.string().default('main'),
  sortOrder: z.number().default(0),
  style: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    borderRadius: z.string().optional(),
    shadow: z.boolean().optional(),
    overlay: z.object({
      enabled: z.boolean().optional(),
      color: z.string().optional(),
      opacity: z.number().optional(),
    }).optional(),
    animation: z.object({
      type: z.string().optional(),
      duration: z.number().optional(),
    }).optional(),
  }).optional(),
  displayConditions: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    devices: z.array(z.string()).optional(),
    pages: z.array(z.string()).optional(),
    userTypes: z.array(z.string()).optional(),
  }).optional(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
})

// GET - 获取轮播图列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id } = params
    const websiteId = parseInt(id)

    if (isNaN(websiteId)) {
      return corsResponse({
        success: false,
        error: '无效的网站ID'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const url = new URL(request.url)
    const position = url.searchParams.get('position') // main, sidebar, footer
    const isPublished = url.searchParams.get('published') // true, false, all
    const isActive = url.searchParams.get('active') // true, false, all

    // 构建查询条件
    let whereConditions: any[] = [eq(banners.websiteId, websiteId)]

    if (position) {
      whereConditions.push(eq(banners.position, position))
    }

    if (isPublished === 'true') {
      whereConditions.push(eq(banners.isPublished, true))
    } else if (isPublished === 'false') {
      whereConditions.push(eq(banners.isPublished, false))
    }

    if (isActive === 'true') {
      whereConditions.push(eq(banners.isActive, true))
    } else if (isActive === 'false') {
      whereConditions.push(eq(banners.isActive, false))
    }

    // 获取轮播图列表
    const bannerList = await db
      .select()
      .from(banners)
      .where(and(...whereConditions))
      .orderBy(banners.sortOrder, desc(banners.createdAt))

    return corsResponse({
      success: true,
      data: {
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        },
        banners: bannerList
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取轮播图列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 创建新轮播图
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证管理员权限
    const authResult = await validateUnifiedAuth(request)
    if (!authResult.success) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    const { id } = params
    const websiteId = parseInt(id)

    if (isNaN(websiteId)) {
      return corsResponse({
        success: false,
        error: '无效的网站ID'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = createBannerSchema.parse(body)

    // 创建新轮播图
    const [newBanner] = await db
      .insert(banners)
      .values({
        websiteId: websiteId,
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        description: validatedData.description,
        imageUrl: validatedData.imageUrl,
        imageAlt: validatedData.imageAlt,
        linkUrl: validatedData.linkUrl,
        linkTarget: validatedData.linkTarget,
        position: validatedData.position,
        sortOrder: validatedData.sortOrder,
        style: validatedData.style || {},
        displayConditions: validatedData.displayConditions || {},
        isActive: validatedData.isActive,
        isPublished: validatedData.isPublished,
      })
      .returning()

    return corsResponse({
      success: true,
      data: newBanner,
      message: '轮播图创建成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.errors
      }, { status: 400 }, origin, userAgent)
    }

    console.error('创建轮播图失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

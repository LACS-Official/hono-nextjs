/**
 * 公告管理API
 * GET /api/websites/[id]/announcements - 获取网站公告列表
 * POST /api/websites/[id]/announcements - 创建新公告
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, announcements } from '@/lib/unified-db-connection'
import { eq, desc, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 公告创建验证模式
const createAnnouncementSchema = z.object({
  title: z.string().min(1, '公告标题不能为空'),
  content: z.string().min(1, '公告内容不能为空'),
  type: z.enum(['info', 'warning', 'error', 'success']).default('info'),
  isSticky: z.boolean().default(false),
  sortOrder: z.number().default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
})

// GET - 获取公告列表
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
    const isPublished = url.searchParams.get('published') // true, false, all
    const isActive = url.searchParams.get('active') // true, false, all
    const type = url.searchParams.get('type') // info, warning, error, success, all

    // 构建查询条件
    let whereConditions: any[] = [eq(announcements.websiteId, websiteId)]

    if (isPublished === 'true') {
      whereConditions.push(eq(announcements.isPublished, true))
    } else if (isPublished === 'false') {
      whereConditions.push(eq(announcements.isPublished, false))
    }

    if (isActive === 'true') {
      whereConditions.push(eq(announcements.isActive, true))
    } else if (isActive === 'false') {
      whereConditions.push(eq(announcements.isActive, false))
    }

    if (type && type !== 'all') {
      whereConditions.push(eq(announcements.type, type))
    }

    // 获取公告列表
    const announcementList = await db
      .select()
      .from(announcements)
      .where(and(...whereConditions))
      .orderBy(announcements.sortOrder, desc(announcements.createdAt))

    return corsResponse({
      success: true,
      data: {
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        },
        announcements: announcementList
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取公告列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 创建新公告
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = createAnnouncementSchema.parse(body)

    // 创建新公告
    const [newAnnouncement] = await db
      .insert(announcements)
      .values({
        websiteId: websiteId,
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        isSticky: validatedData.isSticky,
        sortOrder: validatedData.sortOrder,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        isActive: validatedData.isActive,
        isPublished: validatedData.isPublished,
      })
      .returning()

    return corsResponse({
      success: true,
      data: newAnnouncement,
      message: '公告创建成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    console.error('创建公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

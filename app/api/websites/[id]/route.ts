/**
 * 单个网站管理API
 * GET /api/websites/[id] - 获取网站详情
 * PUT /api/websites/[id] - 更新网站信息
 * DELETE /api/websites/[id] - 删除网站
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, banners, websitePages, websiteMenus, websiteUsers } from '@/lib/unified-db-connection'
import { eq } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 网站更新验证模式
const updateWebsiteSchema = z.object({
  name: z.string().min(1, '网站名称不能为空').optional(),
  domain: z.string().min(1, '域名不能为空').optional(),
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

// GET - 获取网站详情
export async function GET(
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

    // 获取网站基本信息
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

    // 获取相关统计信息
    const [bannersCount] = await db
      .select({ count: banners.id })
      .from(banners)
      .where(eq(banners.websiteId, websiteId))

    const [pagesCount] = await db
      .select({ count: websitePages.id })
      .from(websitePages)
      .where(eq(websitePages.websiteId, websiteId))

    const [menusCount] = await db
      .select({ count: websiteMenus.id })
      .from(websiteMenus)
      .where(eq(websiteMenus.websiteId, websiteId))

    const [usersCount] = await db
      .select({ count: websiteUsers.id })
      .from(websiteUsers)
      .where(eq(websiteUsers.websiteId, websiteId))

    return corsResponse({
      success: true,
      data: {
        website,
        stats: {
          bannersCount: bannersCount?.count || 0,
          pagesCount: pagesCount?.count || 0,
          menusCount: menusCount?.count || 0,
          usersCount: usersCount?.count || 0,
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取网站详情失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT - 更新网站信息
export async function PUT(
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

    const body = await request.json()
    const validatedData = updateWebsiteSchema.parse(body)

    // 检查网站是否存在
    const [existingWebsite] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!existingWebsite) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 如果更新域名，检查是否与其他网站冲突
    if (validatedData.domain && validatedData.domain !== existingWebsite.domain) {
      const [conflictWebsite] = await db
        .select()
        .from(websites)
        .where(eq(websites.domain, validatedData.domain))
        .limit(1)

      if (conflictWebsite) {
        return corsResponse({
          success: false,
          error: '该域名已被其他网站使用'
        }, { status: 400 }, origin, userAgent)
      }
    }

    // 更新网站信息
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.domain !== undefined) updateData.domain = validatedData.domain
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.logo !== undefined) updateData.logo = validatedData.logo
    if (validatedData.favicon !== undefined) updateData.favicon = validatedData.favicon
    if (validatedData.config !== undefined) updateData.config = validatedData.config
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isPublic !== undefined) updateData.isPublic = validatedData.isPublic

    const [updatedWebsite] = await db
      .update(websites)
      .set(updateData)
      .where(eq(websites.id, websiteId))
      .returning()

    return corsResponse({
      success: true,
      data: updatedWebsite,
      message: '网站更新成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    console.error('更新网站失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE - 删除网站
export async function DELETE(
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

    // 检查网站是否存在
    const [existingWebsite] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!existingWebsite) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除网站（级联删除相关数据）
    await db
      .delete(websites)
      .where(eq(websites.id, websiteId))

    return corsResponse({
      success: true,
      message: '网站删除成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('删除网站失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

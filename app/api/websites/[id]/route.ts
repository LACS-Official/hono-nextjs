/**
 * 单个网站管理API
 * GET /api/websites/[id] - 获取网站详情
 * PUT /api/websites/[id] - 更新网站信息
 * DELETE /api/websites/[id] - 删除网站
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, banners, announcements } from '@/lib/unified-db-connection'
import { eq } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 网站更新验证模式（简化版）
const updateWebsiteSchema = z.object({
  name: z.string().min(1, '网站名称不能为空').optional(),
  domain: z.string().min(1, '域名不能为空').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  logo: z.string().url('请输入有效的logo图片URL').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

// GET - 获取网站详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // Supabase认证检查（仅需登录权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for website management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[WEBSITES] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

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

    const [announcementsCount] = await db
      .select({ count: announcements.id })
      .from(announcements)
      .where(eq(announcements.websiteId, websiteId))

    return corsResponse({
      success: true,
      data: {
        website,
        stats: {
          bannersCount: bannersCount?.count || 0,
          announcementsCount: announcementsCount?.count || 0,
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
    // Supabase认证检查（仅需登录权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for website management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[WEBSITES] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

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
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null
    if (validatedData.category !== undefined) updateData.category = validatedData.category || null
    if (validatedData.logo !== undefined) updateData.logo = validatedData.logo || null
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

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
    // Supabase认证检查（需要管理员权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for website management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[WEBSITES] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

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

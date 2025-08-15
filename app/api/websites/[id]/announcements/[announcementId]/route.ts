/**
 * 单个公告管理API
 * GET /api/websites/[id]/announcements/[announcementId] - 获取公告详情
 * PUT /api/websites/[id]/announcements/[announcementId] - 更新公告
 * DELETE /api/websites/[id]/announcements/[announcementId] - 删除公告
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, announcements } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 公告更新验证模式
const updateAnnouncementSchema = z.object({
  title: z.string().min(1, '公告标题不能为空').optional(),
  content: z.string().min(1, '公告内容不能为空').optional(),
  type: z.enum(['info', 'warning', 'error', 'success']).optional(),
  isSticky: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

// GET - 获取公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id, announcementId } = params
    const websiteId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)

    if (isNaN(websiteId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 获取公告详情
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(and(
        eq(announcements.websiteId, websiteId),
        eq(announcements.id, announcementIdNum)
      ))
      .limit(1)

    if (!announcement) {
      return corsResponse({
        success: false,
        error: '公告不存在'
      }, { status: 404 }, origin, userAgent)
    }

    return corsResponse({
      success: true,
      data: announcement
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取公告详情失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT - 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
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

    const { id, announcementId } = params
    const websiteId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)

    if (isNaN(websiteId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证公告是否存在
    const [existingAnnouncement] = await db
      .select()
      .from(announcements)
      .where(and(
        eq(announcements.websiteId, websiteId),
        eq(announcements.id, announcementIdNum)
      ))
      .limit(1)

    if (!existingAnnouncement) {
      return corsResponse({
        success: false,
        error: '公告不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // 构建更新数据
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.isSticky !== undefined) updateData.isSticky = validatedData.isSticky
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null
    if (validatedData.endDate !== undefined) updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished

    // 更新公告
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set(updateData)
      .where(and(
        eq(announcements.websiteId, websiteId),
        eq(announcements.id, announcementIdNum)
      ))
      .returning()

    return corsResponse({
      success: true,
      data: updatedAnnouncement,
      message: '公告更新成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.issues
      }, { status: 400 }, origin, userAgent)
    }

    console.error('更新公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE - 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
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

    const { id, announcementId } = params
    const websiteId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)

    if (isNaN(websiteId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证公告是否存在
    const [existingAnnouncement] = await db
      .select()
      .from(announcements)
      .where(and(
        eq(announcements.websiteId, websiteId),
        eq(announcements.id, announcementIdNum)
      ))
      .limit(1)

    if (!existingAnnouncement) {
      return corsResponse({
        success: false,
        error: '公告不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除公告
    await db
      .delete(announcements)
      .where(and(
        eq(announcements.websiteId, websiteId),
        eq(announcements.id, announcementIdNum)
      ))

    return corsResponse({
      success: true,
      message: '公告删除成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('删除公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

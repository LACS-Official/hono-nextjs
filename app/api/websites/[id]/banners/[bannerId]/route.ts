/**
 * 单个轮播图管理API
 * GET /api/websites/[id]/banners/[bannerId] - 获取轮播图详情
 * PUT /api/websites/[id]/banners/[bannerId] - 更新轮播图
 * DELETE /api/websites/[id]/banners/[bannerId] - 删除轮播图
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, banners } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 轮播图更新验证模式
const updateBannerSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().min(1, '图片URL不能为空').optional(),
  imageAlt: z.string().optional(),
  linkUrl: z.string().optional(),
  linkTarget: z.enum(['_self', '_blank']).optional(),
  position: z.string().optional(),
  sortOrder: z.number().optional(),
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
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

// GET - 获取轮播图详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; bannerId: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id, bannerId } = params
    const websiteId = parseInt(id)
    const bannerIdNum = parseInt(bannerId)

    if (isNaN(websiteId) || isNaN(bannerIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 获取轮播图详情
    const [banner] = await db
      .select()
      .from(banners)
      .where(and(
        eq(banners.websiteId, websiteId),
        eq(banners.id, bannerIdNum)
      ))
      .limit(1)

    if (!banner) {
      return corsResponse({
        success: false,
        error: '轮播图不存在'
      }, { status: 404 }, origin, userAgent)
    }

    return corsResponse({
      success: true,
      data: banner
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取轮播图详情失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT - 更新轮播图
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; bannerId: string } }
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

    const { id, bannerId } = params
    const websiteId = parseInt(id)
    const bannerIdNum = parseInt(bannerId)

    if (isNaN(websiteId) || isNaN(bannerIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证轮播图是否存在
    const [existingBanner] = await db
      .select()
      .from(banners)
      .where(and(
        eq(banners.websiteId, websiteId),
        eq(banners.id, bannerIdNum)
      ))
      .limit(1)

    if (!existingBanner) {
      return corsResponse({
        success: false,
        error: '轮播图不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = updateBannerSchema.parse(body)

    // 构建更新数据
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.subtitle !== undefined) updateData.subtitle = validatedData.subtitle
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl
    if (validatedData.imageAlt !== undefined) updateData.imageAlt = validatedData.imageAlt
    if (validatedData.linkUrl !== undefined) updateData.linkUrl = validatedData.linkUrl
    if (validatedData.linkTarget !== undefined) updateData.linkTarget = validatedData.linkTarget
    if (validatedData.position !== undefined) updateData.position = validatedData.position
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder
    if (validatedData.style !== undefined) updateData.style = validatedData.style
    if (validatedData.displayConditions !== undefined) updateData.displayConditions = validatedData.displayConditions
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished

    // 更新轮播图
    const [updatedBanner] = await db
      .update(banners)
      .set(updateData)
      .where(and(
        eq(banners.websiteId, websiteId),
        eq(banners.id, bannerIdNum)
      ))
      .returning()

    return corsResponse({
      success: true,
      data: updatedBanner,
      message: '轮播图更新成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.errors
      }, { status: 400 }, origin, userAgent)
    }

    console.error('更新轮播图失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE - 删除轮播图
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bannerId: string } }
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

    const { id, bannerId } = params
    const websiteId = parseInt(id)
    const bannerIdNum = parseInt(bannerId)

    if (isNaN(websiteId) || isNaN(bannerIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证轮播图是否存在
    const [existingBanner] = await db
      .select()
      .from(banners)
      .where(and(
        eq(banners.websiteId, websiteId),
        eq(banners.id, bannerIdNum)
      ))
      .limit(1)

    if (!existingBanner) {
      return corsResponse({
        success: false,
        error: '轮播图不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除轮播图
    await db
      .delete(banners)
      .where(and(
        eq(banners.websiteId, websiteId),
        eq(banners.id, bannerIdNum)
      ))

    return corsResponse({
      success: true,
      message: '轮播图删除成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('删除轮播图失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

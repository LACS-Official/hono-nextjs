import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareAnnouncements } from '@/lib/unified-db-connection'
import { eq, and, desc } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id]/announcements/[announcementId] - 获取特定公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const { id, announcementId } = params

    if (!id || !announcementId) {
      return corsResponse({
        success: false,
        error: '软件ID或公告ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)
    
    if (isNaN(softwareId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 获取公告详情
    const [announcement] = await db
      .select()
      .from(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.softwareId, softwareId),
        eq(softwareAnnouncements.id, announcementIdNum)
      ))
      .limit(1)
    
    if (!announcement) {
      return corsResponse({
        success: false,
        error: '未找到指定的公告'
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

// PUT /app/software/id/[id]/announcements/[announcementId] - 更新特定公告
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 统一认证验证（支持GitHub OAuth或API Key）
    const authValidation = validateUnifiedAuth(request)
    if (!authValidation.isValid) {
      return corsResponse({
        success: false,
        error: authValidation.error || 'Authentication required for software management operations',
        authType: authValidation.authType
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = authValidation.authType === 'github-oauth'
      ? `User: ${authValidation.user?.login} (${authValidation.user?.email})`
      : `API Key authentication`
    console.log(`[ANNOUNCEMENT_UPDATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id, announcementId } = params
    const body = await request.json()

    if (!id || !announcementId) {
      return corsResponse({
        success: false,
        error: '软件ID或公告ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)
    
    if (isNaN(softwareId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证公告是否存在
    const [existingAnnouncement] = await db
      .select()
      .from(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.softwareId, softwareId),
        eq(softwareAnnouncements.id, announcementIdNum)
      ))
      .limit(1)
    
    if (!existingAnnouncement) {
      return corsResponse({
        success: false,
        error: '未找到指定的公告'
      }, { status: 404 }, origin, userAgent)
    }

    // 验证必填字段
    const { title, content } = body
    
    if (!title || !content) {
      return corsResponse({
        success: false,
        error: '标题和内容为必填字段'
      }, { status: 400 }, origin, userAgent)
    }

    // 更新公告信息
    const updateData = {
      title: body.title,
      titleEn: body.titleEn,
      content: body.content,
      contentEn: body.contentEn,
      type: body.type || 'general',
      priority: body.priority || 'normal',
      version: body.version,
      isPublished: body.isPublished !== undefined ? body.isPublished : true,
      isSticky: body.isSticky !== undefined ? body.isSticky : false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      metadata: body.metadata || {},
      updatedAt: new Date()
    }

    const [updatedAnnouncement] = await db
      .update(softwareAnnouncements)
      .set(updateData)
      .where(and(
        eq(softwareAnnouncements.softwareId, softwareId),
        eq(softwareAnnouncements.id, announcementIdNum)
      ))
      .returning()

    return corsResponse({
      success: true,
      data: updatedAnnouncement,
      message: '公告更新成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE /app/software/id/[id]/announcements/[announcementId] - 删除特定公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; announcementId: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 统一认证验证（支持GitHub OAuth或API Key）
    const authValidation = validateUnifiedAuth(request)
    if (!authValidation.isValid) {
      return corsResponse({
        success: false,
        error: authValidation.error || 'Authentication required for software management operations',
        authType: authValidation.authType
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = authValidation.authType === 'github-oauth'
      ? `User: ${authValidation.user?.login} (${authValidation.user?.email})`
      : `API Key authentication`
    console.log(`[ANNOUNCEMENT_DELETE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id, announcementId } = params

    if (!id || !announcementId) {
      return corsResponse({
        success: false,
        error: '软件ID或公告ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const announcementIdNum = parseInt(announcementId)
    
    if (isNaN(softwareId) || isNaN(announcementIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证公告是否存在
    const [existingAnnouncement] = await db
      .select()
      .from(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.softwareId, softwareId),
        eq(softwareAnnouncements.id, announcementIdNum)
      ))
      .limit(1)
    
    if (!existingAnnouncement) {
      return corsResponse({
        success: false,
        error: '未找到指定的公告'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除公告
    await db
      .delete(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.softwareId, softwareId),
        eq(softwareAnnouncements.id, announcementIdNum)
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
import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareAnnouncements } from '@/lib/unified-db-connection'
import { eq, and, desc, or } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { getLatestVersionWithId, getLatestVersionWithDownloadUrl } from '@/lib/version-manager'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/[name] - 根据名称获取特定软件的详细信息
export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { name } = params
    
    if (!name) {
      return corsResponse({
        success: false,
        error: '软件名称参数缺失'
      }, { status: 400 }, origin, userAgent)
    }
    
    // URL 解码软件名称（支持中文和特殊字符）
    const decodedName = decodeURIComponent(name)
    
    // 查询软件信息（支持中英文名称查询）
    const [softwareInfo] = await db
      .select()
      .from(software)
      .where(
        and(
          or(
            eq(software.name, decodedName),
            eq(software.nameEn, decodedName)
          ),
          eq(software.isActive, true)
        )
      )
      .limit(1)
    
    if (!softwareInfo) {
      return corsResponse({
        success: false,
        error: '未找到指定的软件'
      }, { status: 404 }, origin, userAgent)
    }
    
    // 获取该软件的最新公告（最多5条）
    const latestAnnouncements = await db
      .select()
      .from(softwareAnnouncements)
      .where(
        and(
          eq(softwareAnnouncements.softwareId, softwareInfo.id),
          eq(softwareAnnouncements.isPublished, true)
        )
      )
      .orderBy(desc(softwareAnnouncements.publishedAt))
      .limit(5)

    // 获取最新版本ID和下载链接
    let currentVersionId = null
    let latestDownloadUrl = null
    try {
      const latestVersionInfo = await getLatestVersionWithDownloadUrl(softwareInfo.id)
      currentVersionId = latestVersionInfo?.id || null
      latestDownloadUrl = latestVersionInfo?.downloadUrl || null
    } catch (error) {
      console.warn(`获取软件 ${softwareInfo.id} 最新版本信息失败:`, error)
    }

    return corsResponse({
      success: true,
      data: {
        ...softwareInfo,
        currentVersionId,
        latestDownloadUrl,
        latestAnnouncements
      }
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取软件详情失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT /app/software/[name] - 更新软件信息（管理员功能）
export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

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
    console.log(`[SOFTWARE_UPDATE_BY_NAME] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { name } = params
    const body = await request.json()
    
    if (!name) {
      return corsResponse({
        success: false,
        error: '软件名称参数缺失'
      }, { status: 400 }, origin, userAgent)
    }
    
    const decodedName = decodeURIComponent(name)
    
    // 查找要更新的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.name, decodedName))
      .limit(1)
    
    if (!existingSoftware) {
      return corsResponse({
        success: false,
        error: '未找到指定的软件'
      }, { status: 404 }, origin, userAgent)
    }
    
    // 更新软件信息
    const updateData = {
      ...body,
      updatedAt: new Date()
    }
    
    // 移除不应该被更新的字段
    delete updateData.id
    delete updateData.createdAt
    
    const [updatedSoftware] = await db
      .update(software)
      .set(updateData)
      .where(eq(software.id, existingSoftware.id))
      .returning()
    
    return corsResponse({
      success: true,
      data: updatedSoftware
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新软件信息失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE /app/software/[name] - 删除软件（管理员功能）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

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
    console.log(`[SOFTWARE_DELETE_BY_NAME] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { name } = params
    
    if (!name) {
      return corsResponse({
        success: false,
        error: '软件名称参数缺失'
      }, { status: 400 }, origin, userAgent)
    }
    
    const decodedName = decodeURIComponent(name)
    
    // 查找要删除的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.name, decodedName))
      .limit(1)
    
    if (!existingSoftware) {
      return corsResponse({
        success: false,
        error: '未找到指定的软件'
      }, { status: 404 }, origin, userAgent)
    }
    
    // 软删除：设置为不活跃状态
    const [deletedSoftware] = await db
      .update(software)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(software.id, existingSoftware.id))
      .returning()
    
    return corsResponse({
      success: true,
      data: deletedSoftware,
      message: '软件已成功删除'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('删除软件失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

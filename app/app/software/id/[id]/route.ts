import { NextRequest } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { eq, sql } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { getLatestVersionWithId, getLatestVersionWithDownloadUrl } from '@/lib/version-manager'
import { getClientIP, checkRateLimit, detectAnomalousPattern } from '@/lib/anti-spam'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id] - 根据ID获取软件详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { id } = params

    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    if (isNaN(softwareId)) {
      return corsResponse({
        success: false,
        error: '无效的软件ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 防刷机制检查
    const clientIP = getClientIP(request)
    const rateLimitResult = checkRateLimit(clientIP, softwareId)

    if (!rateLimitResult.allowed) {
      return corsResponse({
        success: false,
        error: rateLimitResult.reason || '访问频率过高',
        retryAfter: rateLimitResult.retryAfter
      }, {
        status: 429,
        headers: rateLimitResult.retryAfter ? {
          'Retry-After': rateLimitResult.retryAfter.toString()
        } : undefined
      }, origin, userAgent)
    }

    // 异常模式检测
    const anomalyResult = detectAnomalousPattern(clientIP, softwareId)
    if (anomalyResult.isAnomalous && anomalyResult.confidence > 0.7) {
      console.warn(`检测到异常访问模式: IP=${clientIP}, 软件ID=${softwareId}, 原因=${anomalyResult.reason}`)
      // 对于异常模式，我们记录日志但不阻止访问，只是不增加访问量
    }

    // 查询软件信息
    const [softwareInfo] = await db
      .select()
      .from(software)
      .where(eq(software.id, softwareId))
      .limit(1)

    if (!softwareInfo) {
      return corsResponse({
        success: false,
        error: '未找到指定的软件'
      }, { status: 404 }, origin, userAgent)
    }

    // 原子性地递增访问计数（仅在非异常访问时）
    let updatedSoftwareInfo = softwareInfo
    const shouldIncrementViewCount = !anomalyResult.isAnomalous || anomalyResult.confidence <= 0.7

    if (shouldIncrementViewCount) {
      try {
        // 使用原子性的 SQL 操作来递增访问计数
        const [updated] = await db
          .update(software)
          .set({
            viewCount: sql`${software.viewCount} + 1`,
            updatedAt: new Date()
          })
          .where(eq(software.id, softwareId))
          .returning()

        if (updated) {
          updatedSoftwareInfo = updated
        }
      } catch (error) {
        // 访问计数更新失败不影响软件详情的返回
        // 记录错误但继续返回软件信息
        console.warn(`更新软件 ${softwareId} 访问计数失败:`, error)
        // 保持原始的软件信息，只是访问计数不会增加
      }
    } else {
      console.info(`跳过访问计数递增: IP=${clientIP}, 软件ID=${softwareId}, 原因=异常访问模式`)
    }

    // 获取最新版本ID和下载链接
    let currentVersionId = null
    let latestDownloadUrl = null
    try {
      const latestVersionInfo = await getLatestVersionWithDownloadUrl(softwareId)
      currentVersionId = latestVersionInfo?.id || null
      latestDownloadUrl = latestVersionInfo?.downloadUrl || null
    } catch (error) {
      console.warn(`获取软件 ${softwareId} 最新版本信息失败:`, error)
    }

    return corsResponse({
      success: true,
      data: {
        ...updatedSoftwareInfo,
        currentVersionId,
        latestDownloadUrl
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

// PUT /app/software/id/[id] - 更新软件信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    console.log(`[SOFTWARE_UPDATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id } = params
    const body = await request.json()

    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    if (isNaN(softwareId)) {
      return corsResponse({
        success: false,
        error: '无效的软件ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 查找要更新的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.id, softwareId))
      .limit(1)
    
    if (!existingSoftware) {
      return corsResponse({
        success: false,
        error: '软件不存在'
      }, { status: 404 }, origin, userAgent)
    }
    
    // 更新软件信息
    const {
      name,
      nameEn,
      description,
      descriptionEn,
      currentVersion,
      latestVersion,
      downloadUrl,
      downloadUrlBackup,
      officialWebsite,
      category,
      tags,
      systemRequirements,
      openname,
      filetype,
      fileSize,
      isActive,
      sortOrder,
      metadata = {}
    } = body
    
    const [updatedSoftware] = await db
      .update(software)
      .set({
        ...(name && { name }),
        ...(nameEn && { nameEn }),
        ...(description && { description }),
        ...(descriptionEn && { descriptionEn }),
        ...(currentVersion && { currentVersion }),
        ...(latestVersion && { latestVersion }),
        ...(downloadUrl && { downloadUrl }),
        ...(downloadUrlBackup && { downloadUrlBackup }),
        ...(officialWebsite && { officialWebsite }),
        ...(category && { category }),
        ...(tags && { tags }),
        ...(systemRequirements && { systemRequirements }),
        ...(openname !== undefined && { openname }),
        ...(filetype !== undefined && { filetype }),
        ...(fileSize && { fileSize }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof sortOrder === 'number' && { sortOrder }),
        metadata,
        updatedAt: new Date()
      })
      .where(eq(software.id, softwareId))
      .returning()
    
    return corsResponse({
      success: true,
      data: updatedSoftware
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新软件失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE /app/software/id/[id] - 删除软件
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    console.log(`[SOFTWARE_DELETE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id } = params

    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    if (isNaN(softwareId)) {
      return corsResponse({
        success: false,
        error: '无效的软件ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 查找要删除的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.id, softwareId))
      .limit(1)
    
    if (!existingSoftware) {
      return corsResponse({
        success: false,
        error: '软件不存在'
      }, { status: 404 }, origin, userAgent)
    }
    
    // 删除软件
    await db
      .delete(software)
      .where(eq(software.id, softwareId))
    
    return corsResponse({
      success: true,
      message: '软件删除成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('删除软件失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

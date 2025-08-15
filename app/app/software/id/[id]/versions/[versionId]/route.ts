import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareVersionHistory } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id]/versions/[versionId] - 获取特定版本详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { id, versionId } = params

    if (!id || !versionId) {
      return corsResponse({
        success: false,
        error: '软件ID或版本ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const versionIdNum = parseInt(versionId)
    
    if (isNaN(softwareId) || isNaN(versionIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 获取版本详情
    const [version] = await db
      .select()
      .from(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .limit(1)
    
    if (!version) {
      return corsResponse({
        success: false,
        error: '未找到指定的版本'
      }, { status: 404 }, origin, userAgent)
    }

    return corsResponse({
      success: true,
      data: version
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取版本详情失败:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      softwareId: params.id,
      versionId: params.versionId
    })
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT /app/software/id/[id]/versions/[versionId] - 更新特定版本
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
    console.log(`[VERSION_SPECIFIC_UPDATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id, versionId } = params
    const body = await request.json()

    if (!id || !versionId) {
      return corsResponse({
        success: false,
        error: '软件ID或版本ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const versionIdNum = parseInt(versionId)
    
    if (isNaN(softwareId) || isNaN(versionIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证版本是否存在
    const [existingVersion] = await db
      .select()
      .from(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .limit(1)
    
    if (!existingVersion) {
      return corsResponse({
        success: false,
        error: '未找到指定的版本'
      }, { status: 404 }, origin, userAgent)
    }

    // 更新版本信息
    const updateData = {
      version: body.version,
      releaseDate: body.releaseDate,
      releaseNotes: body.releaseNotes,
      releaseNotesEn: body.releaseNotesEn,
      downloadLinks: body.downloadLinks,
      fileSize: body.fileSize,
      fileSizeBytes: body.fileSizeBytes,
      fileHash: body.fileHash,
      isStable: body.isStable,
      isBeta: body.isBeta,
      isPrerelease: body.isPrerelease,
      versionType: body.versionType,
      changelogCategory: body.changelogCategory,
      metadata: body.metadata,
      updatedAt: new Date()
    }

    const [updatedVersion] = await db
      .update(softwareVersionHistory)
      .set(updateData)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .returning()

    return corsResponse({
      success: true,
      data: updatedVersion,
      message: '版本更新成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新版本失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE /app/software/id/[id]/versions/[versionId] - 删除特定版本
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
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
    console.log(`[VERSION_DELETE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id, versionId } = params

    if (!id || !versionId) {
      return corsResponse({
        success: false,
        error: '软件ID或版本ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    const versionIdNum = parseInt(versionId)
    
    if (isNaN(softwareId) || isNaN(versionIdNum)) {
      return corsResponse({
        success: false,
        error: '无效的ID格式'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证版本是否存在
    const [existingVersion] = await db
      .select()
      .from(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .limit(1)
    
    if (!existingVersion) {
      return corsResponse({
        success: false,
        error: '未找到指定的版本'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除版本
    await db
      .delete(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))

    return corsResponse({
      success: true,
      message: '版本删除成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('删除版本失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

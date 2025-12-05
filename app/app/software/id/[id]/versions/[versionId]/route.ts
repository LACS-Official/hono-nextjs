import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareVersionHistory } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

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
    // Supabase认证检查（需要管理员权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for software management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[VERSION_SPECIFIC_UPDATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const { id, versionId } = params
    
    // 解析请求体并保存以便错误处理时使用
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      return corsResponse({
        success: false,
        error: '请求体格式错误'
      }, { status: 400 }, origin, userAgent)
    }

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

    // 验证版本是否存在 - PUT方法中添加更详细的日志
    console.log(`[VERSION_UPDATE] 查询版本记录: softwareId=${softwareId}, versionId=${versionIdNum}`)
    
    const [existingVersion] = await db
      .select()
      .from(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .limit(1)
    
    if (!existingVersion) {
      console.log(`[VERSION_UPDATE] 版本记录不存在: softwareId=${softwareId}, versionId=${versionIdNum}`)
      return corsResponse({
        success: false,
        error: '未找到指定的版本',
        details: `软件ID: ${softwareId}, 版本ID: ${versionIdNum}`
      }, { status: 404 }, origin, userAgent)
    }
    
    console.log(`[VERSION_UPDATE] 找到版本记录:`, {
      id: existingVersion.id,
      version: existingVersion.version,
      softwareId: existingVersion.softwareId
    })

    // 更新版本信息 - 添加数据验证和类型转换
    const updateData: any = {
      updatedAt: new Date()
    }

    // 只更新提供的字段，避免undefined值导致的数据库错误
    if (body.version !== undefined) updateData.version = body.version
    if (body.releaseDate !== undefined) {
      updateData.releaseDate = typeof body.releaseDate === 'string' 
        ? new Date(body.releaseDate) 
        : body.releaseDate
    }
    if (body.releaseNotes !== undefined) updateData.releaseNotes = body.releaseNotes
    if (body.releaseNotesEn !== undefined) updateData.releaseNotesEn = body.releaseNotesEn
    if (body.downloadLinks !== undefined) updateData.downloadLinks = body.downloadLinks
    if (body.fileSize !== undefined) updateData.fileSize = body.fileSize
    if (body.fileSizeBytes !== undefined) updateData.fileSizeBytes = body.fileSizeBytes
    if (body.fileHash !== undefined) updateData.fileHash = body.fileHash
    if (body.isStable !== undefined) updateData.isStable = Boolean(body.isStable)
    if (body.isBeta !== undefined) updateData.isBeta = Boolean(body.isBeta)
    if (body.isPrerelease !== undefined) updateData.isPrerelease = Boolean(body.isPrerelease)
    if (body.versionType !== undefined) updateData.versionType = body.versionType
    if (body.changelogCategory !== undefined) updateData.changelogCategory = body.changelogCategory
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    console.log(`[VERSION_UPDATE] 更新数据:`, updateData)
    
    const [updatedVersion] = await db
      .update(softwareVersionHistory)
      .set(updateData)
      .where(and(
        eq(softwareVersionHistory.softwareId, softwareId),
        eq(softwareVersionHistory.id, versionIdNum)
      ))
      .returning()

    if (!updatedVersion) {
      console.error(`[VERSION_UPDATE] 数据库更新失败，未返回更新后的记录`)
      return corsResponse({
        success: false,
        error: '更新失败，未找到指定的版本记录'
      }, { status: 404 }, origin, userAgent)
    }
    
    console.log(`[VERSION_UPDATE] 更新成功:`, {
      id: updatedVersion.id,
      version: updatedVersion.version,
      updatedAt: updatedVersion.updatedAt
    })

    return corsResponse({
      success: true,
      data: updatedVersion,
      message: '版本更新成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新版本失败:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      softwareId: params.id,
      versionId: params.versionId
    })
    return corsResponse({
      success: false,
      error: '服务器内部错误',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
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
    // Supabase认证检查（需要管理员权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for software management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
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

import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareVersionHistory } from '@/lib/unified-db-connection'
import { eq, desc } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { updateLatestVersion, isValidVersion, getVersionType } from '@/lib/version-manager'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id]/versions - 获取软件版本历史
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

    // 首先验证软件是否存在
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
    
    // 获取该软件的版本历史
    let versions = []
    
    try {
      // 尝试查询版本历史表，如果表不存在则返回空数组
      versions = await db
        .select()
        .from(softwareVersionHistory)
        .where(eq(softwareVersionHistory.softwareId, softwareId))
        .orderBy(desc(softwareVersionHistory.releaseDate))
    } catch (error) {
      // 如果表不存在，创建一个基于当前软件信息的临时版本记录
      console.warn('版本历史表不存在，返回基于当前软件信息的临时数据:', error instanceof Error ? error.message : String(error))
      versions = [{
        id: `temp-${softwareId}`,
        softwareId: softwareId,
        version: softwareInfo.currentVersion,
        releaseDate: softwareInfo.createdAt,
        releaseNotes: '当前版本',
        releaseNotesEn: 'Current version',
        downloadLinks: {
          official: softwareInfo.officialWebsite
        },
        isStable: true,
        isBeta: false,
        metadata: {},
        createdAt: softwareInfo.createdAt,
        updatedAt: softwareInfo.updatedAt
      }]
    }
    
    return corsResponse({
      success: true,
      data: versions,
      meta: {
        software: softwareInfo,
        total: versions.length
      }
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取软件版本历史失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST /app/software/id/[id]/versions - 添加新版本
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // Supabase认证检查（仅需登录权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for software management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[VERSION_CREATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

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
    
    // 验证软件是否存在
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
    
    // 验证必填字段
    const {
      version,
      releaseDate,
      releaseNotes,
      releaseNotesEn,
      downloadLinks,
      fileSize,
      fileSizeBytes,
      fileHash,
      isStable = true,
      isBeta = false,
      isPrerelease = false,
      changelogCategory = [],
      metadata = {}
    } = body

    if (!version || !releaseDate) {
      return corsResponse({
        success: false,
        error: '版本号和发布日期为必填字段'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证版本号格式
    if (!isValidVersion(version)) {
      return corsResponse({
        success: false,
        error: '版本号格式无效，请使用语义化版本号格式 (如: 1.0.0)'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 插入新版本记录
    let newVersion
    try {
      [newVersion] = await db
        .insert(softwareVersionHistory)
        .values({
          softwareId: softwareId,
          version,
          releaseDate: new Date(releaseDate),
          releaseNotes,
          releaseNotesEn,
          downloadLinks,
          fileSize,
          fileSizeBytes,
          fileHash,
          isStable,
          isBeta,
          isPrerelease,
          versionType: getVersionType(version),
          changelogCategory,
          metadata
        })
        .returning()
    } catch (error) {
      console.error('版本历史表不存在，无法添加版本记录:', error instanceof Error ? error.message : String(error))
      return corsResponse({
        success: false,
        error: '版本历史功能暂时不可用，请联系管理员'
      }, { status: 503 }, origin, userAgent)
    }

    // 自动更新软件的最新版本号
    try {
      await updateLatestVersion(softwareId)
    } catch (error) {
      console.warn('自动更新最新版本失败:', error)
      // 不影响版本添加的成功响应
    }

    return corsResponse({
      success: true,
      data: newVersion,
      message: '版本添加成功'
    }, { status: 201 }, origin, userAgent)
    
  } catch (error) {
    console.error('添加软件版本失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT /app/software/id/[id]/versions - 更新软件的当前版本
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // Supabase认证检查（仅需登录权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for software management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[VERSION_UPDATE] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

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
    
    const { currentVersion, latestVersion } = body
    
    if (!currentVersion && !latestVersion) {
      return corsResponse({
        success: false,
        error: '至少需要提供当前版本或最新版本'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 构建更新数据
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (currentVersion) {
      updateData.currentVersion = currentVersion
    }
    
    if (latestVersion) {
      updateData.latestVersion = latestVersion
    }
    
    // 更新软件版本信息
    const [updatedSoftware] = await db
      .update(software)
      .set(updateData)
      .where(eq(software.id, softwareId))
      .returning()
    
    if (!updatedSoftware) {
      return corsResponse({
        success: false,
        error: '未找到指定的软件'
      }, { status: 404 }, origin, userAgent)
    }
    
    return corsResponse({
      success: true,
      data: updatedSoftware,
      message: '软件版本更新成功'
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('更新软件版本失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

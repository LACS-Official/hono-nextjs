import { NextRequest, NextResponse } from 'next/server'
import { softwareDb as db } from '@/lib/software-db-connection'
import { software, softwareVersionHistory } from '@/lib/software-schema'
import { eq, desc } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/[id]/versions - 获取软件版本历史
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
    
    // 首先验证软件是否存在
    const [softwareInfo] = await db
      .select()
      .from(software)
      .where(eq(software.id, id))
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
        .where(eq(softwareVersionHistory.softwareId, id))
        .orderBy(desc(softwareVersionHistory.releaseDate))
    } catch (error) {
      // 如果表不存在，创建一个基于当前软件信息的临时版本记录
      console.warn('版本历史表不存在，返回基于当前软件信息的临时数据:', error.message)
      versions = [{
        id: `temp-${id}`,
        softwareId: id,
        version: softwareInfo.currentVersion,
        releaseDate: softwareInfo.createdAt,
        releaseNotes: '当前版本',
        releaseNotesEn: 'Current version',
        downloadUrl: softwareInfo.downloadUrl,
        fileSize: softwareInfo.fileSize,
        isStable: true,
        isBeta: false,
        metadata: {},
        createdAt: softwareInfo.createdAt,
        updatedAt: softwareInfo.updatedAt
      }]
    }
    
    return corsResponse({
      success: true,
      data: {
        software: softwareInfo,
        versions
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

// POST /app/software/[id]/versions - 添加新版本
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // API Key 验证（写操作需要认证）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 验证软件是否存在
    const [softwareInfo] = await db
      .select()
      .from(software)
      .where(eq(software.id, id))
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
      downloadUrl,
      fileSize,
      isStable = true,
      isBeta = false,
      metadata = {}
    } = body
    
    if (!version || !releaseDate) {
      return corsResponse({
        success: false,
        error: '版本号和发布日期为必填字段'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 插入新版本记录
    let newVersion
    try {
      [newVersion] = await db
        .insert(softwareVersionHistory)
        .values({
          softwareId: id,
          version,
          releaseDate: new Date(releaseDate),
          releaseNotes,
          releaseNotesEn,
          downloadUrl,
          fileSize,
          isStable,
          isBeta,
          metadata
        })
        .returning()
    } catch (error) {
      console.error('版本历史表不存在，无法添加版本记录:', error.message)
      return corsResponse({
        success: false,
        error: '版本历史功能暂时不可用，请联系管理员'
      }, { status: 503 }, origin, userAgent)
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

// PUT /app/software/[id]/versions - 更新软件的当前版本
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // API Key 验证（写操作需要认证）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
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
      .where(eq(software.id, id))
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

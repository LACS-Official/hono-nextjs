import { NextRequest, NextResponse } from 'next/server'
import { softwareDb as db } from '@/lib/software-db-connection'
import { software, softwareAnnouncements } from '@/lib/software-schema'
import { eq, and, desc } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

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
    
    // 查询软件信息
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
    
    return corsResponse({
      success: true,
      data: softwareInfo
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
    
    // 查找要更新的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.id, id))
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
        ...(fileSize && { fileSize }),
        ...(typeof isActive === 'boolean' && { isActive }),
        ...(typeof sortOrder === 'number' && { sortOrder }),
        metadata,
        updatedAt: new Date()
      })
      .where(eq(software.id, id))
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
    
    if (!id) {
      return corsResponse({
        success: false,
        error: '软件ID参数缺失'
      }, { status: 400 }, origin, userAgent)
    }
    
    // 查找要删除的软件
    const [existingSoftware] = await db
      .select()
      .from(software)
      .where(eq(software.id, id))
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
      .where(eq(software.id, id))
    
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

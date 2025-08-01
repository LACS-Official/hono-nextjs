import { NextRequest } from 'next/server'
import { unifiedDb as db, software, softwareAnnouncements } from '@/lib/unified-db-connection'
import { eq, and, desc } from 'drizzle-orm'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id]/announcements - 获取软件公告
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
    
    // 获取该软件的公告
    const announcements = await db
      .select()
      .from(softwareAnnouncements)
      .where(
        and(
          eq(softwareAnnouncements.softwareId, softwareId),
          eq(softwareAnnouncements.isPublished, true)
        )
      )
      .orderBy(desc(softwareAnnouncements.publishedAt))
    
    return corsResponse({
      success: true,
      data: {
        software: softwareInfo,
        announcements
      }
    }, undefined, origin, userAgent)
    
  } catch (error) {
    console.error('获取软件公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST /app/software/id/[id]/announcements - 添加新公告
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
    const { title, content, titleEn, contentEn, type, priority, version, isPublished, expiresAt } = body

    if (!title || !content) {
      return corsResponse({
        success: false,
        error: '标题和内容为必填字段'
      }, { status: 400 }, origin, userAgent)
    }

    // 插入新公告
    const [newAnnouncement] = await db
      .insert(softwareAnnouncements)
      .values({
        softwareId: softwareId,
        title,
        titleEn,
        content,
        contentEn,
        type: type || 'general',
        priority: priority || 'normal',
        version,
        isPublished: isPublished !== undefined ? isPublished : true,
        publishedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        metadata: body.metadata || {}
      })
      .returning()

    return corsResponse({
      success: true,
      data: newAnnouncement,
      message: '公告添加成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('添加公告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

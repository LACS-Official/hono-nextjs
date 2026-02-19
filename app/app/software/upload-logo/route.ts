import { NextRequest } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { uploadToImgBed } from '@/lib/imgbed-utils'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// POST /app/software/upload-logo - 上传软件 Logo
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 认证检查（由于是上传到公共图床，通常至少需要登录，最好是管理员）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || '需要身份验证'
      }, { status: 401 }, origin, userAgent)
    }

    // 可选：检查是否为管理员
    if (!isAuthorizedAdmin(authResult.user)) {
        return corsResponse({
            success: false,
            error: '无权执行此操作'
        }, { status: 403 }, origin, userAgent)
    }

    const formData = await request.formData()
    const file = formData.get('file') as Blob | null

    if (!file) {
      return corsResponse({
        success: false,
        error: '未提供文件'
      }, { status: 400 }, origin, userAgent)
    }

    // 上传到 ImgBed
    const logoUrl = await uploadToImgBed(file)

    return corsResponse({
      success: true,
      data: {
        logoUrl
      }
    }, undefined, origin, userAgent)

  } catch (error: any) {
    console.error('上传 Logo 失败:', error)
    return corsResponse({
      success: false,
      error: error.message || '上传失败'
    }, { status: 500 }, origin, userAgent)
  }
}

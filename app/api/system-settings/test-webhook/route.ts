export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sendWebhookNotification, WebhookPlatform } from '@/lib/webhook-service'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function POST(request: NextRequest) {
  try {
    // 权限校验：支持 Supabase 管理员或 API Key
    const authResult = await authenticateRequest(request)
    const apiKeyResult = validateApiKeyWithExpiration(request)
    const isAuthorized = (authResult.success && authResult.user && isAuthorizedAdmin(authResult.user)) || apiKeyResult.isValid

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: '未授权访问：需要管理员权限' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      webhookUrl,
      webhookPlatform = 'generic',
      webhookSecret,
      customTitle,
      customMessage
    } = body

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
      return NextResponse.json(
        { success: false, error: '请输入有效的 Webhook HTTP/HTTPS 地址' },
        { status: 400 }
      )
    }

    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
    const title = customTitle || '【系统测试】Webhook 通道连通性测试'
    const content = customMessage || '这是一条来自系统管理后台的 Webhook 测试通知。如果您收到此消息，说明该 Webhook 机器人及通道配置正确且工作正常。'

    const result = await sendWebhookNotification({
      event: 'test_notification',
      title,
      content,
      fields: {
        '测试通道': webhookPlatform.toUpperCase(),
        '测试触发时间': now,
        '操作者': authResult.user?.email || '系统管理员',
        '目标地址': webhookUrl.length > 50 ? `${webhookUrl.substring(0, 47)}...` : webhookUrl
      },
      customConfig: {
        enabled: true,
        url: webhookUrl.trim(),
        secret: webhookSecret ? webhookSecret.trim() : undefined,
        platform: webhookPlatform as WebhookPlatform
      }
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Webhook 测试发送成功！目标服务已正常响应 (耗时 ${result.durationMs}ms)`,
        status: result.status,
        durationMs: result.durationMs,
        responseData: result.responseData
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Webhook 发送失败，请检查地址是否有效或网络是否可达',
        status: result.status,
        durationMs: result.durationMs,
        responseData: result.responseData
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Webhook 测试异常:', error)
    return NextResponse.json({
      success: false,
      error: '测试过程中发生系统错误: ' + (error?.message || '未知错误')
    }, { status: 500 })
  }
}

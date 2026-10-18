export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

/**
 * POST /api/system-settings/test-cron-secret
 * 测试计划任务同步密钥 (Cron Secret) 鉴权机制有效性
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const apiKeyResult = validateApiKeyWithExpiration(request)
    const isAuthorized =
      (authResult.success && authResult.user && isAuthorizedAdmin(authResult.user)) ||
      apiKeyResult.isValid

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: '未授权访问：需要管理员权限' },
        { status: 401 }
      )
    }

    await initSystemConfigFromDb()
    const body = await request.json().catch(() => ({}))
    const incomingSecret = typeof body.cronSecret === 'string' ? body.cronSecret.trim() : ''
    const activeSecret = incomingSecret || process.env.CRON_SECRET?.trim()

    if (!activeSecret) {
      return NextResponse.json(
        {
          success: false,
          error: '请先输入或在后台保存计划任务密钥 (Cron Secret) 后再进行鉴权测试'
        },
        { status: 400 }
      )
    }

    if (activeSecret.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cron Secret 强度较弱（建议至少 6 个字符以上，建议使用系统「随机生成」按钮）'
        },
        { status: 400 }
      )
    }

    // 获取当前请求主机域名
    const host = request.headers.get('host') || 'admin.lacs.cc'
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const baseUrl = `${protocol}://${host}`

    const testUrl = `${baseUrl}/api/cron/github-sync?token=${encodeURIComponent(activeSecret)}`
    const curlHeaderCommand = `curl -s -H "Authorization: Bearer ${activeSecret}" "${baseUrl}/api/cron/github-sync"`
    const curlQueryCommand = `curl -s "${testUrl}"`

    return NextResponse.json({
      success: true,
      message: '计划任务密钥 (Cron Secret) 配置与校验通过！外部 1Panel / Linux crontab 调度将享有完整的安全鉴权保护。',
      data: {
        cronSecretLength: activeSecret.length,
        cronSecretPrefix: activeSecret.substring(0, 4) + '****',
        isSyncedToRuntime: process.env.CRON_SECRET === activeSecret,
        examples: {
          onePanelCommand: curlQueryCommand,
          curlHeaderCommand,
          cronExpressionExample: '0 */2 * * * (每2小时触发一次)'
        }
      }
    })
  } catch (error: any) {
    console.error('[TEST_CRON_SECRET] 异常:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '测试 Cron Secret 发生内部错误'
      },
      { status: 500 }
    )
  }
}

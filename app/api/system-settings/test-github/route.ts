export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const incomingToken = typeof body.token === 'string' ? body.token.trim() : ''
    const activeToken = incomingToken || process.env.GITHUB_TOKEN?.trim()

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'LACS-Software-Manager/1.0',
    }

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`
    }

    // 请求 GitHub API 配额接口
    const rateLimitRes = await fetch('https://api.github.com/rate_limit', {
      headers,
      cache: 'no-store',
    })

    if (rateLimitRes.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: 'GitHub Token 无效或已失效 (401 Bad credentials)，请检查 Token 字符串是否完整正确',
        },
        { status: 400 }
      )
    }

    if (!rateLimitRes.ok) {
      const errorText = await rateLimitRes.text()
      return NextResponse.json(
        {
          success: false,
          error: `GitHub API 响应异常 (${rateLimitRes.status}): ${errorText.substring(0, 150)}`,
        },
        { status: 500 }
      )
    }

    const rateData = await rateLimitRes.json()
    const core = rateData?.resources?.core || rateData?.rate || {}

    let userLogin: string | null = null
    if (activeToken) {
      try {
        const userRes = await fetch('https://api.github.com/user', {
          headers,
          cache: 'no-store',
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          userLogin = userData.login || null
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      data: {
        hasToken: !!activeToken,
        limit: core.limit || (activeToken ? 5000 : 60),
        remaining: core.remaining ?? 0,
        resetTime: core.reset ? new Date(core.reset * 1000).toLocaleTimeString('zh-CN', { hour12: false }) : null,
        user: userLogin,
      },
      message: activeToken
        ? `Token 验证成功！当前配额上限 ${core.limit || 5000} 次/小时，剩余 ${core.remaining ?? 0} 次可用`
        : `未检测到自定义 Token，当前为匿名 IP 访问模式 (限制 60 次/小时，剩余 ${core.remaining ?? 0} 次)`,
    })
  } catch (error: any) {
    console.error('[TEST_GITHUB_TOKEN] 验证异常:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || '连接 GitHub API 发生网络超时或错误',
      },
      { status: 500 }
    )
  }
}

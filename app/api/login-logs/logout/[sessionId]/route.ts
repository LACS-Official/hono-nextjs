/**
 * 强制登出API路由
 * 允许管理员终止特定会话
 */

import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb, loginLogs } from '@/lib/system-settings-db'
import { eq } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { terminateSession } from '@/lib/login-log-utils'

// 强制登出
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // 验证用户权限，只有管理员可以执行强制登出
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 403 }
      )
    }

    const sessionId = params.sessionId
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '会话ID不能为空' },
        { status: 400 }
      )
    }

    // 终止会话
    const result = await terminateSession(sessionId)
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || '终止会话失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '会话已成功终止，设备已登出'
    })
  } catch (error) {
    console.error('强制登出失败:', error)
    return NextResponse.json(
      { success: false, error: '强制登出失败' },
      { status: 500 }
    )
  }
}

// 获取会话信息
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // 验证用户权限，只有管理员可以查看会话信息
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 403 }
      )
    }

    const sessionId = params.sessionId
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '会话ID不能为空' },
        { status: 400 }
      )
    }

    // 查询会话信息
    const sessionInfo = await systemSettingsDb
      .select()
      .from(loginLogs)
      .where(eq(loginLogs.sessionId, sessionId))
      .limit(1)

    if (sessionInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: '会话不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: sessionInfo[0]
    })
  } catch (error) {
    console.error('获取会话信息失败:', error)
    return NextResponse.json(
      { success: false, error: '获取会话信息失败' },
      { status: 500 }
    )
  }
}

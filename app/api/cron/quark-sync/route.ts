/**
 * 夸克网盘归档调度接口
 *
 * GET  : 列出待上传任务（由服务器执行器轮询领取）
 * POST : 领取 / 完成 / 失败回执
 *
 * 鉴权与 /api/cron/github-sync 完全一致：Cron Secret / API Key / Vercel Cron / 管理员会话
 * 注意：本接口不处理任何文件与夸克凭证，只做任务状态记录
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyCronAuth } from '@/lib/cron-auth'
import {
  listQuarkSyncTasks,
  claimQuarkSyncTask,
  completeQuarkSyncTask,
  failQuarkSyncTask,
} from '@/lib/quark-sync'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyCronAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error, code: 401 }, { status: 401 })
    }

    const result = await listQuarkSyncTasks()
    return NextResponse.json({
      success: true,
      authType: auth.authType,
      timestamp: new Date().toISOString(),
      ...result,
    })
  } catch (error: any) {
    console.error('[QUARK_SYNC_LIST] 执行异常:', error)
    return NextResponse.json(
      { success: false, error: error.message || '获取夸克归档任务失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyCronAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error, code: 401 }, { status: 401 })
    }

    const body = await request.json()
    const action = String(body?.action || '').toLowerCase()
    const versionId = Number(body?.versionId)

    if (!Number.isInteger(versionId) || versionId <= 0) {
      return NextResponse.json({ success: false, error: 'versionId 必须为有效正整数' }, { status: 400 })
    }

    if (action === 'claim') {
      const result = await claimQuarkSyncTask(versionId)
      return NextResponse.json({ success: result.ok, ...result })
    }

    if (action === 'complete') {
      const shareUrl = String(body?.shareUrl || '').trim()
      const fids = body?.fids && typeof body.fids === 'object' ? body.fids : {}
      await completeQuarkSyncTask(versionId, {
        shareUrl,
        fids,
        targetFolder: body?.targetFolder ? String(body.targetFolder) : undefined,
      })
      return NextResponse.json({ success: true, versionId, shareUrl })
    }

    if (action === 'fail') {
      await failQuarkSyncTask(versionId, String(body?.error || '未知错误'))
      return NextResponse.json({ success: true, versionId })
    }

    return NextResponse.json(
      { success: false, error: 'action 必须为 claim / complete / fail 之一' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[QUARK_SYNC_ACTION] 执行异常:', error)
    return NextResponse.json(
      { success: false, error: error.message || '处理夸克归档回执失败' },
      { status: 500 }
    )
  }
}

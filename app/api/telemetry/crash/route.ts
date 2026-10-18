export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { crashDb, clientCrashReports, ensureCrashReportsTable, calculateCrashHash } from '@/lib/crash-reports-db'
import { corsResponse, handleOptions } from '@/lib/cors'
import { getClientIp } from '@/lib/login-log-utils'

// OPTIONS 预检处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 崩溃上报入参校验模式
const crashReportSchema = z.object({
  softwareId: z.number().int().positive().optional(),
  softwareName: z.string().min(1, '软件名称不能为空').max(100),
  appVersion: z.string().min(1, '软件版本不能为空').max(50),
  osName: z.string().min(1, '操作系统名称不能为空').max(50),
  osVersion: z.string().max(100).optional().default(''),
  deviceModel: z.string().max(100).optional().default('Unknown'),
  cpuArch: z.string().max(50).optional().default(''),
  gpuRenderer: z.string().max(255).optional().default(''),
  errorType: z.string().min(1, '错误类型不能为空').max(100),
  errorMessage: z.string().min(1, '错误信息不能为空'),
  errorStack: z.string().optional().default(''),
  crashModule: z.string().max(255).optional().default(''),
  customData: z.any().optional().default({}),
  userId: z.string().max(255).optional().default(''),
})

/**
 * POST /api/telemetry/crash - 接收客户端崩溃日志上报
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return corsResponse({
        success: false,
        error: '无效的 JSON 请求体'
      }, { status: 400 }, origin, userAgent)
    }

    const parseResult = crashReportSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return corsResponse({
        success: false,
        error: `参数格式错误: ${errorMsg}`
      }, { status: 400 }, origin, userAgent)
    }

    const data = parseResult.data
    const clientIp = getClientIp(request) || 'unknown'

    // 计算崩溃签名哈希，用于同类错误自动聚合
    const crashHash = calculateCrashHash(
      data.softwareName,
      data.errorType,
      data.crashModule,
      data.errorStack
    )

    // 确保存储表已初始化
    await ensureCrashReportsTable()

    // 写入崩溃日志记录
    const [inserted] = await crashDb
      .insert(clientCrashReports)
      .values({
        softwareId: data.softwareId || null,
        softwareName: data.softwareName,
        appVersion: data.appVersion,
        osName: data.osName,
        osVersion: data.osVersion || null,
        deviceModel: data.deviceModel || null,
        cpuArch: data.cpuArch || null,
        gpuRenderer: data.gpuRenderer || null,
        errorType: data.errorType,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack || null,
        crashModule: data.crashModule || null,
        crashHash,
        customData: data.customData,
        clientIp,
        userId: data.userId || null,
        status: 'unresolved',
        createdAt: new Date(),
      })
      .returning({ id: clientCrashReports.id, crashHash: clientCrashReports.crashHash })

    // 异步尝试触发 Webhook 严重异常报警
    import('@/lib/webhook-service').then(({ sendWebhookNotification }) => {
      sendWebhookNotification({
        event: 'system_error',
        title: `客户端崩溃告警: [${data.softwareName} v${data.appVersion}]`,
        content: `【${data.errorType}】${data.errorMessage.substring(0, 200)}`,
        fields: {
          '软件名称': data.softwareName,
          '版本': data.appVersion,
          '崩溃位置': data.crashModule || '未指定模块',
          '系统平台': `${data.osName} ${data.osVersion || ''}`.trim(),
          '设备型号': data.deviceModel || '未知',
          '图形显卡': data.gpuRenderer || '未知',
          '客户端IP': clientIp,
        }
      }).catch(err => console.error('[Webhook Alert] 崩溃推送失败:', err))
    }).catch(() => {})

    return corsResponse({
      success: true,
      message: '崩溃报告已成功记录',
      data: {
        reportId: inserted.id,
        crashHash: inserted.crashHash
      }
    }, { status: 201 }, origin, userAgent)

  } catch (error: any) {
    console.error('记录客户端崩溃报告失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误，未能记录崩溃日志'
    }, { status: 500 }, origin, userAgent)
  }
}

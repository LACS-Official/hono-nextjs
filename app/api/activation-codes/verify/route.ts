// 验证激活码接口
import { NextRequest } from 'next/server'
import { activationCodesDb as db, activationCodes } from '@/lib/activation-codes-db'
import { eq, and, lt } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { TimeUtils } from '@/lib/time-utils'
import { z } from 'zod'

const requestSchema = z.object({
  code: z.string().min(1, '激活码不能为空')
})

// 验证激活码格式（支持新旧两种格式）
function isValidActivationCodeFormat(code: string): boolean {
  // 新格式：8位大写字母和数字
  const newFormatRegex = /^[A-Z0-9]{8}$/

  // 旧格式：带连字符的格式（如 "MDMNBPJX-3S0P6E-B1360C10"）
  const oldFormatRegex = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/

  return newFormatRegex.test(code) || oldFormatRegex.test(code)
}

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 注意：激活码验证是公开接口，不需要API Key验证
    // 这样客户端软件可以直接验证激活码而无需API Key
    const body = await request.json()
    const parseResult = requestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: parseResult.error.issues
      }, { status: 400 }, origin, userAgent)
    }

    const { code } = parseResult.data



    // 验证激活码格式（支持新旧两种格式）
    if (!isValidActivationCodeFormat(code)) {
      return corsResponse({
        success: false,
        error: '激活码格式不正确'
      }, { status: 400 }, origin, userAgent)
    }

    // 查找激活码
    const [activationCode] = await db
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.code, code))
      .limit(1)

    if (!activationCode) {
      return corsResponse({
        success: false,
        error: '激活码不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 检查是否已使用
    if (activationCode.isUsed) {
      return corsResponse({
        success: false,
        error: '激活码已被使用',
        data: {
          id: activationCode.id,
          code: activationCode.code,
          createdAt: activationCode.createdAt.toISOString(),
          expiresAt: activationCode.expiresAt.toISOString(),
          isUsed: true,
          usedAt: activationCode.usedAt?.toISOString(),
          isExpired: false,
          productInfo: activationCode.productInfo,
          metadata: activationCode.metadata
        }
      }, { status: 400 }, origin, userAgent)
    }

    // 检查是否过期（使用中国时区时间）
    const now = TimeUtils.nowInChina()
    if (now > activationCode.expiresAt) {
      return corsResponse({
        success: false,
        error: '激活码已过期',
        data: {
          id: activationCode.id,
          code: activationCode.code,
          createdAt: activationCode.createdAt.toISOString(),
          expiresAt: activationCode.expiresAt.toISOString(),
          isUsed: activationCode.isUsed,
          usedAt: activationCode.usedAt?.toISOString(),
          isExpired: true,
          productInfo: activationCode.productInfo,
          metadata: activationCode.metadata
        }
      }, { status: 400 }, origin, userAgent)
    }

    // 标记为已使用（带并发条件防重复兑换）
    const [updatedCode] = await db
      .update(activationCodes)
      .set({
        isUsed: true,
        usedAt: now
      })
      .where(and(eq(activationCodes.id, activationCode.id), eq(activationCodes.isUsed, false)))
      .returning()

    if (!updatedCode) {
      return corsResponse({
        success: false,
        error: '激活码已被使用',
        code: 'CODE_ALREADY_USED',
        message: '该激活码已被使用，无法重复激活'
      }, { status: 400 }, origin, userAgent)
    }

    // 检查激活码是否已过期（基于真实过期时间）
    const isExpired = now > activationCode.expiresAt

    // 构建返回数据，符合API文档格式（使用UTC时间格式供Rust解析）
    const responseData: any = {
      id: updatedCode.id,
      code: updatedCode.code,
      createdAt: activationCode.createdAt.toISOString(),
      expiresAt: activationCode.expiresAt.toISOString(),
      isUsed: updatedCode.isUsed,
      usedAt: updatedCode.usedAt!.toISOString(),
      isExpired: isExpired,
      productInfo: updatedCode.productInfo,
      metadata: updatedCode.metadata
    }

    // 计算激活码的剩余有效时间（基于激活码的真实过期时间）
    const remainingTime = Math.max(0, Math.floor((activationCode.expiresAt.getTime() - now.getTime()) / 1000))
    const remainingDays = Math.floor(remainingTime / (24 * 60 * 60))
    const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / 3600)
    const remainingMinutes = Math.floor((remainingTime % 3600) / 60)

    // 添加激活码验证过期时间信息（使用激活码的真实过期时间，UTC格式）
    responseData.apiValidation = {
      expiresAt: activationCode.expiresAt.toISOString(),
      remainingTime: remainingTime,
      message: remainingTime > 0
        ? `激活码原本将在 ${remainingDays} 天 ${remainingHours} 小时 ${remainingMinutes} 分钟后过期（现已激活）`
        : '激活码已过期（但已成功激活）'
    }

    // 异步触发 Webhook 卡密核销激活通知
    import('@/lib/webhook-service').then(({ sendWebhookNotification }) => {
      sendWebhookNotification({
        event: 'vip_activation',
        title: 'VIP 卡密兑换激活提醒',
        content: `卡密 [${updatedCode.code}] 已成功核销激活。`,
        fields: {
          '卡密编码': updatedCode.code,
          '产品名称': (updatedCode.productInfo as any)?.name || '默认产品',
          '核销时间': now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
          '请求来源': origin || 'API Direct',
          '客户端环境': userAgent || '未知'
        }
      }).catch(err => console.error('[Webhook Alert] 卡密激活通知失败:', err))
    }).catch(() => {})

    return corsResponse({
      success: true,
      data: responseData
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error verifying activation code:', error)
    return corsResponse({
      success: false,
      error: 'Failed to verify activation code'
    }, { status: 500 }, origin, userAgent)
  }
}

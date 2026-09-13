export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'
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

    const body = await request.json()
    const {
      toEmail,
      provider: customProvider,
      resendApiKey,
      resendFrom,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPass,
      smtpFrom,
    } = body

    if (!toEmail || typeof toEmail !== 'string' || !toEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: '请输入有效的收件人邮箱地址' },
        { status: 400 }
      )
    }

    const activeProvider = (customProvider || process.env.MAIL_PROVIDER || 'resend').toLowerCase() as 'resend' | 'smtp'
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })

    const subject = `【系统测试】发信通道连通性测试 (${activeProvider.toUpperCase()})`
    const html = `
      <div style="max-width: 580px; margin: 0 auto; padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #1d1d1f; border-radius: 18px; border: 1px solid #e5e5ea;">
        <h3 style="color: #0071e3; margin-top: 0; font-size: 20px; font-weight: 600;">发信服务连通测试成功</h3>
        <p style="font-size: 14px; line-height: 1.6; color: #515154;">
          这是一封来自玩机管家系统设置中心的通道连通性测试邮件。当您看到这封邮件，说明您所配置的发信服务已具备正式投递邮件的能力。
        </p>
        <div style="background-color: #f5f5f7; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
          <div><strong>发信通道模式:</strong> ${activeProvider === 'smtp' ? '标准 SMTP 协议' : 'Resend REST API'}</div>
          <div><strong>测试触发时间:</strong> ${now}</div>
          <div><strong>目标测试收件:</strong> ${toEmail}</div>
          ${activeProvider === 'smtp' && (smtpHost || process.env.SMTP_HOST) ? `<div><strong>SMTP 主机:</strong> ${smtpHost || process.env.SMTP_HOST}</div>` : ''}
          ${activeProvider === 'smtp' && (smtpUser || process.env.SMTP_USER) ? `<div><strong>发信账号:</strong> ${smtpUser || process.env.SMTP_USER}</div>` : ''}
        </div>
        <div style="font-size: 12px; color: #86868b; border-top: 1px solid #f2f2f7; padding-top: 14px;">
          此邮件仅用于验证邮件配置是否可用，无需回复。
        </div>
      </div>
    `

    const result = await sendEmail({
      to: toEmail,
      subject,
      html,
      provider: activeProvider,
      resendApiKey: resendApiKey || undefined,
      from: activeProvider === 'smtp' ? (smtpFrom || (smtpUser ? `"玩机管家" <${smtpUser}>` : undefined)) : resendFrom,
      smtpConfig: activeProvider === 'smtp' ? {
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort, 10) : undefined,
        secure: smtpSecure !== undefined ? Boolean(smtpSecure) : undefined,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
      } : undefined,
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `测试邮件发送成功！已成功投递至 ${toEmail} (通道: ${activeProvider.toUpperCase()})，MessageId: ${result.messageId || 'ok'}`,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || '发信失败，请检查通道密钥与发件人域名配置',
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('测试发信异常:', error)
    return NextResponse.json({
      success: false,
      error: `发信异常: ${error.message || '未知错误'}`,
    }, { status: 500 })
  }
}

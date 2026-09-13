import nodemailer from 'nodemailer'
import { initSystemConfigFromDb } from '@/lib/system-config-sync'

export interface SmtpConfigOptions {
  host?: string
  port?: number
  secure?: boolean
  user?: string
  pass?: string
  from?: string
}

export interface EmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
  provider?: 'resend' | 'smtp'
  resendApiKey?: string
  smtpConfig?: SmtpConfigOptions
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  provider?: string
}

/**
 * 通过 Resend REST API 发送邮件
 */
async function sendViaResend(
  to: string,
  from: string,
  subject: string,
  html?: string,
  text?: string,
  apiKeyOverride?: string
): Promise<EmailSendResult> {
  const apiKey = (apiKeyOverride || process.env.RESEND_API_KEY || '').trim()
  if (!apiKey || apiKey.includes('your_resend_api_key')) {
    return {
      success: false,
      provider: 'resend',
      error: '未配置有效的 RESEND_API_KEY，请在系统设置中填入有效密钥 (如 re_xxxxxxxx)',
    }
  }

  try {
    const payload: any = {
      from,
      to: [to],
      subject,
    }
    if (html) payload.html = html
    if (text) payload.text = text

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = (await response.json()) as { id: string }
      console.log(`[Email Service] Resend 发送成功！MessageId: ${data.id}`)
      return { success: true, messageId: data.id, provider: 'resend' }
    } else {
      let rawError = ''
      try {
        const errorJson = await response.json()
        rawError = errorJson.message || JSON.stringify(errorJson)
      } catch {
        rawError = await response.text()
      }

      console.error(`[Email Service] Resend 发送失败 (HTTP ${response.status}):`, rawError)

      // 智能诊断并提供指引
      if (rawError.includes('can only send testing emails to your own email address') || rawError.includes('validation_error')) {
        return {
          success: false,
          provider: 'resend',
          error: `Resend 免费沙箱限制：onboarding@resend.dev 仅能发送到注册 Resend 账号时填写的个人邮箱。如需向任意邮箱发信，请在 resend.com 控制台绑定自定义域名，或将系统通道切换为“标准 SMTP”。`,
        }
      } else if (rawError.includes('API key is invalid') || response.status === 401) {
        return {
          success: false,
          provider: 'resend',
          error: `Resend API Key 无效或未授权，请检查输入的密钥是否正确。`,
        }
      }

      return { success: false, provider: 'resend', error: `Resend 发信失败: ${rawError}` }
    }
  } catch (error: any) {
    console.error('[Email Service] Resend 发信网络异常:', error)
    return { success: false, provider: 'resend', error: `Resend 连接异常: ${error.message || error}` }
  }
}

/**
 * 通过 SMTP / Nodemailer 发送邮件
 */
async function sendViaSmtp(
  to: string,
  from: string,
  subject: string,
  html?: string,
  text?: string,
  smtpOverride?: SmtpConfigOptions
): Promise<EmailSendResult> {
  const host = (smtpOverride?.host || process.env.SMTP_HOST || '').trim()
  const port = smtpOverride?.port || parseInt(process.env.SMTP_PORT || '465', 10)
  const secure =
    smtpOverride?.secure !== undefined
      ? Boolean(smtpOverride.secure)
      : process.env.SMTP_SECURE === 'true' || port === 465
  const user = (smtpOverride?.user || process.env.SMTP_USER || '').trim()
  const pass = (smtpOverride?.pass || process.env.SMTP_PASS || '').trim()

  if (!host || !user || !pass) {
    return {
      success: false,
      provider: 'smtp',
      error: 'SMTP 配置不完整：需要填写 SMTP 服务器主机、发信账号及授权码/密码',
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        // 允许自签名或自建服务证书协商
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })

    const mailOptions: any = {
      from,
      to,
      subject,
    }
    if (html) mailOptions.html = html
    if (text) mailOptions.text = text

    const info = await transporter.sendMail(mailOptions)
    console.log(`[Email Service] SMTP 邮件发送成功！MessageId: ${info.messageId}`)
    return { success: true, messageId: info.messageId, provider: 'smtp' }
  } catch (error: any) {
    console.error('[Email Service] SMTP 发信失败:', error)
    const errString = String(error.message || error)

    // 智能诊断并给出明确修改建议
    if (errString.includes('535') || errString.toLowerCase().includes('authentication failed')) {
      return {
        success: false,
        provider: 'smtp',
        error: `SMTP 身份验证失败 (535)：发信账号或密码/授权码错误。提示：QQ 邮箱/网易 163 邮箱须在邮箱网页版设置中开启 POP3/SMTP 并生成 16 位的客户端专属授权码，不能直接填网页登录密码。`,
      }
    } else if (errString.includes('ETIMEDOUT') || errString.includes('ESOCKETTIMEDOUT')) {
      return {
        success: false,
        provider: 'smtp',
        error: `SMTP 连接超时：无法连通服务器 ${host}:${port}。请检查主机地址、端口是否被防火墙阻拦，或确认 465 端口是否开启了 SSL 加密。`,
      }
    } else if (errString.includes('ECONNREFUSED')) {
      return {
        success: false,
        provider: 'smtp',
        error: `SMTP 连接被拒绝：服务器 ${host}:${port} 拒绝连接，请确认端口号是否正确（常规 SSL 端口为 465，STARTTLS 为 587）。`,
      }
    }

    return { success: false, provider: 'smtp', error: `SMTP 发信异常: ${errString}` }
  }
}

/**
 * 全局统一发信方法
 */
export async function sendEmail(options: EmailOptions): Promise<EmailSendResult> {
  // 确保已从数据库预加载配置
  await initSystemConfigFromDb()

  const provider = (options.provider || process.env.MAIL_PROVIDER || 'resend').toLowerCase() as 'resend' | 'smtp'

  // 发信人优先级：显式指定 > SMTP专属发件人 > 环境变量RESEND_FROM > 根据账号构造
  let defaultFrom = ''
  if (provider === 'smtp') {
    const user = options.smtpConfig?.user || process.env.SMTP_USER
    defaultFrom =
      options.smtpConfig?.from ||
      process.env.SMTP_FROM ||
      (user ? `"玩机管家" <${user}>` : '"玩机管家" <noreply@localhost>')
  } else {
    defaultFrom =
      process.env.RESEND_FROM ||
      '"玩机管家" <onboarding@resend.dev>'
  }

  const from = options.from || defaultFrom

  if (provider === 'smtp') {
    return await sendViaSmtp(options.to, from, options.subject, options.html, options.text, options.smtpConfig)
  } else {
    return await sendViaResend(options.to, from, options.subject, options.html, options.text, options.resendApiKey)
  }
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const subject = '【玩机管家】邮箱账号注册验证码'
  const html = `
    <div style="max-width: 580px; margin: 0 auto; padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1d1d1f; border-radius: 18px; border: 1px solid #e5e5ea;">
      <div style="text-align: center; border-bottom: 1px solid #f2f2f7; padding-bottom: 18px;">
        <h2 style="color: #0071e3; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.02em;">玩机管家</h2>
        <p style="margin: 6px 0 0 0; color: #86868b; font-size: 13px;">账号安全验证</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">尊敬的用户，您好：</p>
        <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #515154;">
          您正在进行身份校验，请输入以下 6 位数字验证码：
        </p>
        
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; padding: 14px 36px; font-size: 32px; font-weight: 700; color: #ffffff; background-color: #0071e3; border-radius: 14px; letter-spacing: 6px; box-shadow: 0 4px 12px rgba(0,113,227,0.25);">
            ${code}
          </span>
        </div>
        
        <p style="font-size: 13px; color: #ff3b30; line-height: 1.6; margin: 0;">
          * 此验证码有效时间为 10 分钟。若非您本人操作，请忽略此邮件。
        </p>
      </div>
      <div style="border-top: 1px solid #f2f2f7; padding-top: 16px; text-align: center; font-size: 12px; color: #86868b;">
        <p style="margin: 0;">此邮件为系统自动发出，请勿直接回复</p>
      </div>
    </div>
  `

  console.log(`[Email Service] 正在向 ${email} 投递验证码: ${code}`)
  const result = await sendEmail({ to: email, subject, html })

  if (!result.success) {
    console.warn(`[Email Service] 验证码投递失败: ${result.error}`)
  }
  return result.success
}

/**
 * 发送新设备 / 异地登录安全告警邮件
 */
export async function sendLoginAlertEmail(
  to: string,
  details: {
    ip: string
    deviceName: string
    browser: string
    os: string
    time: string
    location?: string
    alertType?: 'new_device' | 'suspicious_ip' | 'both'
  }
): Promise<boolean> {
  const isNewDevice = details.alertType === 'new_device' || details.alertType === 'both'
  const subject = isNewDevice
    ? '【安全提醒】玩机管家账号新设备登录通知'
    : '【安全提醒】玩机管家账号异地登录提醒'

  const alertBadgeText =
    details.alertType === 'both'
      ? '全新设备 & 异地 IP 登录'
      : details.alertType === 'new_device'
      ? '全新设备登录'
      : '异地 IP 登录'

  const html = `
    <div style="max-width: 580px; margin: 0 auto; padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1d1d1f; border-radius: 18px; border: 1px solid #e5e5ea; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
      <div style="text-align: center; border-bottom: 1px solid #f2f2f7; padding-bottom: 18px;">
        <span style="display: inline-block; padding: 4px 12px; background-color: #fff2e8; color: #fa541c; font-size: 12px; font-weight: 600; border-radius: 100px; margin-bottom: 10px;">
          ${alertBadgeText}
        </span>
        <h2 style="color: #1d1d1f; margin: 0; font-size: 20px; font-weight: 600;">安全告警通知</h2>
        <p style="margin: 6px 0 0 0; color: #86868b; font-size: 13px;">系统监测到您的账号存在新环境登录行为</p>
      </div>
      <div style="padding: 24px 0;">
        <p style="font-size: 14px; line-height: 1.6; color: #515154;">
          尊敬的用户，您的玩机管家账号刚刚在以下设备环境中成功登入：
        </p>
        <div style="background-color: #f5f5f7; border-radius: 14px; padding: 18px 20px; margin: 18px 0; font-size: 13px; line-height: 2;">
          <div><span style="color: #86868b; display: inline-block; width: 80px;">登录时间：</span><strong>${details.time}</strong></div>
          <div><span style="color: #86868b; display: inline-block; width: 80px;">登录设备：</span><strong>${details.deviceName}</strong></div>
          <div><span style="color: #86868b; display: inline-block; width: 80px;">操作系统：</span><strong>${details.os}</strong></div>
          <div><span style="color: #86868b; display: inline-block; width: 80px;">浏览器端：</span><strong>${details.browser}</strong></div>
          <div><span style="color: #86868b; display: inline-block; width: 80px;">IP 地址：</span><strong>${details.ip}</strong> ${details.location ? `<span style="color: #86868b;">(${details.location})</span>` : ''}</div>
        </div>
        <div style="padding: 12px 16px; background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 10px; font-size: 12px; color: #d46b08; line-height: 1.6;">
          <strong>安全提示：</strong>如果这并非您本人的操作，说明您的登录密码或会话凭据可能已被泄露。请立即前往系统后台修改密码，并在【登录日志】中强制终止未知会话。
        </div>
      </div>
      <div style="border-top: 1px solid #f2f2f7; padding-top: 16px; text-align: center; font-size: 12px; color: #86868b;">
        <p style="margin: 0;">此邮件由玩机管家安全中心自动发出，请勿直接回复</p>
      </div>
    </div>
  `

  console.log(`[Email Service] 正在向 ${to} 投递登录安全告警邮件 (${alertBadgeText})`)
  const result = await sendEmail({ to, subject, html })
  if (result.success) {
    console.log(`[Email Service] 安全告警邮件发送成功！MessageId: ${result.messageId}`)
  } else {
    console.warn(`[Email Service] 安全告警邮件投递失败: ${result.error}`)
  }
  return result.success
}

/**
 * 发送系统通用通知邮件
 */
export async function sendSystemAlertEmail(
  to: string,
  title: string,
  content: string
): Promise<boolean> {
  const subject = `【系统通知】${title}`
  const html = `
    <div style="max-width: 580px; margin: 0 auto; padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1d1d1f; border-radius: 18px; border: 1px solid #e5e5ea;">
      <div style="border-bottom: 1px solid #f2f2f7; padding-bottom: 16px;">
        <h3 style="color: #0071e3; margin: 0; font-size: 18px;">${title}</h3>
      </div>
      <div style="padding: 20px 0; font-size: 14px; line-height: 1.7; color: #333336;">
        ${content}
      </div>
      <div style="border-top: 1px solid #f2f2f7; padding-top: 14px; font-size: 12px; color: #86868b;">
        玩机管家管理后台 · 自动通知
      </div>
    </div>
  `

  const result = await sendEmail({ to, subject, html })
  return result.success
}

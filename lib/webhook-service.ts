import crypto from 'crypto'

export type WebhookPlatform = 'generic' | 'wecom' | 'dingtalk' | 'feishu' | 'discord' | 'slack'

export interface WebhookConfig {
  enabled: boolean
  url: string
  secret?: string
  platform: WebhookPlatform
  events: string[]
}

export interface WebhookNotificationParams {
  event: string
  title: string
  content: string
  fields?: Record<string, string | number | boolean | undefined | null>
  customConfig?: Partial<WebhookConfig>
}

export interface WebhookSendResult {
  success: boolean
  error?: string
  status?: number
  durationMs: number
  responseData?: any
}

/**
 * 获取当前运行时生效的 Webhook 配置
 */
export function getWebhookConfig(): WebhookConfig {
  const enabled = process.env.WEBHOOK_ENABLED === 'true'
  const url = process.env.WEBHOOK_URL || ''
  const secret = process.env.WEBHOOK_SECRET || ''
  const platform = (process.env.WEBHOOK_PLATFORM || 'generic') as WebhookPlatform
  const rawEvents = process.env.WEBHOOK_EVENTS || 'suspicious_login,vip_activation,system_error'
  const events = rawEvents.split(',').map(e => e.trim()).filter(Boolean)

  return {
    enabled,
    url,
    secret,
    platform,
    events
  }
}

/**
 * 钉钉机器人加签签名计算
 * 规则：把 timestamp + "\n" + 密钥 当作签名字符串，使用 HmacSHA256 算法计算签名并 Base64 编码，再进行 URL 编码
 */
function getDingTalkSignedUrl(webhookUrl: string, secret?: string): string {
  if (!secret) return webhookUrl

  const timestamp = Date.now()
  const stringToSign = `${timestamp}\n${secret}`
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(stringToSign)
  const sign = encodeURIComponent(hmac.digest('base64'))

  const separator = webhookUrl.includes('?') ? '&' : '?'
  return `${webhookUrl}${separator}timestamp=${timestamp}&sign=${sign}`
}

/**
 * 飞书机器人加签签名计算
 * 规则：把 timestamp + "\n" + 密钥 当作签名字符串，使用 HmacSHA256 算法计算签名并 Base64 编码
 */
function getFeishuSignature(secret?: string): { timestamp: string; sign: string } | null {
  if (!secret) return null

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const stringToSign = `${timestamp}\n${secret}`
  const hmac = crypto.createHmac('sha256', stringToSign)
  const sign = hmac.digest('base64')

  return { timestamp, sign }
}

/**
 * 构建各平台特定的消息载荷 (Payload)
 */
function buildPlatformPayload(
  platform: WebhookPlatform,
  title: string,
  content: string,
  fields: Record<string, any> = {},
  secret?: string
): { urlModifier?: (url: string) => string; payload: any; headers?: Record<string, string> } {
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  const fieldList = Object.entries(fields).filter(([_, v]) => v !== undefined && v !== null && v !== '')

  switch (platform) {
    case 'wecom': {
      // 企业微信群机器人 Markdown 规范
      const fieldLines = fieldList.map(([k, v]) => `> **${k}**: <font color="comment">${v}</font>`).join('\n')
      const markdownContent = [
        `### 🔔 **${title}**`,
        `> 时间: <font color="comment">${now}</font>`,
        content ? `\n${content}` : '',
        fieldLines ? `\n${fieldLines}` : ''
      ].filter(Boolean).join('\n')

      return {
        payload: {
          msgtype: 'markdown',
          markdown: {
            content: markdownContent
          }
        }
      }
    }

    case 'dingtalk': {
      // 钉钉自定义机器人 Markdown 规范
      const fieldLines = fieldList.map(([k, v]) => `- **${k}**: ${v}`).join('\n')
      const markdownText = [
        `### 🔔 **${title}**`,
        `- **时间**: ${now}`,
        content ? `\n${content}` : '',
        fieldLines ? `\n${fieldLines}` : ''
      ].filter(Boolean).join('\n')

      return {
        urlModifier: (url) => getDingTalkSignedUrl(url, secret),
        payload: {
          msgtype: 'markdown',
          markdown: {
            title: title,
            text: markdownText
          }
        }
      }
    }

    case 'feishu': {
      // 飞书机器人交互式卡片规范
      const signInfo = getFeishuSignature(secret)
      const fieldElements = fieldList.map(([k, v]) => ({
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**${k}**: ${v}`
        }
      }))

      return {
        payload: {
          ...(signInfo ? { timestamp: signInfo.timestamp, sign: signInfo.sign } : {}),
          msg_type: 'interactive',
          card: {
            header: {
              title: {
                tag: 'plain_text',
                content: `🔔 ${title}`
              },
              template: 'blue'
            },
            elements: [
              {
                tag: 'div',
                text: {
                  tag: 'lark_md',
                  content: `${content ? `${content}\n\n` : ''}**通知时间**: ${now}`
                }
              },
              ...fieldElements
            ]
          }
        }
      }
    }

    case 'discord': {
      // Discord Webhook Embed 规范
      const discordFields = fieldList.map(([k, v]) => ({
        name: k,
        value: String(v),
        inline: true
      }))

      return {
        payload: {
          username: '系统通知',
          embeds: [
            {
              title: `🔔 ${title}`,
              description: content,
              color: 3447003, // Blue
              timestamp: new Date().toISOString(),
              fields: discordFields
            }
          ]
        }
      }
    }

    case 'slack': {
      // Slack Webhook 规范
      const slackFields = fieldList.map(([k, v]) => `*${k}*: ${v}`).join('\n')
      return {
        payload: {
          text: `🔔 *${title}*\n${content}\n_时间: ${now}_\n${slackFields}`
        }
      }
    }

    case 'generic':
    default: {
      // 通用 Webhook JSON 规范
      const payload = {
        event: 'notification',
        title,
        message: content,
        timestamp: new Date().toISOString(),
        localTime: now,
        data: fields
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      if (secret) {
        headers['X-Webhook-Secret'] = secret
        const hmac = crypto.createHmac('sha256', secret)
        hmac.update(JSON.stringify(payload))
        headers['X-Webhook-Signature'] = `sha256=${hmac.digest('hex')}`
      }

      return {
        payload,
        headers
      }
    }
  }
}

/**
 * 发送 Webhook 通知
 */
export async function sendWebhookNotification(
  params: WebhookNotificationParams
): Promise<WebhookSendResult> {
  const startTime = Date.now()
  const currentConfig = getWebhookConfig()
  const config: WebhookConfig = {
    ...currentConfig,
    ...(params.customConfig || {})
  }

  // 如果没有提供自定义配置，必须检查总开关与事件订阅
  if (!params.customConfig) {
    if (!config.enabled) {
      return {
        success: false,
        error: 'Webhook 通知总开关未开启',
        durationMs: 0
      }
    }

    if (config.events && config.events.length > 0 && !config.events.includes(params.event)) {
      return {
        success: false,
        error: `事件 [${params.event}] 未在 Webhook 订阅事件列表中`,
        durationMs: 0
      }
    }
  }

  if (!config.url || !config.url.startsWith('http')) {
    return {
      success: false,
      error: 'Webhook 地址未配置或格式无效',
      durationMs: 0
    }
  }

  try {
    const { urlModifier, payload, headers = {} } = buildPlatformPayload(
      config.platform,
      params.title,
      params.content,
      params.fields || {},
      config.secret
    )

    const targetUrl = urlModifier ? urlModifier(config.url) : config.url

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LACS-System-Webhook/1.0',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const durationMs = Date.now() - startTime

    const responseText = await response.text()
    let responseData: any = null
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    // 针对国内主流机器人检查业务返回码
    if (response.ok) {
      if (responseData && typeof responseData === 'object') {
        // 企业微信: errcode === 0 为成功
        if (config.platform === 'wecom' && responseData.errcode !== undefined && responseData.errcode !== 0) {
          return {
            success: false,
            error: `企业微信机器人响应错误: [${responseData.errcode}] ${responseData.errmsg || '未知原因'}`,
            status: response.status,
            durationMs,
            responseData
          }
        }
        // 钉钉: errcode === 0 为成功
        if (config.platform === 'dingtalk' && responseData.errcode !== undefined && responseData.errcode !== 0) {
          return {
            success: false,
            error: `钉钉机器人响应错误: [${responseData.errcode}] ${responseData.errmsg || '未知原因'}`,
            status: response.status,
            durationMs,
            responseData
          }
        }
        // 飞书: code === 0 为成功
        if (config.platform === 'feishu' && responseData.code !== undefined && responseData.code !== 0) {
          return {
            success: false,
            error: `飞书机器人响应错误: [${responseData.code}] ${responseData.msg || '未知原因'}`,
            status: response.status,
            durationMs,
            responseData
          }
        }
      }

      return {
        success: true,
        status: response.status,
        durationMs,
        responseData
      }
    } else {
      return {
        success: false,
        error: `目标服务器响应错误: HTTP ${response.status} ${response.statusText}`,
        status: response.status,
        durationMs,
        responseData
      }
    }
  } catch (error: any) {
    const durationMs = Date.now() - startTime
    const isTimeout = error.name === 'AbortError'
    return {
      success: false,
      error: isTimeout ? '请求超时 (10秒未响应)' : `网络请求失败: ${error.message || '未知错误'}`,
      durationMs
    }
  }
}

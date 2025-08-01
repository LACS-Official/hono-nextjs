/**
 * 请求签名验证工具
 * 用于验证请求的完整性和来源
 */

import crypto from 'crypto'

/**
 * 签名验证结果接口
 */
export interface SignatureVerifyResult {
  valid: boolean
  error?: string
}

/**
 * 请求签名工具类
 */
export class RequestSignature {
  private static secret: string | null = null

  /**
   * 获取签名密钥
   */
  private static getSecret(): string {
    if (!this.secret) {
      this.secret = process.env.REQUEST_SIGNATURE_SECRET || null
      if (!this.secret) {
        throw new Error('REQUEST_SIGNATURE_SECRET environment variable is not set')
      }
    }
    return this.secret
  }

  /**
   * 生成请求签名
   * @param method HTTP 方法
   * @param path 请求路径
   * @param body 请求体（可选）
   * @param timestamp 时间戳
   * @param nonce 随机数
   */
  static generateSignature(
    method: string,
    path: string,
    body: string = '',
    timestamp: number,
    nonce: string
  ): string {
    try {
      // 构建签名字符串
      const signatureString = [
        method.toUpperCase(),
        path,
        body,
        timestamp.toString(),
        nonce,
        this.getSecret()
      ].join('|')

      // 生成 HMAC-SHA256 签名
      const signature = crypto
        .createHmac('sha256', this.getSecret())
        .update(signatureString, 'utf8')
        .digest('hex')

      return signature
    } catch (error) {
      console.error('Error generating signature:', error)
      throw new Error('Failed to generate request signature')
    }
  }

  /**
   * 验证请求签名
   * @param method HTTP 方法
   * @param path 请求路径
   * @param body 请求体（可选）
   * @param timestamp 时间戳
   * @param nonce 随机数
   * @param providedSignature 提供的签名
   */
  static verifySignature(
    method: string,
    path: string,
    body: string = '',
    timestamp: number,
    nonce: string,
    providedSignature: string
  ): SignatureVerifyResult {
    try {
      // 检查时间戳（防止重放攻击）
      const now = Math.floor(Date.now() / 1000)
      const timeDiff = Math.abs(now - timestamp)
      
      // 允许 5 分钟的时间偏差
      if (timeDiff > 300) {
        return {
          valid: false,
          error: 'Request timestamp is too old or too far in the future'
        }
      }

      // 生成期望的签名
      const expectedSignature = this.generateSignature(method, path, body, timestamp, nonce)

      // 使用安全的字符串比较
      const expectedBuffer = new Uint8Array(Buffer.from(expectedSignature, 'hex'))
      const providedBuffer = new Uint8Array(Buffer.from(providedSignature, 'hex'))
      const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer)

      if (!isValid) {
        return {
          valid: false,
          error: 'Invalid request signature'
        }
      }

      return { valid: true }
    } catch (error) {
      console.error('Signature verification error:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Signature verification failed'
      }
    }
  }

  /**
   * 从请求头中提取签名信息
   */
  static extractSignatureInfo(headers: Headers): {
    signature?: string
    timestamp?: number
    nonce?: string
  } {
    return {
      signature: headers.get('X-Request-Signature') || undefined,
      timestamp: headers.get('X-Request-Timestamp') 
        ? parseInt(headers.get('X-Request-Timestamp')!) 
        : undefined,
      nonce: headers.get('X-Request-Nonce') || undefined
    }
  }

  /**
   * 生成随机 nonce
   */
  static generateNonce(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  /**
   * 获取当前时间戳
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000)
  }
}

export default RequestSignature

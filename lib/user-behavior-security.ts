/**
 * 用户行为统计 API 安全中间件
 * 提供多层安全验证机制
 */

import { NextRequest, NextResponse } from 'next/server'
import { JWTUtils } from './jwt-utils'
import { RequestSignature } from './request-signature'

/**
 * 安全验证结果接口
 */
export interface SecurityCheckResult {
  success: boolean
  error?: string
  statusCode?: number
}

/**
 * 用户行为统计安全中间件类
 */
export class UserBehaviorSecurity {
  /**
   * 检查是否启用安全验证
   */
  private static isSecurityEnabled(): boolean {
    return process.env.ENABLE_USER_BEHAVIOR_API_SECURITY === 'true'
  }

  /**
   * 验证 User-Agent
   */
  private static verifyUserAgent(userAgent: string | null): SecurityCheckResult {
    if (!process.env.ENABLE_STRICT_USER_AGENT_CHECK || 
        process.env.ENABLE_STRICT_USER_AGENT_CHECK !== 'true') {
      return { success: true }
    }

    if (!userAgent) {
      return {
        success: false,
        error: 'Missing User-Agent header',
        statusCode: 400
      }
    }

    const allowedPatterns = process.env.ALLOWED_USER_AGENTS?.split('|') || []
    const isAllowed = allowedPatterns.some(pattern => {
      try {
        const regex = new RegExp(pattern)
        return regex.test(userAgent)
      } catch (error) {
        console.error('Invalid User-Agent pattern:', pattern, error)
        return false
      }
    })

    if (!isAllowed) {
      return {
        success: false,
        error: 'Unauthorized User-Agent',
        statusCode: 403
      }
    }

    return { success: true }
  }

  /**
   * 验证客户端来源
   */
  private static verifyClientOrigin(origin: string | null, referer: string | null): SecurityCheckResult {
    const allowedOrigins = process.env.ALLOWED_CLIENT_ORIGINS?.split(',') || []

    // 如果没有配置允许的来源，则跳过检查（开发模式）
    if (allowedOrigins.length === 0) {
      console.warn('⚠️ ALLOWED_CLIENT_ORIGINS 未配置，跳过客户端来源验证')
      return { success: true }
    }

    // 检查 Origin 头
    if (origin && allowedOrigins.includes(origin)) {
      return { success: true }
    }

    // 检查 Referer 头（作为备选）
    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin
        if (allowedOrigins.includes(refererOrigin)) {
          return { success: true }
        }
      } catch (error) {
        console.warn('⚠️ 无法解析 Referer URL:', referer)
      }
    }

    // 对于 Tauri 应用或桌面应用，可能没有标准的 Origin
    if (!origin && !referer) {
      // 允许没有 Origin 的请求（Tauri 桌面应用）
      console.log('ℹ️ 允许无 Origin 的请求（可能是桌面应用）')
      return { success: true }
    }

    console.warn(`❌ 未授权的客户端来源 - Origin: ${origin}, Referer: ${referer}`)
    return {
      success: false,
      error: 'Unauthorized client origin',
      statusCode: 403
    }
  }

  /**
   * 验证 API 密钥
   */
  private static verifyApiKey(apiKey: string | null): SecurityCheckResult {
    if (!apiKey) {
      return {
        success: false,
        error: 'Missing API key',
        statusCode: 401
      }
    }

    // 支持两种API Key：通用的和专用记录的
    const generalApiKey = process.env.USER_BEHAVIOR_API_KEY
    const recordApiKey = process.env.USER_BEHAVIOR_RECORD_API_KEY

    // 如果两个API Key都没有配置，返回配置错误
    if (!generalApiKey && !recordApiKey) {
      console.error('Neither USER_BEHAVIOR_API_KEY nor USER_BEHAVIOR_RECORD_API_KEY is configured')
      return {
        success: false,
        error: 'Server configuration error',
        statusCode: 500
      }
    }

    // 检查是否匹配任一API Key
    if ((generalApiKey && apiKey === generalApiKey) || (recordApiKey && apiKey === recordApiKey)) {
      return { success: true }
    }

    return {
      success: false,
      error: 'Invalid API key',
      statusCode: 401
    }
  }

  /**
   * 验证 JWT 令牌
   */
  private static async verifyJWT(authHeader: string | null): Promise<SecurityCheckResult> {
    const token = JWTUtils.extractTokenFromHeader(authHeader)
    if (!token) {
      return {
        success: false,
        error: 'Missing JWT token',
        statusCode: 401
      }
    }

    const verifyResult = await JWTUtils.verifyToken(token)
    if (!verifyResult.valid) {
      return {
        success: false,
        error: verifyResult.error || 'Invalid JWT token',
        statusCode: 401
      }
    }

    return { success: true }
  }

  /**
   * 验证请求签名
   */
  private static async verifyRequestSignature(
    request: NextRequest,
    body?: string
  ): Promise<SecurityCheckResult> {
    if (!process.env.ENABLE_REQUEST_SIGNATURE || 
        process.env.ENABLE_REQUEST_SIGNATURE !== 'true') {
      return { success: true }
    }

    const { signature, timestamp, nonce } = RequestSignature.extractSignatureInfo(request.headers)

    if (!signature || !timestamp || !nonce) {
      return {
        success: false,
        error: 'Missing signature headers',
        statusCode: 400
      }
    }

    const url = new URL(request.url)
    const verifyResult = RequestSignature.verifySignature(
      request.method,
      url.pathname + url.search,
      body || '',
      timestamp,
      nonce,
      signature
    )

    if (!verifyResult.valid) {
      return {
        success: false,
        error: verifyResult.error || 'Invalid request signature',
        statusCode: 401
      }
    }

    return { success: true }
  }

  /**
   * 执行完整的安全检查
   */
  static async performSecurityCheck(
    request: NextRequest,
    body?: string
  ): Promise<SecurityCheckResult> {
    // 如果安全验证未启用，直接通过
    if (!this.isSecurityEnabled()) {
      return { success: true }
    }

    try {
      // 1. 验证 User-Agent
      const userAgentCheck = this.verifyUserAgent(request.headers.get('User-Agent'))
      if (!userAgentCheck.success) {
        return userAgentCheck
      }

      // 2. 验证客户端来源
      const originCheck = this.verifyClientOrigin(
        request.headers.get('Origin'),
        request.headers.get('Referer')
      )
      if (!originCheck.success) {
        return originCheck
      }

      // 3. 验证 API 密钥
      const apiKeyCheck = this.verifyApiKey(request.headers.get('X-API-Key'))
      if (!apiKeyCheck.success) {
        return apiKeyCheck
      }

      // 4. 验证 JWT 令牌
      const jwtCheck = await this.verifyJWT(request.headers.get('Authorization'))
      if (!jwtCheck.success) {
        return jwtCheck
      }

      // 5. 验证请求签名（可选）
      const signatureCheck = await this.verifyRequestSignature(request, body)
      if (!signatureCheck.success) {
        return signatureCheck
      }

      return { success: true }
    } catch (error) {
      console.error('Security check error:', error)
      return {
        success: false,
        error: 'Security verification failed',
        statusCode: 500
      }
    }
  }

  /**
   * 执行基础安全检查（跳过API Key和JWT验证，用于POST记录端点）
   */
  static async performBasicSecurityCheck(
    request: NextRequest,
    body?: string
  ): Promise<SecurityCheckResult> {
    // 如果安全验证未启用，直接通过
    if (!this.isSecurityEnabled()) {
      return { success: true }
    }

    try {
      // 1. 验证 User-Agent
      const userAgentCheck = this.verifyUserAgent(request.headers.get('User-Agent'))
      if (!userAgentCheck.success) {
        return userAgentCheck
      }

      // 2. 验证客户端来源
      const originCheck = this.verifyClientOrigin(
        request.headers.get('Origin'),
        request.headers.get('Referer')
      )
      if (!originCheck.success) {
        return originCheck
      }

      // 跳过API Key和JWT验证，只进行基础检查

      // 3. 验证请求签名（可选）
      const signatureCheck = await this.verifyRequestSignature(request, body)
      if (!signatureCheck.success) {
        return signatureCheck
      }

      return { success: true }
    } catch (error) {
      console.error('Basic security check error:', error)
      return {
        success: false,
        error: 'Security verification failed',
        statusCode: 500
      }
    }
  }

  /**
   * 创建安全错误响应
   */
  static createSecurityErrorResponse(result: SecurityCheckResult): NextResponse {
    return NextResponse.json(
      {
        success: false,
        error: result.error || 'Security verification failed',
        code: 'SECURITY_ERROR'
      },
      { status: result.statusCode || 403 }
    )
  }
}

export default UserBehaviorSecurity

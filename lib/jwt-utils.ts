/**
 * JWT 工具类
 * 用于生成和验证用户行为统计 API 的 JWT 令牌
 */

import { SignJWT, jwtVerify } from 'jose'

// JWT 载荷接口
export interface JWTPayload {
  appId: string
  appSecret: string
  userDeviceFingerprint?: string
  iat: number
  exp: number
}

// JWT 验证结果接口
export interface JWTVerifyResult {
  valid: boolean
  payload?: JWTPayload
  error?: string
}

/**
 * JWT 工具类
 */
export class JWTUtils {
  private static secret: Uint8Array | null = null

  /**
   * 获取 JWT 密钥
   */
  private static getSecret(): Uint8Array {
    if (!this.secret) {
      const secretString = process.env.JWT_SECRET
      if (!secretString) {
        throw new Error('JWT_SECRET environment variable is not set')
      }
      this.secret = new TextEncoder().encode(secretString)
    }
    return this.secret
  }

  /**
   * 生成 JWT 令牌
   */
  static async generateToken(
    appId: string,
    appSecret: string,
    userDeviceFingerprint?: string,
    expirationHours: number = 24
  ): Promise<string> {
    try {
      const now = Math.floor(Date.now() / 1000)
      const exp = now + (expirationHours * 60 * 60)

      const payload: JWTPayload = {
        appId,
        appSecret,
        userDeviceFingerprint,
        iat: now,
        exp
      }

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt(now)
        .setExpirationTime(exp)
        .sign(this.getSecret())

      return jwt
    } catch (error) {
      console.error('Error generating JWT token:', error)
      throw new Error('Failed to generate JWT token')
    }
  }

  /**
   * 验证 JWT 令牌
   */
  static async verifyToken(token: string): Promise<JWTVerifyResult> {
    try {
      const { payload } = await jwtVerify(token, this.getSecret())
      
      // 验证必要字段
      if (!payload.appId || !payload.appSecret) {
        return {
          valid: false,
          error: 'Invalid token payload: missing required fields'
        }
      }

      // 验证应用标识符
      const expectedAppId = process.env.WANJIGUANJIA_APP_ID
      const expectedAppSecret = process.env.WANJIGUANJIA_APP_SECRET
      
      if (payload.appId !== expectedAppId || payload.appSecret !== expectedAppSecret) {
        return {
          valid: false,
          error: 'Invalid application credentials'
        }
      }

      return {
        valid: true,
        payload: payload as JWTPayload
      }
    } catch (error) {
      console.error('JWT verification error:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      }
    }
  }

  /**
   * 从请求头中提取 JWT 令牌
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null
    }

    // 支持 "Bearer <token>" 格式
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
    if (bearerMatch) {
      return bearerMatch[1]
    }

    // 直接返回令牌（如果不是 Bearer 格式）
    return authHeader
  }

  /**
   * 生成用于玩机管家应用的默认令牌
   */
  static async generateAppToken(userDeviceFingerprint?: string): Promise<string> {
    const appId = process.env.WANJIGUANJIA_APP_ID
    const appSecret = process.env.WANJIGUANJIA_APP_SECRET
    const expirationHours = parseInt(process.env.JWT_EXPIRATION_HOURS || '24')

    if (!appId || !appSecret) {
      throw new Error('Application credentials not configured')
    }

    return this.generateToken(appId, appSecret, userDeviceFingerprint, expirationHours)
  }
}

export default JWTUtils

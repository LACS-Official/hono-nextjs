// 认证工具库
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

// JWT 配置
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

// 用户信息接口
export interface User {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

// JWT 载荷接口
export interface JWTPayload {
  user: User
  iat?: number
  exp?: number
}

// 认证结果接口
export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// 生成 JWT Token
export function generateToken(user: User): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

// 验证 JWT Token
export function verifyToken(token: string): JWTPayload | null {
  if (!token || typeof token !== 'string') {
    console.warn('JWT verification: Invalid token format')
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload

    // 验证载荷结构
    if (!decoded.user || !decoded.user.id || !decoded.user.login) {
      console.warn('JWT verification: Invalid payload structure')
      return null
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn('JWT verification: Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.warn('JWT verification: Invalid token')
    } else {
      console.error('JWT verification failed:', error)
    }
    return null
  }
}

// 从请求中提取 Token
export function extractTokenFromRequest(request: NextRequest): string | null {
  // 从 Authorization header 中提取
  const authHeader = request.headers.get('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从 Cookie 中提取
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

// 验证请求中的认证信息
export function authenticateRequest(request: NextRequest): AuthResult {
  const token = extractTokenFromRequest(request)
  
  if (!token) {
    return {
      success: false,
      error: 'No authentication token provided'
    }
  }

  const payload = verifyToken(token)
  
  if (!payload || !payload.user) {
    return {
      success: false,
      error: 'Invalid or expired token'
    }
  }

  return {
    success: true,
    user: payload.user
  }
}

// 检查用户是否有管理员权限
export function isAuthorizedAdmin(user: User): boolean {
  if (!user || !user.login) {
    console.warn('Admin check: Invalid user object')
    return false
  }

  const allowedUsername = process.env.ALLOWED_GITHUB_USERNAME || 'LACS-Official'
  const allowedEmail = process.env.ALLOWED_GITHUB_EMAIL || '2935278133@qq.com'

  // 支持多个管理员用户名（逗号分隔）
  const allowedUsernames = allowedUsername.split(',').map(name => name.trim())
  const allowedEmails = allowedEmail.split(',').map(email => email.trim())

  const isUsernameAllowed = allowedUsernames.includes(user.login)
  const isEmailAllowed = user.email ? allowedEmails.includes(user.email) : false

  return isUsernameAllowed || isEmailAllowed
}

// 创建认证响应头
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    'Set-Cookie': `auth-token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`,
    'Authorization': `Bearer ${token}`
  }
}

// 创建登出响应头
export function createLogoutHeaders(): Record<string, string> {
  return {
    'Set-Cookie': 'auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
  }
}

// 认证中间件函数
export function requireAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = authenticateRequest(request)
    
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: authResult.error || 'Authentication required'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (!isAuthorizedAdmin(authResult.user)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Insufficient permissions'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    return handler(request, authResult.user)
  }
}

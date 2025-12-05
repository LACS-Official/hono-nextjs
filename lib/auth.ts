// 认证工具库
import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// 用户信息接口
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  role?: string // 用户角色
}

// 认证结果接口
export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// 从请求中获取用户信息
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        success: false,
        error: error?.message || 'No authentication session found'
      }
    }

    // 转换为通用用户接口
    const userData: User = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      avatar_url: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role
    }

    return {
      success: true,
      user: userData
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

// 检查用户是否有管理员权限
export function isAuthorizedAdmin(user: User): boolean {
  if (!user || !user.email) {
    console.warn('Admin check: Invalid user object')
    return false
  }

  const allowedEmails = process.env.ALLOWED_ADMIN_EMAILS?.split(',') || ['2935278133@qq.com']
  const allowedEmailsTrimmed = allowedEmails.map(email => email.trim())

  return allowedEmailsTrimmed.includes(user.email)
}

// 验证网站用户权限
export function isAuthorizedWebsiteUser(user: User, websiteId?: number): boolean {
  if (!user || !user.id) {
    console.warn('Website user check: Invalid user object')
    return false
  }

  // 这里可以添加更复杂的权限检查逻辑
  // 例如检查用户是否属于特定网站或具有特定角色
  return true
}

// 检查网站用户是否有管理权限
export function isWebsiteAdmin(user: User): boolean {
  if (!user || !user.role) {
    return false
  }

  return user.role === 'admin' || user.role === 'moderator'
}

// 认证中间件函数
export function requireAuth(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await authenticateRequest(request)

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

// 仅需登录的认证中间件
export function requireLoggedInUser(handler: (request: NextRequest, user: User) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const authResult = await authenticateRequest(request)

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

    return handler(request, authResult.user)
  }
}

// 网站用户认证中间件
export function requireWebsiteAuth(websiteId?: number) {
  return (handler: (request: NextRequest, user: User) => Promise<Response>) => {
    return async (request: NextRequest): Promise<Response> => {
      const authResult = await authenticateRequest(request)

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

      if (!isAuthorizedWebsiteUser(authResult.user, websiteId)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Insufficient permissions for this website'
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
}

// 创建登出响应头
export function createLogoutHeaders(): Headers {
  const headers = new Headers();
  // 这里添加登出相关的响应头
  return headers;
}
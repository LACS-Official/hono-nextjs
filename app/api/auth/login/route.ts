/**
 * 用户登录API
 * POST /api/auth/login - 用户登录（支持GitHub OAuth和网站用户登录）
 */

import { NextRequest, NextResponse } from 'next/server'
import { unifiedDb as db, websites, websiteUsers } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { generateToken } from '@/lib/auth'
import { z } from 'zod'
import CryptoJS from 'crypto-js'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 登录验证模式
const loginSchema = z.object({
  type: z.enum(['github', 'website']).default('github'),
  // GitHub OAuth 登录
  code: z.string().optional(),
  // 网站用户登录
  websiteId: z.number().optional(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    if (validatedData.type === 'github') {
      // GitHub OAuth 登录
      return await handleGitHubLogin(validatedData, origin, userAgent)
    } else {
      // 网站用户登录
      return await handleWebsiteLogin(validatedData, request, origin, userAgent)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.errors
      }, { status: 400 }, origin, userAgent)
    }

    console.error('登录失败:', error)
    return corsResponse({
      success: false,
      error: '登录失败，请稍后重试'
    }, { status: 500 }, origin, userAgent)
  }
}

// 处理GitHub OAuth登录
async function handleGitHubLogin(data: any, origin: string | null, userAgent: string | null) {
  if (!data.code) {
    return corsResponse({
      success: false,
      error: '缺少授权码'
    }, { status: 400 }, origin, userAgent)
  }
  
  // 获取访问令牌
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: data.code,
    }),
  })
  
  const tokenData = await tokenResponse.json()
  
  if (tokenData.error) {
    return corsResponse({
      success: false,
      error: '获取访问令牌失败'
    }, { status: 400 }, origin, userAgent)
  }
  
  // 获取用户信息
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  })
  
  const userData = await userResponse.json()
  
  if (!userResponse.ok) {
    return corsResponse({
      success: false,
      error: '获取用户信息失败'
    }, { status: 400 }, origin, userAgent)
  }
  
  // 生成 JWT
  const token = generateToken(userData)
  
  return corsResponse({
    success: true,
    token: token,
    user: userData,
    type: 'github'
  }, undefined, origin, userAgent)
}

// 处理网站用户登录
async function handleWebsiteLogin(data: any, request: NextRequest, origin: string | null, userAgent: string | null) {
  if (!data.websiteId || (!data.username && !data.email) || !data.password) {
    return corsResponse({
      success: false,
      error: '请提供完整的登录信息'
    }, { status: 400 }, origin, userAgent)
  }

  // 验证网站是否存在且启用
  const [website] = await db
    .select()
    .from(websites)
    .where(and(
      eq(websites.id, data.websiteId),
      eq(websites.isActive, true)
    ))
    .limit(1)

  if (!website) {
    return corsResponse({
      success: false,
      error: '网站不存在或已禁用'
    }, { status: 400 }, origin, userAgent)
  }

  // 查找用户（支持用户名或邮箱登录）
  let userConditions = [eq(websiteUsers.websiteId, data.websiteId)]
  
  if (data.username) {
    userConditions.push(eq(websiteUsers.username, data.username))
  } else if (data.email) {
    userConditions.push(eq(websiteUsers.email, data.email))
  }

  const [user] = await db
    .select()
    .from(websiteUsers)
    .where(and(...userConditions))
    .limit(1)

  if (!user) {
    return corsResponse({
      success: false,
      error: '用户不存在'
    }, { status: 400 }, origin, userAgent)
  }

  // 验证用户状态
  if (user.status !== 'active') {
    return corsResponse({
      success: false,
      error: '账户已被禁用或冻结'
    }, { status: 400 }, origin, userAgent)
  }

  // 验证密码
  const passwordSalt = process.env.PASSWORD_SALT || 'default-salt'
  const passwordHash = CryptoJS.SHA256(data.password + passwordSalt).toString()

  if (user.passwordHash !== passwordHash) {
    return corsResponse({
      success: false,
      error: '密码错误'
    }, { status: 400 }, origin, userAgent)
  }

  // 更新登录信息
  const clientIp = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown'

  await db
    .update(websiteUsers)
    .set({
      loginCount: user.loginCount + 1,
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
      updatedAt: new Date()
    })
    .where(eq(websiteUsers.id, user.id))

  // 生成JWT令牌
  const userForToken = {
    id: user.id,
    login: user.username,
    name: user.displayName || user.username,
    email: user.email,
    avatar_url: user.avatar || '',
    html_url: `${website.domain}/user/${user.username}`,
    websiteId: data.websiteId,
    role: user.role
  }

  const token = generateToken(userForToken)

  // 设置认证Cookie
  const cookieOptions = [
    `auth-token=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${7 * 24 * 60 * 60}`, // 7天
    'Path=/'
  ].join('; ')

  return corsResponse({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        status: user.status,
        emailVerified: user.emailVerified,
        role: user.role,
        loginCount: user.loginCount + 1,
        lastLoginAt: new Date()
      },
      token: token,
      website: {
        id: website.id,
        name: website.name,
        domain: website.domain
      }
    },
    type: 'website',
    message: '登录成功'
  }, {
    headers: {
      'Set-Cookie': cookieOptions
    }
  }, origin, userAgent)
}

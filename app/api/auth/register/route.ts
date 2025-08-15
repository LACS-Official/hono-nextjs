/**
 * 用户注册API
 * POST /api/auth/register - 用户注册
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, websiteUsers } from '@/lib/unified-db-connection'
import { eq, and } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { z } from 'zod'
import CryptoJS from 'crypto-js'
import { generateToken } from '@/lib/auth'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 用户注册验证模式
const registerSchema = z.object({
  websiteId: z.number().min(1, '网站ID不能为空'),
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(128, '密码最多128个字符'),
  displayName: z.string().max(100, '显示名称最多100个字符').optional(),
  inviteCode: z.string().optional(), // 邀请码（可选）
})

// POST - 用户注册
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // 验证网站是否存在且启用
    const [website] = await db
      .select()
      .from(websites)
      .where(and(
        eq(websites.id, validatedData.websiteId),
        eq(websites.isActive, true)
      ))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在或已禁用'
      }, { status: 400 }, origin, userAgent)
    }

    // 检查用户名是否已存在
    const [existingUsername] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, validatedData.websiteId),
        eq(websiteUsers.username, validatedData.username)
      ))
      .limit(1)

    if (existingUsername) {
      return corsResponse({
        success: false,
        error: '用户名已存在'
      }, { status: 400 }, origin, userAgent)
    }

    // 检查邮箱是否已存在
    const [existingEmail] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, validatedData.websiteId),
        eq(websiteUsers.email, validatedData.email)
      ))
      .limit(1)

    if (existingEmail) {
      return corsResponse({
        success: false,
        error: '邮箱已被注册'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证邀请码（如果提供）
    if (validatedData.inviteCode) {
      const expectedInviteCode = process.env.WEBSITE_INVITE_CODE
      if (expectedInviteCode && validatedData.inviteCode !== expectedInviteCode) {
        return corsResponse({
          success: false,
          error: '邀请码无效'
        }, { status: 400 }, origin, userAgent)
      }
    }

    // 加密密码
    const passwordSalt = process.env.PASSWORD_SALT || 'default-salt'
    const passwordHash = CryptoJS.SHA256(validatedData.password + passwordSalt).toString()

    // 获取客户端IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    // 创建新用户
    const [newUser] = await db
      .insert(websiteUsers)
      .values({
        websiteId: validatedData.websiteId,
        username: validatedData.username,
        email: validatedData.email,
        passwordHash: passwordHash,
        displayName: validatedData.displayName || validatedData.username,
        status: 'active',
        emailVerified: false, // 默认未验证邮箱
        role: 'user',
        permissions: [],
        loginCount: 1,
        lastLoginAt: new Date(),
        lastLoginIp: clientIp,
      })
      .returning({
        id: websiteUsers.id,
        username: websiteUsers.username,
        email: websiteUsers.email,
        displayName: websiteUsers.displayName,
        avatar: websiteUsers.avatar,
        status: websiteUsers.status,
        emailVerified: websiteUsers.emailVerified,
        role: websiteUsers.role,
        createdAt: websiteUsers.createdAt,
      })

    // 生成JWT令牌
    const userForToken = {
      id: newUser.id,
      login: newUser.username,
      name: newUser.displayName || newUser.username,
      email: newUser.email,
      avatar_url: newUser.avatar || '',
      html_url: `${website.domain}/user/${newUser.username}`,
      websiteId: validatedData.websiteId,
      role: newUser.role
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
        user: newUser,
        token: token,
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        }
      },
      message: '注册成功'
    }, {
      headers: {
        'Set-Cookie': cookieOptions
      }
    }, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 }, origin, userAgent)
    }

    console.error('用户注册失败:', error)
    return corsResponse({
      success: false,
      error: '注册失败，请稍后重试'
    }, { status: 500 }, origin, userAgent)
  }
}

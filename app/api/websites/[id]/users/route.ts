/**
 * 软件资源网站用户管理API
 * GET /api/websites/[id]/users - 获取用户列表
 * POST /api/websites/[id]/users - 创建新用户
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, websites, websiteUsers } from '@/lib/unified-db-connection'
import { eq, desc, like, or, and, count } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'
import CryptoJS from 'crypto-js'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 用户创建验证模式
const createUserSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(50, '用户名最多50个字符'),
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6个字符'),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  role: z.enum(['user', 'moderator', 'admin']).default('user'),
  status: z.enum(['active', 'inactive', 'banned']).default('active'),
  emailVerified: z.boolean().default(false),
})

// GET - 获取用户列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证管理员权限
    const authResult = await validateUnifiedAuth(request)
    if (!authResult.success) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    const { id } = params
    const websiteId = parseInt(id)

    if (isNaN(websiteId)) {
      return corsResponse({
        success: false,
        error: '无效的网站ID'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') // active, inactive, banned, all
    const role = url.searchParams.get('role') // user, moderator, admin, all
    const verified = url.searchParams.get('verified') // true, false, all

    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions: any[] = [eq(websiteUsers.websiteId, websiteId)]

    if (search) {
      whereConditions.push(
        or(
          like(websiteUsers.username, `%${search}%`),
          like(websiteUsers.email, `%${search}%`),
          like(websiteUsers.displayName, `%${search}%`)
        )
      )
    }

    if (status && status !== 'all') {
      whereConditions.push(eq(websiteUsers.status, status))
    }

    if (role && role !== 'all') {
      whereConditions.push(eq(websiteUsers.role, role))
    }

    if (verified === 'true') {
      whereConditions.push(eq(websiteUsers.emailVerified, true))
    } else if (verified === 'false') {
      whereConditions.push(eq(websiteUsers.emailVerified, false))
    }

    // 获取用户列表（不包含密码）
    const userList = await db
      .select({
        id: websiteUsers.id,
        username: websiteUsers.username,
        email: websiteUsers.email,
        displayName: websiteUsers.displayName,
        avatar: websiteUsers.avatar,
        bio: websiteUsers.bio,
        status: websiteUsers.status,
        emailVerified: websiteUsers.emailVerified,
        role: websiteUsers.role,
        permissions: websiteUsers.permissions,
        loginCount: websiteUsers.loginCount,
        lastLoginAt: websiteUsers.lastLoginAt,
        lastLoginIp: websiteUsers.lastLoginIp,
        createdAt: websiteUsers.createdAt,
        updatedAt: websiteUsers.updatedAt,
      })
      .from(websiteUsers)
      .where(and(...whereConditions))
      .orderBy(desc(websiteUsers.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const [totalResult] = await db
      .select({ count: count() })
      .from(websiteUsers)
      .where(and(...whereConditions))

    const total = totalResult.count

    return corsResponse({
      success: true,
      data: {
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain
        },
        users: userList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取用户列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST - 创建新用户
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 验证管理员权限
    const authResult = await validateUnifiedAuth(request)
    if (!authResult.success) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    const { id } = params
    const websiteId = parseInt(id)

    if (isNaN(websiteId)) {
      return corsResponse({
        success: false,
        error: '无效的网站ID'
      }, { status: 400 }, origin, userAgent)
    }

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(eq(websites.id, websiteId))
      .limit(1)

    if (!website) {
      return corsResponse({
        success: false,
        error: '网站不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // 检查用户名是否已存在
    const [existingUsername] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
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
        eq(websiteUsers.websiteId, websiteId),
        eq(websiteUsers.email, validatedData.email)
      ))
      .limit(1)

    if (existingEmail) {
      return corsResponse({
        success: false,
        error: '邮箱已存在'
      }, { status: 400 }, origin, userAgent)
    }

    // 加密密码
    const passwordHash = CryptoJS.SHA256(validatedData.password + process.env.PASSWORD_SALT || 'default-salt').toString()

    // 创建新用户
    const [newUser] = await db
      .insert(websiteUsers)
      .values({
        websiteId: websiteId,
        username: validatedData.username,
        email: validatedData.email,
        passwordHash: passwordHash,
        displayName: validatedData.displayName,
        bio: validatedData.bio,
        status: validatedData.status,
        emailVerified: validatedData.emailVerified,
        role: validatedData.role,
        permissions: [],
      })
      .returning({
        id: websiteUsers.id,
        username: websiteUsers.username,
        email: websiteUsers.email,
        displayName: websiteUsers.displayName,
        status: websiteUsers.status,
        emailVerified: websiteUsers.emailVerified,
        role: websiteUsers.role,
        createdAt: websiteUsers.createdAt,
      })

    return corsResponse({
      success: true,
      data: newUser,
      message: '用户创建成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '数据验证失败',
        details: error.errors
      }, { status: 400 }, origin, userAgent)
    }

    console.error('创建用户失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

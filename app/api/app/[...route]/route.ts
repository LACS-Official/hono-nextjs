import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
// import { HTTPException } from 'hono/http-exception' // 暂时不使用

// 软件管理路由已移至独立的 API 路由
// 导入中间件
import {
  rateLimit,
  requestLogger,
  securityHeaders,
  sanitizeInput,
  formatErrorResponse,
  healthCheck
} from './middleware'

// 创建 Hono 应用实例
const app = new Hono<{ Variables: { userId: string; email: string } }>().basePath('/api/app')

// 全局中间件（CORS 由 Next.js 根级 middleware 统一处理）

// 安全和日志中间件
app.use('*', securityHeaders())
app.use('*', requestLogger())
app.use('*', sanitizeInput())
app.use('*', rateLimit(100, 60000)) // 每分钟最多100个请求
app.use('*', logger())
app.use('*', prettyJSON())

// 健康检查中间件
app.use('*', healthCheck())

// 全局错误处理中间件
app.onError((err, c) => {
  return formatErrorResponse(err, c)
})

// 404 处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
    code: 404,
    message: 'The requested endpoint does not exist'
  }, 404)
})

import { unifiedDb, appUsers, activationCodes } from '@/lib/unified-db-connection'
import { hashPassword, verifyPassword, generateUserToken, verifyUserToken } from '@/lib/app-user-auth'
import { eq } from 'drizzle-orm'
import { sendVerificationCode } from '@/lib/email-service'

// 验证码缓存，Key 为 email，Value 为 { code: string; expiresAt: Date; sentAt: number }
const verificationCodes = new Map<string, { code: string; expiresAt: Date; sentAt: number }>()


// Hono JWT 认证中间件
const appUserAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: '未提供 Authorization 头部'
    }, 401)
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const result = await verifyUserToken(token)

  if (!result.valid || !result.userId) {
    return c.json({
      success: false,
      error: 'Unauthorized',
      message: '登录令牌无效或已过期'
    }, 401)
  }

  c.set('userId', result.userId)
  c.set('email', result.email)
  await next()
}

// 健康检查端点
app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// 发送验证码
app.post('/auth/send-code', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = body
    
    if (!email) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '邮箱不能为空'
      }, 400)
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '邮箱格式不正确'
      }, 400)
    }

    // 限制每个邮箱每 60 秒只能发送一次验证码（发信规则参考 appweb 类似 Supabase Auth 的限频机制）
    const cached = verificationCodes.get(email)
    if (cached) {
      const timeSinceLastSent = Date.now() - cached.sentAt
      if (timeSinceLastSent < 60000) {
        const secondsLeft = Math.ceil((60000 - timeSinceLastSent) / 1000)
        return c.json({
          success: false,
          error: 'Too Many Requests',
          message: `请求过于频繁，请在 ${secondsLeft} 秒后重试`
        }, 429)
      }
    }

    // 生成 6 位随机数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10分钟后过期
    
    verificationCodes.set(email, { code, expiresAt, sentAt: Date.now() })
    
    const sent = await sendVerificationCode(email, code)
    if (sent) {
      return c.json({
        success: true,
        message: '验证码已发送至您的邮箱，请注意查收'
      })
    } else {
      // 发送失败时，清除该邮箱的缓存记录，允许立即重试
      verificationCodes.delete(email)
      return c.json({
        success: false,
        error: 'Send Failed',
        message: '邮件发送失败，但已在服务端后台日志打印验证码'
      })
    }
  } catch (error) {
    console.error('Send verification code error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '发送验证码失败'
    }, 500)
  }
})

// 1. 用户注册
app.post('/auth/register', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, nickname, code } = body

    if (!email || !password || !code) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '邮箱、密码和验证码不能为空'
      }, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '邮箱格式不正确'
      }, 400)
    }

    // 密码强度要求限制：8-16位（参考 appweb 的注册表单校验规则）
    if (password.length < 8 || password.length > 16) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '密码长度需在 8-16 位之间'
      }, 400)
    }

    // 校验邮箱验证码
    const cached = verificationCodes.get(email)
    if (!cached) {
      return c.json({
        success: false,
        error: 'Verification Code Required',
        message: '请先获取邮箱验证码'
      }, 400)
    }

    if (cached.code !== code) {
      return c.json({
        success: false,
        error: 'Invalid Code',
        message: '验证码错误'
      }, 400)
    }

    if (new Date() > cached.expiresAt) {
      return c.json({
        success: false,
        error: 'Expired Code',
        message: '验证码已过期，请重新获取'
      }, 400)
    }

    // 校验通过，作废当前验证码
    verificationCodes.delete(email)

    const existing = await unifiedDb
      .select()
      .from(appUsers)
      .where(eq(appUsers.email, email))
      .limit(1)

    if (existing.length > 0) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: '该邮箱已被注册，请直接登录或使用其他邮箱'
      }, 409)
    }

    const passwordHash = hashPassword(password)
    const [newUser] = await unifiedDb
      .insert(appUsers)
      .values({
        email,
        passwordHash,
        nickname: nickname || email.split('@')[0],
        avatarUrl: '', // 彻底废弃头像字段，强行置空
      })
      .returning()

    if (!newUser) {
      throw new Error('Failed to create user')
    }

    return c.json({
      success: true,
      message: '注册成功',
      data: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        avatarUrl: newUser.avatarUrl,
        vipExpireAt: newUser.vipExpireAt ? newUser.vipExpireAt.toISOString() : null,
        createdAt: newUser.createdAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '注册失败，请稍后重试'
    }, 500)
  }
})

// 2. 用户登录
app.post('/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password } = body

    if (!email || !password) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '邮箱和密码不能为空'
      }, 400)
    }

    const [user] = await unifiedDb
      .select()
      .from(appUsers)
      .where(eq(appUsers.email, email))
      .limit(1)

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        message: '邮箱或密码不正确'
      }, 401)
    }

    const token = await generateUserToken(user.id, user.email)
    const now = new Date()
    const isVip = user.vipExpireAt !== null && new Date(user.vipExpireAt) > now

    return c.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          vipExpireAt: user.vipExpireAt ? user.vipExpireAt.toISOString() : null,
          isVip,
          createdAt: user.createdAt.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '登录失败，请稍后重试'
    }, 500)
  }
})

// 3. 获取个人资料与 VIP 状态
app.get('/user/profile', appUserAuth, async (c) => {
  try {
    const userId = c.get('userId')

    const [user] = await unifiedDb
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1)

    if (!user) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '用户不存在'
      }, 404)
    }

    const now = new Date()
    const isVip = user.vipExpireAt !== null && new Date(user.vipExpireAt) > now
    const remainingTime = user.vipExpireAt
      ? Math.max(0, Math.floor((new Date(user.vipExpireAt).getTime() - now.getTime()) / 1000))
      : 0

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        vipExpireAt: user.vipExpireAt ? user.vipExpireAt.toISOString() : null,
        isVip,
        remainingTime
      }
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '获取资料失败'
    }, 500)
  }
})

// 4. 修改资料
app.put('/user/profile', appUserAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { nickname } = body

    const [user] = await unifiedDb
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1)

    if (!user) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '用户不存在'
      }, 404)
    }

    const updateFields: any = {
      updatedAt: new Date()
    }
    if (nickname !== undefined) updateFields.nickname = nickname

    const [updatedUser] = await unifiedDb
      .update(appUsers)
      .set(updateFields)
      .where(eq(appUsers.id, userId))
      .returning()

    const now = new Date()
    const isVip = updatedUser.vipExpireAt !== null && new Date(updatedUser.vipExpireAt) > now

    return c.json({
      success: true,
      message: '资料修改成功',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        nickname: updatedUser.nickname,
        avatarUrl: updatedUser.avatarUrl,
        vipExpireAt: updatedUser.vipExpireAt ? updatedUser.vipExpireAt.toISOString() : null,
        isVip
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '修改资料失败'
    }, 500)
  }
})

// 5. 卡密激活 VIP
app.post('/user/activate', appUserAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()
    const { code } = body

    if (!code) {
      return c.json({
        success: false,
        error: 'Bad Request',
        message: '激活码不能为空'
      }, 400)
    }

    const [activationCode] = await unifiedDb
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.code, code))
      .limit(1)

    if (!activationCode) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '激活码不存在'
      }, 404)
    }

    if (activationCode.isUsed) {
      return c.json({
        success: false,
        error: 'Conflict',
        message: '激活码已被使用'
      }, 409)
    }

    const now = new Date()
    if (now > activationCode.expiresAt) {
      return c.json({
        success: false,
        error: 'Gone',
        message: '激活码已过期，无法使用'
      }, 410)
    }

    const [user] = await unifiedDb
      .select()
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1)

    if (!user) {
      return c.json({
        success: false,
        error: 'Not Found',
        message: '用户不存在'
      }, 404)
    }

    const codeDurationMs = activationCode.expiresAt.getTime() - activationCode.createdAt.getTime()
    const currentVipExpire = user.vipExpireAt ? new Date(user.vipExpireAt) : new Date(0)
    const baseTime = currentVipExpire > now ? currentVipExpire : now
    const newVipExpireAt = new Date(baseTime.getTime() + codeDurationMs)

    await unifiedDb.transaction(async (tx) => {
      await tx
        .update(activationCodes)
        .set({
          isUsed: true,
          usedAt: now,
          usedBy: userId,
          userId: userId
        })
        .where(eq(activationCodes.id, activationCode.id))

      await tx
        .update(appUsers)
        .set({
          vipExpireAt: newVipExpireAt,
          updatedAt: now
        })
        .where(eq(appUsers.id, userId))
    })

    return c.json({
      success: true,
      message: '激活码兑换成功',
      data: {
        vipExpireAt: newVipExpireAt.toISOString(),
        isVip: true,
        addedDays: Math.round(codeDurationMs / (24 * 60 * 60 * 1000))
      }
    })
  } catch (error) {
    console.error('Activate VIP error:', error)
    return c.json({
      success: false,
      error: 'Internal Server Error',
      message: '激活码兑换失败，请稍后重试'
    }, 500)
  }
})

// 软件管理路由已移至 /api/software

// 导出处理器
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

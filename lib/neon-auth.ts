/**
 * Neon数据库认证集成
 * 提供与Neon数据库的认证功能集成
 */

import { unifiedDb as db, websiteUsers, websites } from './unified-db-connection'
import { eq, and, sql } from 'drizzle-orm'
import { User } from './auth'
import CryptoJS from 'crypto-js'

// Neon认证配置
export interface NeonAuthConfig {
  passwordSalt: string
  jwtSecret: string
  jwtExpiresIn: string
  enableEmailVerification: boolean
  enableInviteCode: boolean
  defaultUserRole: 'user' | 'moderator' | 'admin'
}

// 获取Neon认证配置
export function getNeonAuthConfig(): NeonAuthConfig {
  return {
    passwordSalt: process.env.PASSWORD_SALT || 'neon-default-salt',
    jwtSecret: process.env.JWT_SECRET || 'neon-jwt-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
    enableInviteCode: process.env.ENABLE_INVITE_CODE === 'true',
    defaultUserRole: (process.env.DEFAULT_USER_ROLE as 'user' | 'moderator' | 'admin') || 'user'
  }
}

// 验证用户密码
export async function verifyUserPassword(
  websiteId: number,
  identifier: string, // 用户名或邮箱
  password: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const config = getNeonAuthConfig()

    // 查找用户
    const [user] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        eq(websiteUsers.username, identifier)
      ))
      .limit(1)

    if (!user) {
      // 尝试通过邮箱查找
      const [userByEmail] = await db
        .select()
        .from(websiteUsers)
        .where(and(
          eq(websiteUsers.websiteId, websiteId),
          eq(websiteUsers.email, identifier)
        ))
        .limit(1)

      if (!userByEmail) {
        return {
          success: false,
          error: '用户不存在'
        }
      }

      // 使用邮箱找到的用户
      const passwordHash = CryptoJS.SHA256(password + config.passwordSalt).toString()
      if (userByEmail.passwordHash !== passwordHash) {
        return {
          success: false,
          error: '密码错误'
        }
      }

      return {
        success: true,
        user: userByEmail
      }
    }

    // 验证密码
    const passwordHash = CryptoJS.SHA256(password + config.passwordSalt).toString()
    if (user.passwordHash !== passwordHash) {
      return {
        success: false,
        error: '密码错误'
      }
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return {
        success: false,
        error: '账户已被禁用'
      }
    }

    return {
      success: true,
      user: user
    }

  } catch (error) {
    console.error('验证用户密码失败:', error)
    return {
      success: false,
      error: '认证服务错误'
    }
  }
}

// 创建新用户
export async function createWebsiteUser(
  websiteId: number,
  userData: {
    username: string
    email: string
    password: string
    displayName?: string
    bio?: string
    role?: string
    inviteCode?: string
  }
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const config = getNeonAuthConfig()

    // 验证网站是否存在
    const [website] = await db
      .select()
      .from(websites)
      .where(and(
        eq(websites.id, websiteId),
        eq(websites.isActive, true)
      ))
      .limit(1)

    if (!website) {
      return {
        success: false,
        error: '网站不存在或已禁用'
      }
    }

    // 验证邀请码
    if (config.enableInviteCode && userData.inviteCode) {
      const expectedInviteCode = process.env.WEBSITE_INVITE_CODE
      if (expectedInviteCode && userData.inviteCode !== expectedInviteCode) {
        return {
          success: false,
          error: '邀请码无效'
        }
      }
    }

    // 检查用户名是否已存在
    const [existingUsername] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        eq(websiteUsers.username, userData.username)
      ))
      .limit(1)

    if (existingUsername) {
      return {
        success: false,
        error: '用户名已存在'
      }
    }

    // 检查邮箱是否已存在
    const [existingEmail] = await db
      .select()
      .from(websiteUsers)
      .where(and(
        eq(websiteUsers.websiteId, websiteId),
        eq(websiteUsers.email, userData.email)
      ))
      .limit(1)

    if (existingEmail) {
      return {
        success: false,
        error: '邮箱已被注册'
      }
    }

    // 加密密码
    const passwordHash = CryptoJS.SHA256(userData.password + config.passwordSalt).toString()

    // 创建用户
    const [newUser] = await db
      .insert(websiteUsers)
      .values({
        websiteId: websiteId,
        username: userData.username,
        email: userData.email,
        passwordHash: passwordHash,
        displayName: userData.displayName || userData.username,
        bio: userData.bio,
        status: 'active',
        emailVerified: !config.enableEmailVerification, // 如果不启用邮箱验证，默认为已验证
        role: userData.role || config.defaultUserRole,
        permissions: [],
        loginCount: 0,
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

    return {
      success: true,
      user: newUser
    }

  } catch (error) {
    console.error('创建用户失败:', error)
    return {
      success: false,
      error: '创建用户失败'
    }
  }
}

// 更新用户登录信息
export async function updateUserLoginInfo(
  userId: number,
  loginInfo: {
    ip?: string
    userAgent?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(websiteUsers)
      .set({
        loginCount: sql`${websiteUsers.loginCount} + 1`,
        lastLoginAt: new Date(),
        lastLoginIp: loginInfo.ip || 'unknown',
        updatedAt: new Date()
      })
      .where(eq(websiteUsers.id, userId))

    return { success: true }

  } catch (error) {
    console.error('更新用户登录信息失败:', error)
    return {
      success: false,
      error: '更新登录信息失败'
    }
  }
}

// 将网站用户转换为标准User接口
export function convertWebsiteUserToUser(websiteUser: any, website: any): User {
  return {
    id: websiteUser.id,
    login: websiteUser.username,
    name: websiteUser.displayName || websiteUser.username,
    email: websiteUser.email,
    avatar_url: websiteUser.avatar || '',
    html_url: `${website.domain}/user/${websiteUser.username}`,
    websiteId: websiteUser.websiteId,
    role: websiteUser.role
  }
}

// 验证邮箱
export async function verifyUserEmail(
  userId: number,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 这里可以实现邮箱验证逻辑
    // 目前简化处理，直接标记为已验证
    await db
      .update(websiteUsers)
      .set({
        emailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(websiteUsers.id, userId))

    return { success: true }

  } catch (error) {
    console.error('验证邮箱失败:', error)
    return {
      success: false,
      error: '邮箱验证失败'
    }
  }
}

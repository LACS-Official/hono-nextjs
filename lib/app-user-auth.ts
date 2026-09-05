import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'app-user-secret-default-key-change-me')

/**
 * 加盐哈希密码
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * 校验密码
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(':')
    if (!salt || !originalHash) return false
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return hash === originalHash
  } catch {
    return false
  }
}

/**
 * 生成 App 用户的登录 JWT Token
 */
export async function generateUserToken(userId: string, email: string): Promise<string> {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 天登录有效期
    .sign(JWT_SECRET)
}

/**
 * 验证 App 用户的登录 JWT Token
 */
export async function verifyUserToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { valid: true, userId: payload.userId as string, email: payload.email as string }
  } catch (error) {
    return { valid: false, error }
  }
}

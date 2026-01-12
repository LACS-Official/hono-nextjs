import { v4 as uuidv4 } from 'uuid'
import { UAParser } from 'ua-parser-js'
import { NextRequest } from 'next/server'
import { eq, and, desc, inArray, count, sql } from 'drizzle-orm'
import { systemSettingsDb, loginLogs } from './system-settings-db'

/**
 * 解析用户代理字符串，获取设备信息
 * @param userAgent 用户代理字符串
 * @returns 设备信息对象
 */
export const parseUserAgent = (userAgent: string) => {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  return {
    device: {
      model: result.device.model || 'Unknown',
      type: result.device.type || 'Unknown',
      vendor: result.device.vendor || 'Unknown'
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || 'Unknown'
    },
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || 'Unknown'
    },
    engine: {
      name: result.engine.name || 'Unknown',
      version: result.engine.version || 'Unknown'
    }
  }
}

/**
 * 从请求中获取客户端IP地址
 * @param request Next.js请求对象
 * @returns IP地址字符串
 */
export interface IpLocation {
  country: string
  region: string
  city: string
  district?: string
  isp?: string
  org?: string
  as?: string
  timezone?: string
}

export const getClientIp = (request: NextRequest): string => {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return request.ip || '127.0.0.1'
}

export const getIpLocation = async (ip: string): Promise<IpLocation> => {
  try {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return {
        country: '本地',
        region: '本地',
        city: '本地',
        isp: '本地网络'
      }
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,as,timezone`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error('IP定位请求失败')
    }

    const data = await response.json()

    if (data.status === 'success') {
      return {
        country: data.country || '未知',
        region: data.regionName || '未知',
        city: data.city || '未知',
        isp: data.isp || '未知',
        org: data.org || '',
        as: data.as || '',
        timezone: data.timezone || ''
      }
    }

    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知'
    }
  } catch (error) {
    console.error('获取IP物理地址失败:', error)
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知'
    }
  }
}

/**
 * 获取网络信息
 * @param request Next.js请求对象
 * @returns 网络信息对象
 */
export const getNetworkInfo = (request: NextRequest) => {
  // 从请求头中获取网络信息
  const acceptLanguage = request.headers.get('accept-language') || 'Unknown'
  const referer = request.headers.get('referer') || 'Direct'

  return {
    language: acceptLanguage,
    referer,
    // 目前无法直接从请求中获取网络类型和运营商信息，这些需要客户端提供
    networkType: 'Unknown',
    carrier: 'Unknown'
  }
}

/**
 * 脱敏处理敏感信息
 * @param ipAddress IP地址
 * @returns 脱敏后的IP地址
 */
export const maskIpAddress = (ipAddress: string): string => {
  // 脱敏处理IP地址，保留前两段
  const parts = ipAddress.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`
  }
  return ipAddress
}

/**
 * 记录登录日志
 * @param userId 用户ID
 * @param email 用户邮箱
 * @param request Next.js请求对象
 * @param sessionId 会话ID
 */
export const recordLoginLog = async (
  userId: string,
  email: string,
  request: NextRequest,
  sessionId: string
) => {
  try {
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ipAddress = getClientIp(request)
    const deviceInfo = parseUserAgent(userAgent)
    const networkInfo = getNetworkInfo(request)

    // 创建登录日志记录
    await systemSettingsDb.insert(loginLogs).values({
      id: uuidv4(),
      userId,
      email,
      ipAddress,
      userAgent,
      deviceInfo,
      networkInfo,
      loginTime: new Date(),
      sessionId,
      isActive: true
    })

    console.log(`登录日志已记录: 用户 ${email}, IP ${maskIpAddress(ipAddress)}`)
  } catch (error) {
    console.error('记录登录日志失败:', error)
  }
}

/**
 * 终止会话，强制登出
 * @param sessionId 会话ID
 */
export const terminateSession = async (sessionId: string) => {
  try {
    // 更新登录日志，将会话标记为非活跃
    await systemSettingsDb
      .update(loginLogs)
      .set({ isActive: false })
      .where(eq(loginLogs.sessionId, sessionId))

    console.log(`会话已终止: ${sessionId}`)
    return { success: true }
  } catch (error) {
    console.error('终止会话失败:', error)
    return { success: false, error: '终止会话失败' }
  }
}

/**
 * 获取用户的活跃会话
 * @param userId 用户ID
 * @param limit 限制数量
 * @returns 活跃会话列表
 */
export const getActiveSessions = async (userId: string, limit: number = 10) => {
  try {
    const sessions = await systemSettingsDb
      .select()
      .from(loginLogs)
      .where(and(eq(loginLogs.userId, userId), eq(loginLogs.isActive, true)))
      .orderBy(desc(loginLogs.loginTime))
      .limit(limit)

    return sessions
  } catch (error) {
    console.error('获取活跃会话失败:', error)
    return []
  }
}

/**
 * 批量获取多个用户的活跃会话
 * @param userIds 用户ID列表
 * @returns 活跃会话列表
 */
export const getActiveSessionsForUsers = async (userIds: string[]) => {
  try {
    const sessions = await systemSettingsDb
      .select()
      .from(loginLogs)
      .where(and(inArray(loginLogs.userId, userIds), eq(loginLogs.isActive, true)))
      .orderBy(desc(loginLogs.loginTime))

    return sessions
  } catch (error) {
    console.error('批量获取活跃会话失败:', error)
    return []
  }
}

/**
 * 获取用户的登录历史记录
 * @param userId 用户ID
 * @param limit 限制数量
 * @param offset 偏移量
 * @returns 登录历史记录列表
 */
export const getUserLoginHistory = async (userId: string, limit: number = 20, offset: number = 0) => {
  try {
    const [logs, totalCount] = await Promise.all([
      systemSettingsDb
        .select()
        .from(loginLogs)
        .where(eq(loginLogs.userId, userId))
        .orderBy(desc(loginLogs.loginTime))
        .limit(limit)
        .offset(offset),
      systemSettingsDb
        .select({ count: sql<number>`count(*)`.as('count') })
        .from(loginLogs)
        .where(eq(loginLogs.userId, userId))
        .then(result => result[0]?.count || 0)
    ])

    return { logs, totalCount }
  } catch (error) {
    console.error('获取用户登录历史记录失败:', error)
    return { logs: [], totalCount: 0 }
  }
}

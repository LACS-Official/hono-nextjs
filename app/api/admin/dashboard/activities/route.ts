/**
 * 管理仪表板活动记录API
 * GET /api/admin/dashboard/activities - 获取最近的活动记录
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, software, activationCodes, softwareActivations } from '@/lib/unified-db-connection'
import { desc, gte, or, and, eq } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 活动记录接口
interface Activity {
  id: string
  type: 'software_created' | 'software_updated' | 'activation_code_generated' | 'activation_code_used' | 'software_activated'
  title: string
  description: string
  timestamp: string
  metadata?: {
    softwareName?: string
    softwareId?: number
    activationCodeId?: string
    deviceInfo?: string
    [key: string]: any
  }
}

// GET /api/admin/dashboard/activities - 获取最近的活动记录
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 统一认证验证（需要管理员权限）
    const authValidation = validateUnifiedAuth(request)
    if (!authValidation.isValid) {
      return corsResponse({
        success: false,
        error: authValidation.error || 'Authentication required for dashboard access',
        authType: authValidation.authType
      }, { status: 401 }, origin, userAgent)
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // 最多100条
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30) // 最多30天

    // 记录访问日志
    const logInfo = authValidation.authType === 'github-oauth' 
      ? `User: ${authValidation.user?.login} (${authValidation.user?.email})`
      : `API Key authentication`
    console.log(`[DASHBOARD_ACTIVITIES] ${logInfo} - Limit: ${limit}, Days: ${days} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    // 计算时间范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // 并行获取各种活动记录
    const [
      softwareActivities,
      activationCodeActivities,
      userActivationActivities
    ] = await Promise.all([
      getSoftwareActivities(startDate, Math.ceil(limit / 3)),
      getActivationCodeActivities(startDate, Math.ceil(limit / 3)),
      getUserActivationActivities(startDate, Math.ceil(limit / 3))
    ])

    // 合并并排序所有活动
    const allActivities: Activity[] = [
      ...softwareActivities,
      ...activationCodeActivities,
      ...userActivationActivities
    ]

    // 按时间戳降序排序并限制数量
    allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const limitedActivities = allActivities.slice(0, limit)

    return corsResponse({
      success: true,
      data: {
        activities: limitedActivities,
        total: limitedActivities.length,
        timeRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
          days: days
        },
        lastUpdated: new Date().toISOString()
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('Error fetching dashboard activities:', error)
    return corsResponse({
      success: false,
      error: 'Failed to fetch dashboard activities'
    }, { status: 500 }, origin, userAgent)
  }
}

// 获取软件相关活动
async function getSoftwareActivities(startDate: Date, limit: number): Promise<Activity[]> {
  try {
    const recentSoftware = await db
      .select({
        id: software.id,
        name: software.name,
        nameEn: software.nameEn,
        createdAt: software.createdAt,
        updatedAt: software.updatedAt,
        currentVersion: software.currentVersion,
        isActive: software.isActive
      })
      .from(software)
      .where(or(
        gte(software.createdAt, startDate),
        gte(software.updatedAt, startDate)
      ))
      .orderBy(desc(software.updatedAt))
      .limit(limit)

    const activities: Activity[] = []

    for (const sw of recentSoftware) {
      // 判断是新创建还是更新
      const isNewlyCreated = new Date(sw.createdAt).getTime() >= startDate.getTime()
      const isRecentlyUpdated = new Date(sw.updatedAt).getTime() >= startDate.getTime() && 
                               new Date(sw.updatedAt).getTime() > new Date(sw.createdAt).getTime()

      if (isNewlyCreated) {
        activities.push({
          id: `software_created_${sw.id}`,
          type: 'software_created',
          title: '新增软件',
          description: `添加了新软件「${sw.name}」版本 ${sw.currentVersion}`,
          timestamp: sw.createdAt.toISOString(),
          metadata: {
            softwareName: sw.name,
            softwareId: sw.id,
            version: sw.currentVersion,
            isActive: sw.isActive
          }
        })
      } else if (isRecentlyUpdated) {
        activities.push({
          id: `software_updated_${sw.id}_${sw.updatedAt.getTime()}`,
          type: 'software_updated',
          title: '更新软件',
          description: `更新了软件「${sw.name}」信息`,
          timestamp: sw.updatedAt.toISOString(),
          metadata: {
            softwareName: sw.name,
            softwareId: sw.id,
            version: sw.currentVersion,
            isActive: sw.isActive
          }
        })
      }
    }

    return activities
  } catch (error) {
    console.error('Error fetching software activities:', error)
    return []
  }
}

// 获取激活码相关活动
async function getActivationCodeActivities(startDate: Date, limit: number): Promise<Activity[]> {
  try {
    const recentCodes = await db
      .select({
        id: activationCodes.id,
        code: activationCodes.code,
        createdAt: activationCodes.createdAt,
        usedAt: activationCodes.usedAt,
        isUsed: activationCodes.isUsed,
        expiresAt: activationCodes.expiresAt,
        metadata: activationCodes.metadata
      })
      .from(activationCodes)
      .where(or(
        gte(activationCodes.createdAt, startDate),
        and(
          gte(activationCodes.usedAt, startDate),
          eq(activationCodes.isUsed, true)
        )
      ))
      .orderBy(desc(activationCodes.createdAt))
      .limit(limit)

    const activities: Activity[] = []

    for (const code of recentCodes) {
      // 激活码生成活动
      if (new Date(code.createdAt).getTime() >= startDate.getTime()) {
        activities.push({
          id: `activation_code_generated_${code.id}`,
          type: 'activation_code_generated',
          title: '生成激活码',
          description: `生成了新的激活码 ${code.code.substring(0, 8)}...`,
          timestamp: code.createdAt.toISOString(),
          metadata: {
            activationCodeId: code.id,
            codePreview: code.code.substring(0, 8) + '...',
            expiresAt: code.expiresAt.toISOString(),
            customerInfo: code.metadata?.customerEmail || '未指定'
          }
        })
      }

      // 激活码使用活动
      if (code.isUsed && code.usedAt && new Date(code.usedAt).getTime() >= startDate.getTime()) {
        activities.push({
          id: `activation_code_used_${code.id}`,
          type: 'activation_code_used',
          title: '激活码被使用',
          description: `激活码 ${code.code.substring(0, 8)}... 被成功使用`,
          timestamp: code.usedAt.toISOString(),
          metadata: {
            activationCodeId: code.id,
            codePreview: code.code.substring(0, 8) + '...',
            customerInfo: code.metadata?.customerEmail || '未指定'
          }
        })
      }
    }

    return activities
  } catch (error) {
    console.error('Error fetching activation code activities:', error)
    return []
  }
}

// 获取用户激活相关活动
async function getUserActivationActivities(startDate: Date, limit: number): Promise<Activity[]> {
  try {
    const recentActivations = await db
      .select({
        id: softwareActivations.id,
        softwareName: softwareActivations.softwareName,
        softwareVersion: softwareActivations.softwareVersion,
        deviceFingerprint: softwareActivations.deviceFingerprint,
        activatedAt: softwareActivations.activatedAt,
        metadata: softwareActivations.metadata
      })
      .from(softwareActivations)
      .where(gte(softwareActivations.activatedAt, startDate))
      .orderBy(desc(softwareActivations.activatedAt))
      .limit(limit)

    const activities: Activity[] = recentActivations.map(activation => ({
      id: `software_activated_${activation.id}`,
      type: 'software_activated',
      title: '软件激活',
      description: `用户激活了「${activation.softwareName}」版本 ${activation.softwareVersion}`,
      timestamp: activation.activatedAt.toISOString(),
      metadata: {
        softwareName: activation.softwareName,
        softwareVersion: activation.softwareVersion,
        deviceInfo: activation.deviceFingerprint?.substring(0, 8) + '...' || '未知设备',
        platform: activation.metadata?.platform || '未知平台'
      }
    }))

    return activities
  } catch (error) {
    console.error('Error fetching user activation activities:', error)
    return []
  }
}

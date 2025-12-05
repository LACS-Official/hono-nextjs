/**
 * 管理仪表板活动记录API
 * GET /api/admin/dashboard/activities - 获取最近的活动记录
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, software, activationCodes, softwareUsage } from '@/lib/unified-db-connection'
import { desc, gte, or, and, eq } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { createClient } from '@/utils/supabase/server'
import { isAuthorizedAdmin } from '@/lib/auth'

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
  type: 'software_created' | 'software_updated' | 'activation_code_generated' | 'activation_code_used' | 'software_used'
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

// GET /api/admin/dashboard/activities - 获取仪表板活动记录
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 从请求头获取Authorization token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return corsResponse({
        success: false,
        error: 'Authorization header is required'
      }, { status: 401 }, origin, userAgent)
    }

    const token = authHeader.split(' ')[1]
    
    // 使用token创建Supabase客户端并验证用户
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return corsResponse({
        success: false,
        error: 'Invalid authentication token'
      }, { status: 401 }, origin, userAgent)
    }

    // 检查管理员权限
    const userData = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
      avatar_url: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role
    }
    
    if (!isAuthorizedAdmin(userData)) {
      return corsResponse({
        success: false,
        error: 'Admin access required'
      }, { status: 403 }, origin, userAgent)
    }

    // 记录访问日志
    const logInfo = `User: ${userData.email}`
    console.log(`[DASHBOARD_ACTIVITIES] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const days = parseInt(searchParams.get('days') || '7')

    // 并行获取各种活动数据
    const [
      softwareActivities,
      activationCodeActivities,
      userActivationActivities
    ] = await Promise.all([
      getSoftwareActivities(limit, days),
      getActivationCodeActivities(limit, days),
      getUserActivationActivities(limit, days)
    ])

    // 合并所有活动并按时间排序
    const allActivities = [
      ...softwareActivities.map(activity => ({ ...activity, type: 'software' })),
      ...activationCodeActivities.map(activity => ({ ...activity, type: 'activation_code' })),
      ...userActivationActivities.map(activity => ({ ...activity, type: 'user_activation' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, limit)

    return corsResponse({
      success: true,
      data: {
        activities: allActivities,
        total: allActivities.length,
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
async function getSoftwareActivities(limit: number, days: number): Promise<Activity[]> {
  try {
    // 计算时间范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

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
async function getActivationCodeActivities(limit: number, days: number): Promise<Activity[]> {
  try {
    // 计算时间范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

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
            customerInfo: (code.metadata as any)?.customerEmail || '未指定'
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
            customerInfo: (code.metadata as any)?.customerEmail || '未指定'
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
async function getUserActivationActivities(limit: number, days: number): Promise<Activity[]> {
  try {
    // 计算时间范围
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const recentUsage = await db
      .select({
        id: softwareUsage.id,
        softwareName: softwareUsage.softwareName,
        softwareVersion: softwareUsage.softwareVersion,
        deviceFingerprint: softwareUsage.deviceFingerprint,
        usedAt: softwareUsage.usedAt,
        used: softwareUsage.used
      })
      .from(softwareUsage)
      .where(gte(softwareUsage.usedAt, startDate))
      .orderBy(desc(softwareUsage.usedAt))
      .limit(limit)

    const activities: Activity[] = recentUsage.map(usage => ({
      id: `software_used_${usage.id}`,
      type: 'software_used',
      title: '软件使用',
      description: `用户使用了「${usage.softwareName}」${usage.used}次 (版本 ${usage.softwareVersion || '未知'})`,
      timestamp: usage.usedAt.toISOString(),
      metadata: {
        softwareName: usage.softwareName,
        softwareVersion: usage.softwareVersion,
        deviceInfo: usage.deviceFingerprint?.substring(0, 8) + '...' || '未知设备',
        usageCount: usage.used
      }
    }))

    return activities
  } catch (error) {
    console.error('Error fetching user activation activities:', error)
    return []
  }
}
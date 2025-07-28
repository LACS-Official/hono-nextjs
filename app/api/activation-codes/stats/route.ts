// 统计信息接口
import { NextRequest, NextResponse } from 'next/server'
import { activationCodesDb as db } from '@/lib/activation-codes-db-connection'
import { activationCodes } from '@/lib/activation-codes-schema'
import { eq, and, lt, gt, count } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const now = new Date()

    // 并行查询各种统计数据
    const [
      totalResult,
      usedResult,
      expiredResult,
      activeResult
    ] = await Promise.all([
      // 总数
      db.select({ count: count() }).from(activationCodes),
      
      // 已使用数量
      db.select({ count: count() })
        .from(activationCodes)
        .where(eq(activationCodes.isUsed, true)),
      
      // 过期数量
      db.select({ count: count() })
        .from(activationCodes)
        .where(and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.expiresAt, now)
        )),
      
      // 活跃数量
      db.select({ count: count() })
        .from(activationCodes)
        .where(and(
          eq(activationCodes.isUsed, false),
          gt(activationCodes.expiresAt, now)
        ))
    ])

    const total = totalResult[0]?.count || 0
    const used = usedResult[0]?.count || 0
    const expired = expiredResult[0]?.count || 0
    const active = activeResult[0]?.count || 0
    const unused = total - used

    // 计算使用率和过期率
    const usageRate = total > 0 ? (used / total) * 100 : 0
    const expirationRate = total > 0 ? (expired / total) * 100 : 0

    return corsResponse({
      success: true,
      data: {
        total,
        used,
        unused,
        expired,
        active,
        usageRate: parseFloat(usageRate.toFixed(2)),
        expirationRate: parseFloat(expirationRate.toFixed(2))
      }
    }, undefined, origin, userAgent)
  } catch (error) {
    console.error('Error getting stats:', error)
    return corsResponse({
      success: false,
      error: '获取统计信息失败'
    }, { status: 500 }, origin, userAgent)
  }
}

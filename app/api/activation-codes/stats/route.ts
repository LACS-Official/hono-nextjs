// 统计信息接口
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { eq, and, lt, gt, count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
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

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get statistics'
    }, { status: 500 })
  }
}

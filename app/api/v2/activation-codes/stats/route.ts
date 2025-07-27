// 统计信息接口 (Neon Postgres 版本)
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

    // 估算存储大小 (每个记录约300字节)
    const estimatedSize = total * 300
    const maxCapacity = 512 * 1024 * 1024 // 512MB
    const usagePercentage = (estimatedSize / maxCapacity) * 100

    return NextResponse.json({
      success: true,
      data: {
        total,
        active,
        used,
        expired,
        estimatedSizeBytes: estimatedSize,
        estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2),
        maxCapacityMB: 512,
        usagePercentage: usagePercentage.toFixed(2),
        remainingCapacityMB: ((maxCapacity - estimatedSize) / 1024 / 1024).toFixed(2)
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

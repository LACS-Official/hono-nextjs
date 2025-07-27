// 清理过期激活码接口
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { and, eq, lt } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { daysOld = 30 } = body
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // 删除过期超过指定天数的激活码
    const deletedCodes = await db
      .delete(activationCodes)
      .where(and(
        eq(activationCodes.isUsed, false),
        lt(activationCodes.expiresAt, cutoffDate)
      ))
      .returning()

    return NextResponse.json({
      success: true,
      message: `已清理 ${deletedCodes.length} 个过期激活码`,
      deletedCount: deletedCodes.length
    })
  } catch (error) {
    console.error('Error cleaning up activation codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cleanup activation codes'
    }, { status: 500 })
  }
}

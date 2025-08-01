// 单个激活码操作接口
import { NextRequest, NextResponse } from 'next/server'
import { unifiedDb as db, activationCodes } from '@/lib/unified-db-connection'
import { eq } from 'drizzle-orm'

// GET - 获取单个激活码详情
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [activationCode] = await db
      .select()
      .from(activationCodes)
      .where(eq(activationCodes.id, id))
      .limit(1)

    if (!activationCode) {
      return NextResponse.json({
        success: false,
        error: '激活码不存在'
      }, { status: 404 })
    }

    // 检查是否过期
    const now = new Date()
    const isExpired = now > activationCode.expiresAt

    return NextResponse.json({
      success: true,
      data: {
        id: activationCode.id,
        code: activationCode.code,
        createdAt: activationCode.createdAt,
        expiresAt: activationCode.expiresAt,
        isUsed: activationCode.isUsed,
        usedAt: activationCode.usedAt,
        isExpired,
        productInfo: activationCode.productInfo,
        metadata: activationCode.metadata
      }
    })
  } catch (error) {
    console.error('Error fetching activation code:', error)
    return NextResponse.json({
      success: false,
      error: '获取激活码详情失败'
    }, { status: 500 })
  }
}

// DELETE - 删除激活码
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [deletedCode] = await db
      .delete(activationCodes)
      .where(eq(activationCodes.id, id))
      .returning()

    if (!deletedCode) {
      return NextResponse.json({
        success: false,
        error: '激活码不存在'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: '激活码删除成功'
    })
  } catch (error) {
    console.error('Error deleting activation code:', error)
    return NextResponse.json({
      success: false,
      error: '删除激活码失败'
    }, { status: 500 })
  }
}

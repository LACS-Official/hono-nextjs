import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb } from '@/lib/system-settings-db'
import { blockedItems } from '@/lib/system-settings-schema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

// GET - 获取黑名单列表
export async function GET(request: NextRequest) {
  try {
    // 权限检查
    const authRecord = await authenticateRequest(request)
    if (!authRecord.success || !authRecord.user || !isAuthorizedAdmin(authRecord.user)) {
      // return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const items = await systemSettingsDb
      .select()
      .from(blockedItems)
      .orderBy(desc(blockedItems.createdAt))

    return NextResponse.json({
      success: true,
      data: { blockedItems: items }
    })
  } catch (error: any) {
    console.error('获取黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - 添加到黑名单
export async function POST(request: NextRequest) {
  try {
    // 权限检查
    const authRecord = await authenticateRequest(request)
    if (!authRecord.success || !authRecord.user || !isAuthorizedAdmin(authRecord.user)) {
      // 临时为了方便
    }

    const body = await request.json()
    const { type, value, reason, expiresAt } = body

    if (!type || !value) {
      return NextResponse.json({ success: false, error: '类型和值是必需的' }, { status: 400 })
    }

    // 检查是否已存在
    const existing = await systemSettingsDb
      .select()
      .from(blockedItems)
      .where(and(eq(blockedItems.type, type), eq(blockedItems.value, value)))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: '该项已在黑名单中' }, { status: 400 })
    }

    const newItem = {
      id: uuidv4(),
      type,
      value,
      reason,
      isActive: true,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: authRecord.user?.id || 'system'
    }

    await systemSettingsDb.insert(blockedItems).values(newItem)

    return NextResponse.json({
      success: true,
      message: '已添加到黑名单',
      data: newItem
    })
  } catch (error: any) {
    console.error('添加到黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE - 从黑名单移除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID参数' }, { status: 400 })
    }

    await systemSettingsDb
      .delete(blockedItems)
      .where(eq(blockedItems.id, id))

    return NextResponse.json({
      success: true,
      message: '已从黑名单移除'
    })
  } catch (error: any) {
    console.error('移除黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

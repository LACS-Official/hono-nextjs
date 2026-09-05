import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb, safeQuery } from '@/lib/system-settings-db'
import { blockedItems } from '@/lib/system-settings-schema'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { z } from 'zod'

const requestSchema = z.object({
  type: z.enum(['ip', 'fingerprint', 'userId', 'softwareId', 'keyword']),
  value: z.string().min(1, '值不能为空'),
  reason: z.string().optional(),
  expiresAt: z.string().optional() // ISO date string
})

// GET - 获取黑名单列表
export async function GET(request: NextRequest) {
  try {
    try {
      const items = await SupabaseSystemSettingsService.getBlockedItems()
      return NextResponse.json({
        success: true,
        data: { blockedItems: items }
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] blocked-items GET 回退至 SQL 执行:', supabaseErr.message)
      const items = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(blockedItems)
          .orderBy(desc(blockedItems.createdAt))
      )

      return NextResponse.json({
        success: true,
        data: { blockedItems: items }
      })
    }
  } catch (error: any) {
    console.error('获取黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - 添加到黑名单
export async function POST(request: NextRequest) {
  try {
    const authRecord = await authenticateRequest(request)

    const body = await request.json()
    const parseResult = requestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: '请求数据格式错误',
        details: parseResult.error.issues
      }, { status: 400 })
    }

    const { type, value, reason, expiresAt } = parseResult.data
    let newItem: any = null

    try {
      newItem = await SupabaseSystemSettingsService.addBlockedItem({
        type,
        value,
        reason,
        expiresAt,
        createdBy: authRecord.user?.id || 'system'
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] blocked-items POST 回退至 SQL 执行:', supabaseErr.message)
      const existing = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(blockedItems)
          .where(and(eq(blockedItems.type, type), eq(blockedItems.value, value)))
          .limit(1)
      )

      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: '该项已在黑名单中' }, { status: 400 })
      }

      newItem = {
        id: uuidv4(),
        type,
        value,
        reason,
        isActive: true,
        createdAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: authRecord.user?.id || 'system'
      }

      await safeQuery(() => systemSettingsDb.insert(blockedItems).values(newItem))
    }

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

    try {
      await SupabaseSystemSettingsService.deleteBlockedItem(id)
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] blocked-items DELETE 回退至 SQL 执行:', supabaseErr.message)
      await safeQuery(() =>
        systemSettingsDb
          .delete(blockedItems)
          .where(eq(blockedItems.id, id))
      )
    }

    return NextResponse.json({
      success: true,
      message: '已从黑名单移除'
    })
  } catch (error: any) {
    console.error('移除黑名单失败:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

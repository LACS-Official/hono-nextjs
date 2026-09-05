export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import {
  systemSettingsDb,
  systemSettings,
  systemSettingsAuditLog,
  ensureSystemSettingsTables,
  safeQuery
} from '@/lib/system-settings-db'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { authenticateRequest } from '@/lib/auth'
import { AuditLogService, AuditAction } from '@/lib/audit-log-service'

// GET /api/system-settings - 获取系统设置列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1') || 1
    const limit = Math.min(parseInt(searchParams.get('limit') || '100') || 100, 100)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    try {
      // 优先通过 Supabase HTTPS API 快速可靠读取
      const result = await SupabaseSystemSettingsService.getSettings({
        category,
        search,
        page,
        limit,
      })

      return NextResponse.json({
        success: true,
        data: result,
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] 回退至 SQL 查询:', supabaseErr.message)
      await ensureSystemSettingsTables()
      const offset = (page - 1) * limit
      const conditions = []

      if (category && category !== 'all') {
        conditions.push(eq(systemSettings.category, category))
      }

      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`
        conditions.push(
          or(
            ilike(systemSettings.key, searchTerm),
            ilike(systemSettings.description, searchTerm),
            ilike(systemSettings.category, searchTerm)
          )
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const [settingsList, totalCountResult] = await safeQuery(() =>
        Promise.all([
          systemSettingsDb
            .select()
            .from(systemSettings)
            .where(whereClause)
            .orderBy(desc(systemSettings.updatedAt), desc(systemSettings.createdAt))
            .limit(limit)
            .offset(offset),
          systemSettingsDb
            .select({ count: sql<number>`count(*)` })
            .from(systemSettings)
            .where(whereClause)
        ])
      )

      const total = Number(totalCountResult[0]?.count || 0)

      return NextResponse.json({
        success: true,
        data: {
          settings: settingsList,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      })
    }
  } catch (error: any) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取系统设置失败: ' + (error.message || '未知错误') },
      { status: 500 }
    )
  }
}

// POST /api/system-settings - 创建系统设置
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    const userId = authResult.user?.id || 'admin'

    const body = await request.json()
    const { category, key, value, description, type, isSecret, isRequired, validationRules } = body

    if (!category || !key) {
      return NextResponse.json(
        { success: false, error: '分类 (category) 和键名 (key) 不能为空' },
        { status: 400 }
      )
    }

    let newSetting: any = null

    try {
      newSetting = await SupabaseSystemSettingsService.createSetting({
        category,
        key,
        value: value !== undefined ? String(value) : '',
        description: description || '',
        type: type || 'string',
        isSecret: Boolean(isSecret),
        isRequired: Boolean(isRequired),
        validationRules: validationRules || null,
        userId,
      })
    } catch (supabaseErr: any) {
      if (supabaseErr.message.includes('已存在键名')) {
        return NextResponse.json({ success: false, error: supabaseErr.message }, { status: 400 })
      }
      console.warn('[Supabase REST] POST 回退至 SQL 执行:', supabaseErr.message)
      await ensureSystemSettingsTables()

      const existing = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(systemSettings)
          .where(and(eq(systemSettings.category, category), eq(systemSettings.key, key)))
          .limit(1)
      )

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: `分类 ${category} 下已存在键名为 ${key} 的配置` },
          { status: 400 }
        )
      }

      newSetting = {
        id: uuidv4(),
        category,
        key,
        value: value !== undefined ? String(value) : '',
        description: description || '',
        type: type || 'string',
        isSecret: Boolean(isSecret),
        isRequired: Boolean(isRequired),
        validationRules: validationRules || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: userId
      }

      await safeQuery(() => systemSettingsDb.insert(systemSettings).values(newSetting))
    }

    // 记录审计日志
    try {
      await AuditLogService.log({
        resourceType: 'system_setting',
        resourceId: newSetting.id,
        action: AuditAction.CREATE,
        userId,
        details: {
          newValue: newSetting.value,
          category: newSetting.category,
          key: newSetting.key
        },
        request
      })
    } catch (auditErr) {
      console.warn('记录系统设置审计日志失败:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: '创建系统设置成功',
      data: newSetting
    })
  } catch (error: any) {
    console.error('创建系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '创建系统设置失败: ' + (error.message || '未知错误') },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import {
  systemSettingsDb,
  systemSettings,
  systemSettingsAuditLog,
  NewSystemSettingsAuditLog,
  safeQuery
} from '@/lib/system-settings-db'
import { SupabaseSystemSettingsService } from '@/lib/supabase-system-settings'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { authenticateRequest } from '@/lib/auth'
import { headers } from 'next/headers'
import { SettingValidator } from '@/lib/setting-validator'
import { AuditLogService, AuditAction } from '@/lib/audit-log-service'

// 验证模式
const updateSystemSettingSchema = z.object({
  value: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  isSecret: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  validationRules: z.any().optional(),
})

// 获取单个系统设置
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    try {
      const setting = await SupabaseSystemSettingsService.getSettingById(params.id)
      if (!setting) {
        return NextResponse.json(
          { success: false, error: '设置不存在' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: setting,
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] GET [id] 回退至 SQL 查询:', supabaseErr.message)
      // 获取设置详情
      const setting = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.id, params.id))
          .limit(1)
      )

      if (setting.length === 0) {
        return NextResponse.json(
          { success: false, error: '设置不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: setting[0],
      })
    }
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取系统设置失败' },
      { status: 500 }
    )
  }
}

// 更新系统设置
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const authResult = await authenticateRequest(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = updateSystemSettingSchema.parse(body)

    let updatedResult: any = null
    let oldValue: any = null

    try {
      const existing = await SupabaseSystemSettingsService.getSettingById(params.id)
      if (!existing) {
        return NextResponse.json({ success: false, error: '设置不存在' }, { status: 404 })
      }
      oldValue = existing.value

      // 验证设置值
      if (validatedData.validationRules && validatedData.value !== undefined) {
        const validationResult = SettingValidator.validate(
          validatedData.value,
          existing.type,
          validatedData.validationRules
        )

        if (!validationResult.valid) {
          return NextResponse.json(
            { success: false, error: validationResult.errors?.join(', ') || '验证失败' },
            { status: 400 }
          )
        }
      }

      updatedResult = await SupabaseSystemSettingsService.updateSetting(params.id, {
        ...validatedData,
        updatedBy: authResult.user.id,
      })
    } catch (supabaseErr: any) {
      console.warn('[Supabase REST] PUT [id] 回退至 SQL 执行:', supabaseErr.message)
      const existingSetting = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.id, params.id))
          .limit(1)
      )

      if (existingSetting.length === 0) {
        return NextResponse.json(
          { success: false, error: '设置不存在' },
          { status: 404 }
        )
      }
      oldValue = existingSetting[0].value

      // 验证设置值
      if (validatedData.validationRules && validatedData.value !== undefined) {
        const validationResult = SettingValidator.validate(
          validatedData.value,
          existingSetting[0].type,
          validatedData.validationRules
        )

        if (!validationResult.valid) {
          return NextResponse.json(
            { success: false, error: validationResult.errors?.join(', ') || '验证失败' },
            { status: 400 }
          )
        }
      }

      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: authResult.user.id,
      }

      const result = await safeQuery(() =>
        systemSettingsDb
          .update(systemSettings)
          .set(updateData)
          .where(eq(systemSettings.id, params.id))
          .returning()
      )
      updatedResult = result[0]
    }

    // 记录审计日志
    try {
      await AuditLogService.log({
        resourceType: 'system_setting',
        resourceId: params.id,
        action: AuditAction.UPDATE,
        userId: authResult.user.id,
        details: {
          oldValue,
          newValue: validatedData.value !== undefined ? validatedData.value : oldValue,
        },
        request,
      })
    } catch (auditErr) {
      console.warn('记录审计日志失败:', auditErr)
    }

    return NextResponse.json({
      success: true,
      data: updatedResult,
    })
  } catch (error: any) {
    console.error('更新系统设置失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '更新系统设置失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}

// 删除系统设置
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const authResult = await authenticateRequest(request)

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || '未授权访问' },
        { status: 401 }
      )
    }

    let oldValue: any = null

    try {
      const existing = await SupabaseSystemSettingsService.getSettingById(params.id)
      if (!existing) {
        return NextResponse.json({ success: false, error: '设置不存在' }, { status: 404 })
      }
      if (existing.isRequired) {
        return NextResponse.json({ success: false, error: '不能删除必需设置' }, { status: 400 })
      }
      oldValue = existing.value

      await SupabaseSystemSettingsService.deleteSetting(params.id)
    } catch (supabaseErr: any) {
      if (supabaseErr.message.includes('不能删除必需设置')) {
        return NextResponse.json({ success: false, error: supabaseErr.message }, { status: 400 })
      }
      console.warn('[Supabase REST] DELETE [id] 回退至 SQL 执行:', supabaseErr.message)
      const existingSetting = await safeQuery(() =>
        systemSettingsDb
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.id, params.id))
          .limit(1)
      )

      if (existingSetting.length === 0) {
        return NextResponse.json(
          { success: false, error: '设置不存在' },
          { status: 404 }
        )
      }

      if (existingSetting[0].isRequired) {
        return NextResponse.json(
          { success: false, error: '不能删除必需设置' },
          { status: 400 }
        )
      }

      oldValue = existingSetting[0].value
      await safeQuery(() =>
        systemSettingsDb
          .delete(systemSettings)
          .where(eq(systemSettings.id, params.id))
      )
    }

    // 记录审计日志
    try {
      await AuditLogService.log({
        resourceType: 'system_setting',
        resourceId: params.id,
        action: AuditAction.DELETE,
        userId: authResult.user.id,
        details: {
          oldValue,
          newValue: null,
        },
        request,
      })
    } catch (auditErr) {
      console.warn('记录审计日志失败:', auditErr)
    }

    return NextResponse.json({
      success: true,
      message: '设置删除成功',
    })
  } catch (error: any) {
    console.error('删除系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '删除系统设置失败: ' + (error?.message || '未知错误') },
      { status: 500 }
    )
  }
}
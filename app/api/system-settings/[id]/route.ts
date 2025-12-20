/**
 * 单个系统设置API路由
 * 处理系统设置的更新和删除操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  systemSettingsDb, 
  systemSettings, 
  systemSettingsAuditLog,
  NewSystemSettingsAuditLog
} from '@/lib/system-settings-db'
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
  try {// 获取设置详情
    const setting = await systemSettingsDb
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, params.id))
      .limit(1)

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

    // 检查设置是否存在
    const existingSetting = await systemSettingsDb
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, params.id))
      .limit(1)

    if (existingSetting.length === 0) {
      return NextResponse.json(
        { success: false, error: '设置不存在' },
        { status: 404 }
      )
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = updateSystemSettingSchema.parse(body)

    // 验证设置值
    if (validatedData.validationRules && validatedData.value !== undefined) {
      const validationRules = validatedData.validationRules
      // 使用验证工具进行验证
      const validationResult = SettingValidator.validate(
        validatedData.value,
        existingSetting[0].type,
        validationRules
      )
      
      if (!validationResult.isValid) {
        return NextResponse.json(
          { success: false, error: validationResult.errorMessage },
          { status: 400 }
        )
      }
    }

    // 更新设置
    const updateData = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: authResult.user.id,
    }

    // 执行更新
    const result = await systemSettingsDb
      .update(systemSettings)
      .set(updateData)
      .where(eq(systemSettings.id, params.id))
      .returning()

    // 记录审计日志
    await AuditLogService.createLog({
      settingId: params.id,
      action: AuditAction.UPDATE,
      oldValue: existingSetting[0].value,
      newValue: validatedData.value !== undefined ? validatedData.value : existingSetting[0].value,
      userId: authResult.user.id,
      userAgent: headers().get('user-agent') || undefined,
      ipAddress: request.ip || headers().get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error('更新系统设置失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '更新系统设置失败' },
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

    // 检查设置是否存在
    const existingSetting = await systemSettingsDb
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, params.id))
      .limit(1)

    if (existingSetting.length === 0) {
      return NextResponse.json(
        { success: false, error: '设置不存在' },
        { status: 404 }
      )
    }

    // 检查是否为必需设置
    if (existingSetting[0].isRequired) {
      return NextResponse.json(
        { success: false, error: '不能删除必需设置' },
        { status: 400 }
      )
    }

    // 删除设置
    await systemSettingsDb
      .delete(systemSettings)
      .where(eq(systemSettings.id, params.id))

    // 记录审计日志
    await AuditLogService.createLog({
      settingId: params.id,
      action: AuditAction.DELETE,
      oldValue: existingSetting[0].value,
      newValue: null,
      userId: authResult.user.id,
      userAgent: headers().get('user-agent') || undefined,
      ipAddress: request.ip || headers().get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      message: '设置删除成功',
    })
  } catch (error) {
    console.error('删除系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '删除系统设置失败' },
      { status: 500 }
    )
  }
}
/**
 * 系统设置API路由
 * 处理系统设置的CRUD操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  systemSettingsDb, 
  systemSettings, 
  systemSettingsAuditLog,
  SystemSetting,
  NewSystemSetting,
  NewSystemSettingsAuditLog
} from '@/lib/system-settings-db'
import { eq, and, desc, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { authenticateRequest } from '@/lib/auth'
import { headers } from 'next/headers'
import { SettingValidator } from '@/lib/setting-validator'
import { AuditLogService, AuditAction } from '@/lib/audit-log-service'

// 验证模式
const createSystemSettingSchema = z.object({
  category: z.string().min(1).max(100),
  key: z.string().min(1).max(255),
  value: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  isSecret: z.boolean().default(false),
  isRequired: z.boolean().default(false),
  validationRules: z.any().optional(),
})

const updateSystemSettingSchema = createSystemSettingSchema.partial()

const querySystemSettingsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
})

// 获取系统设置列表
export async function GET(request: NextRequest) {
  try {
    // 验证查询参数
    const { searchParams } = new URL(request.url)
    const query = querySystemSettingsSchema.parse({
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    // 构建查询条件
    const conditions = []
    
    if (query.category) {
      conditions.push(eq(systemSettings.category, query.category))
    }
    
    if (query.search) {
      conditions.push(ilike(systemSettings.key, `%${query.search}%`))
    }

    // 分页参数
    const page = query.page || 1
    const limit = query.limit || 20
    const offset = (page - 1) * limit

    // 执行查询
    let queryBuilder = systemSettingsDb.select().from(systemSettings)
    
    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as typeof queryBuilder
    }
    
    const settings = await queryBuilder
      .limit(limit)
      .offset(offset)
      .orderBy(desc(systemSettings.updatedAt))

    // 获取总数
    let countQuery = systemSettingsDb.select({ count: systemSettings.id }).from(systemSettings)
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as typeof countQuery
    }
    
    const totalResult = await countQuery
    const total = totalResult.length

    return NextResponse.json({
      success: true,
      data: {
        settings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取系统设置失败' },
      { status: 500 }
    )
  }
}

// 创建系统设置
export async function POST(request: NextRequest) {
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
    const validatedData = createSystemSettingSchema.parse(body)

    // 检查是否已存在相同的设置键
    const existingSetting = await systemSettingsDb
      .select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.category, validatedData.category),
        eq(systemSettings.key, validatedData.key)
      ))
      .limit(1)

    if (existingSetting.length > 0) {
      return NextResponse.json(
        { success: false, error: '该设置已存在' },
        { status: 409 }
      )
    }

    // 验证设置值
    if (validatedData.validationRules && validatedData.value) {
      const validationRules = validatedData.validationRules
      // 使用验证工具进行验证
      const validationResult = SettingValidator.validate(
        validatedData.value,
        validatedData.type,
        validationRules
      )
      
      if (!validationResult.isValid) {
        return NextResponse.json(
          { success: false, error: validationResult.errorMessage },
          { status: 400 }
        )
      }
    }

    // 创建新设置
    const newSetting: NewSystemSetting = {
      id: uuidv4(),
      ...validatedData,
      updatedBy: authResult.user.id,
    }

    const result = await systemSettingsDb
      .insert(systemSettings)
      .values(newSetting)
      .returning()

    // 记录审计日志
    await AuditLogService.createLog({
      settingId: result[0].id,
      action: AuditAction.CREATE,
      oldValue: null,
      newValue: validatedData.value,
      userId: authResult.user.id,
      userAgent: headers().get('user-agent') || undefined,
      ipAddress: request.ip || headers().get('x-forwarded-for') || undefined,
    })

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error('创建系统设置失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '创建系统设置失败' },
      { status: 500 }
    )
  }
}
/**
 * 系统设置API路由
 * 处理系统设置的CRUD操作
 */

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { z } from 'zod'

// 创建系统设置数据库连接
const systemSettingsDbUrl = process.env.SYSTEM_SETTINGS_DATABASE_URL
if (!systemSettingsDbUrl) {
  throw new Error('SYSTEM_SETTINGS_DATABASE_URL 环境变量未设置')
}

const pool = new Pool({
  connectionString: systemSettingsDbUrl,
})

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

const querySystemSettingsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
})

// 获取系统设置列表
export async function GET(request: NextRequest) {
  const client = await pool.connect()
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
    const params = []
    let paramIndex = 1
    
    if (query.category) {
      conditions.push(`category = $${paramIndex++}`)
      params.push(query.category)
    }
    
    if (query.search) {
      conditions.push(`key ILIKE $${paramIndex++}`)
      params.push(`%${query.search}%`)
    }

    // 分页参数
    const page = query.page || 1
    const limit = query.limit || 20
    const offset = (page - 1) * limit

    // 构建查询SQL
    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    
    // 执行查询
    const settingsQuery = `
      SELECT * FROM system_settings 
      ${whereClause}
      ORDER BY updated_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `
    
    params.push(limit, offset)
    const settingsResult = await client.query(settingsQuery, params)
    
    // 获取总数
    const countParams = conditions.length > 0 ? params.slice(0, -2) : []
    const countQuery = `
      SELECT COUNT(*) as count FROM system_settings 
      ${whereClause}
    `
    
    const countResult = await client.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].count)

    return NextResponse.json({
      success: true,
      data: {
        settings: settingsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error: any) {
    console.error('获取系统设置失败:', error)
    return NextResponse.json(
      { success: false, error: '获取系统设置失败', details: error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}

// 创建系统设置
export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    // 验证请求体
    const body = await request.json()
    const validatedData = createSystemSettingSchema.parse(body)

    // 检查是否已存在相同的key
    const existingSetting = await client.query(
      'SELECT id FROM system_settings WHERE key = $1',
      [validatedData.key]
    )

    if (existingSetting.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: '设置键已存在' },
        { status: 400 }
      )
    }

    // 创建新设置
    const id = `setting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const result = await client.query(
      `INSERT INTO system_settings 
       (id, category, key, value, description, type, is_secret, is_required, validation_rules, created_at, updated_at, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        validatedData.category,
        validatedData.key,
        validatedData.value,
        validatedData.description,
        validatedData.type,
        validatedData.isSecret,
        validatedData.isRequired,
        validatedData.validationRules ? JSON.stringify(validatedData.validationRules) : null,
        now,
        now,
        'system'
      ]
    )

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error: any) {
    console.error('创建系统设置失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: '请求参数无效', details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '创建系统设置失败', details: error.message },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
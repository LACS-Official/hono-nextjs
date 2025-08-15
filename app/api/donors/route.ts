/**
 * 捐赠人员管理API
 * POST /api/donors - 新增捐赠人员（需要GitHub OAuth或API Key认证）
 * GET /api/donors - 获取所有捐赠人员列表（公开访问，通过ALLOWED_ORIGINS环境变量限制）
 */

import { NextRequest } from 'next/server'
import { unifiedDb as db, donors } from '@/lib/unified-db-connection'
import { desc } from 'drizzle-orm'
import { corsResponse, handleOptions, validateUnifiedAuth } from '@/lib/cors'
import { z } from 'zod'

// 标记为动态路由，避免静态生成
export const dynamic = 'force-dynamic'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// 新增捐赠人员请求体验证模
const createDonorSchema = z.object({
  name: z.string().min(1, '捐赠人姓名不能为空').max(255, '捐赠人姓名不能超过255个字符'),
  donationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '捐赠日期格式必须为YYYY-MM-DD')
})

// POST - 新增捐赠人员
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 统一认证验证 - 优先GitHub OAuth，其次API Key
    const authResult = validateUnifiedAuth(request)
    
    if (!authResult.isValid) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    // 解析请求体
    const body = await request.json()
    const validatedData = createDonorSchema.parse(body)

    // 插入新的捐赠人员记录
    const newDonor = await db.insert(donors).values({
      name: validatedData.name,
      donationDate: validatedData.donationDate,
    }).returning()

    // 记录操作日志
    console.log(`[DONORS] 新增捐赠人员: ${validatedData.name} - 认证方式: ${authResult.authType} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`)

    return corsResponse({
      success: true,
      data: newDonor[0]
    }, { status: 201 }, origin, userAgent)

  } catch (error) {
    console.error('新增捐赠人员失败:', error)

    // 处理验证错误
    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: '请求数据格式错误',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '新增捐赠人员失败'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET - 获取所有捐赠人员列表（公开访问，通过CORS限制）
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // 获取所有捐赠人员，按创建时间倒序排列
    const donorsList = await db.select().from(donors).orderBy(desc(donors.createdAt))

    // 记录访问日志
    console.log(`[DONORS] 获取捐赠人员列表 - Origin: ${origin || 'unknown'} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'}`)

    return corsResponse({
      success: true,
      data: donorsList
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取捐赠人员列表失败:', error)

    return corsResponse({
      success: false,
      error: '获取捐赠人员列表失败'
    }, { status: 500 }, origin, userAgent)
  }
}

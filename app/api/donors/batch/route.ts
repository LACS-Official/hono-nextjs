import { NextRequest } from 'next/server'
import { unifiedDb as db, donors } from '@/lib/unified-db-connection'
import { corsResponse, handleOptions } from '@/lib/cors'
import { z } from 'zod'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

const batchDonorsSchema = z.object({
  donors: z.array(
    z.object({
      name: z.string().min(1, '捐赠人姓名不能为空').max(255, '捐赠人姓名不能超过255个字符'),
      donationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '捐赠日期格式必须为YYYY-MM-DD')
    })
  ).min(1, '至少需要一条数据')
})

export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse({
        success: false,
        error: authResult.error || '认证失败'
      }, { status: 401 }, origin, userAgent)
    }

    if (!isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: 'Insufficient permissions - admin access required'
      }, { status: 403 }, origin, userAgent)
    }

    const body = await request.json()
    const validatedData = batchDonorsSchema.parse(body)

    const newDonors = await db.insert(donors).values(validatedData.donors).returning()

    console.log(`[DONORS BATCH] 批量新增捐赠人员共 ${validatedData.donors.length} 条 - 用户: ${authResult.user.email}`)

    return corsResponse({
      success: true,
      data: newDonors,
      message: `成功导入 ${newDonors.length} 条记录`
    }, { status: 201 }, origin, userAgent)

  } catch (error) {
    console.error('批量新增捐赠人员失败:', error)

    if (error instanceof z.ZodError) {
      return corsResponse({
        success: false,
        error: 'JSON 数据格式错误',
        details: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 }, origin, userAgent)
    }

    return corsResponse({
      success: false,
      error: '批量新增捐赠人员失败'
    }, { status: 500 }, origin, userAgent)
  }
}

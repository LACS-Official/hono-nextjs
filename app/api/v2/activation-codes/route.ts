// Neon Postgres 版本的激活码 API
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { activationCodes } from '@/lib/db-schema'
import { eq, desc, and, lt, gt } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

// 生成激活码
function generateActivationCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8)
  return `${timestamp}-${random}-${uuid}`.toUpperCase()
}

// POST - 生成激活码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      expirationDays = 365, 
      metadata = {}, 
      productInfo = {
        name: 'Default Product',
        version: '1.0.0',
        features: ['basic']
      }
    } = body

    const code = generateActivationCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000)

    const [newCode] = await db.insert(activationCodes).values({
      code,
      expiresAt,
      metadata,
      productInfo
    }).returning()

    return NextResponse.json({
      success: true,
      data: {
        id: newCode.id,
        code: newCode.code,
        createdAt: newCode.createdAt,
        expiresAt: newCode.expiresAt,
        productInfo: newCode.productInfo
      }
    })
  } catch (error) {
    console.error('Error generating activation code:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate activation code'
    }, { status: 500 })
  }
}

// GET - 获取激活码列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'all'
    const offset = (page - 1) * limit

    let whereCondition
    const now = new Date()

    switch (status) {
      case 'used':
        whereCondition = eq(activationCodes.isUsed, true)
        break
      case 'unused':
        whereCondition = eq(activationCodes.isUsed, false)
        break
      case 'expired':
        whereCondition = and(
          eq(activationCodes.isUsed, false),
          lt(activationCodes.expiresAt, now)
        )
        break
      case 'active':
        whereCondition = and(
          eq(activationCodes.isUsed, false),
          gt(activationCodes.expiresAt, now)
        )
        break
      default:
        whereCondition = undefined
    }

    const codes = await db
      .select()
      .from(activationCodes)
      .where(whereCondition)
      .orderBy(desc(activationCodes.createdAt))
      .limit(limit)
      .offset(offset)

    // 获取总数
    const totalResult = await db
      .select({ count: activationCodes.id })
      .from(activationCodes)
      .where(whereCondition)

    const total = totalResult.length

    return NextResponse.json({
      success: true,
      data: {
        codes: codes.map(code => ({
          id: code.id,
          code: code.code,
          createdAt: code.createdAt,
          expiresAt: code.expiresAt,
          isUsed: code.isUsed,
          usedAt: code.usedAt,
          productInfo: code.productInfo
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching activation codes:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch activation codes'
    }, { status: 500 })
  }
}

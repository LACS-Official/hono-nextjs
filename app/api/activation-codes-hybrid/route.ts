// 混合模式激活码 API - 支持平滑迁移
// 可以同时从 KV 和 Postgres 读取数据，写入到 Postgres

import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { kv } from '@vercel/kv'
import { db } from '@/lib/db-connection'
import { activationCodes, type ActivationCode } from '@/lib/db-schema'
import { eq, desc, and, lt, gt, count } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createHonoCorsMiddleware } from '@/lib/cors'

export const dynamic = 'force-dynamic'

// KV 存储的激活码类型（日期为字符串格式）
interface KVActivationCode {
  id: string
  code: string
  createdAt: string
  expiresAt: string
  isUsed: boolean
  usedAt?: string
  metadata?: any
  productInfo?: any
}

// 统一的激活码类型
type UnifiedActivationCode = ActivationCode | KVActivationCode

const app = new Hono().basePath('/api/activation-codes-hybrid')

// 应用 CORS 中间件
app.use('*', createHonoCorsMiddleware())

// 生成激活码
function generateActivationCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8)
  return `${timestamp}-${random}-${uuid}`.toUpperCase()
}

// 检查数据库连接状态
async function checkDatabaseConnection() {
  try {
    await db.select().from(activationCodes).limit(1)
    return true
  } catch (error) {
    console.warn('Postgres 连接失败，回退到 KV:', error instanceof Error ? error.message : String(error))
    return false
  }
}

// 生成激活码 - 优先写入 Postgres
app.post('/', async (c) => {
  try {
    const body = await c.req.json()
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

    // 尝试写入 Postgres
    const isPostgresAvailable = await checkDatabaseConnection()
    
    if (isPostgresAvailable) {
      try {
        const [newCode] = await db.insert(activationCodes).values({
          code,
          expiresAt,
          metadata,
          productInfo
        }).returning()

        return c.json({
          success: true,
          source: 'postgres',
          data: {
            id: newCode.id,
            code: newCode.code,
            createdAt: newCode.createdAt,
            expiresAt: newCode.expiresAt,
            productInfo: newCode.productInfo
          }
        })
      } catch (error) {
        console.warn('Postgres 写入失败，回退到 KV:', error instanceof Error ? error.message : String(error))
      }
    }

    // 回退到 KV
    const id = uuidv4()
    const activationCode = {
      id,
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
      metadata,
      productInfo
    }

    await kv.set(`activation:${code}`, activationCode)
    await kv.set(`activation:id:${id}`, code)
    await kv.sadd('activation:codes', code)

    return c.json({
      success: true,
      source: 'kv',
      data: {
        id,
        code,
        createdAt: activationCode.createdAt,
        expiresAt: activationCode.expiresAt,
        productInfo: activationCode.productInfo
      }
    })

  } catch (error) {
    console.error('Error generating activation code:', error)
    return c.json({
      success: false,
      error: 'Failed to generate activation code'
    }, 500)
  }
})

// 验证激活码 - 从两个数据源查找
app.post('/verify', async (c) => {
  try {
    const body = await c.req.json()
    const { code } = body

    if (!code) {
      return c.json({
        success: false,
        error: 'Activation code is required'
      }, 400)
    }

    let activationCode: UnifiedActivationCode | null = null
    let source: 'postgres' | 'kv' | null = null

    // 首先尝试从 Postgres 查找
    const isPostgresAvailable = await checkDatabaseConnection()
    
    if (isPostgresAvailable) {
      try {
        const [pgCode] = await db
          .select()
          .from(activationCodes)
          .where(eq(activationCodes.code, code))
          .limit(1)

        if (pgCode) {
          activationCode = pgCode
          source = 'postgres'
        }
      } catch (error) {
        console.warn('Postgres 查询失败:', error instanceof Error ? error.message : String(error))
      }
    }

    // 如果 Postgres 中没有找到，尝试 KV
    if (!activationCode) {
      try {
        const kvCode = await kv.get<KVActivationCode>(`activation:${code}`)
        if (kvCode) {
          activationCode = kvCode
          source = 'kv'
        }
      } catch (error) {
        console.warn('KV 查询失败:', error instanceof Error ? error.message : String(error))
      }
    }

    if (!activationCode) {
      return c.json({
        success: false,
        error: 'Invalid activation code'
      }, 404)
    }

    // 检查是否已使用
    if (activationCode.isUsed) {
      return c.json({
        success: false,
        error: 'Activation code has already been used',
        usedAt: activationCode.usedAt
      }, 400)
    }

    // 检查是否过期
    const now = new Date()
    const expiresAt = new Date(activationCode.expiresAt)
    if (now > expiresAt) {
      return c.json({
        success: false,
        error: 'Activation code has expired',
        expiresAt: activationCode.expiresAt
      }, 400)
    }

    // 标记为已使用
    if (source === 'postgres') {
      await db
        .update(activationCodes)
        .set({
          isUsed: true,
          usedAt: now
        })
        .where(eq(activationCodes.id, activationCode.id))
    } else {
      activationCode.isUsed = true
      activationCode.usedAt = now.toISOString()
      await kv.set(`activation:${code}`, activationCode)
    }

    return c.json({
      success: true,
      source,
      data: {
        id: activationCode.id,
        code: activationCode.code,
        productInfo: activationCode.productInfo,
        metadata: activationCode.metadata,
        activatedAt: source === 'postgres' ? now.toISOString() : activationCode.usedAt
      }
    })

  } catch (error) {
    console.error('Error verifying activation code:', error)
    return c.json({
      success: false,
      error: 'Failed to verify activation code'
    }, 500)
  }
})

// 获取统计信息 - 合并两个数据源
app.get('/stats', async (c) => {
  try {
    let postgresStats = { total: 0, used: 0, expired: 0, active: 0 }
    let kvStats = { total: 0, used: 0, expired: 0, active: 0 }

    const now = new Date()

    // 获取 Postgres 统计
    const isPostgresAvailable = await checkDatabaseConnection()
    if (isPostgresAvailable) {
      try {
        const [
          totalResult,
          usedResult,
          expiredResult,
          activeResult
        ] = await Promise.all([
          db.select({ count: count() }).from(activationCodes),
          db.select({ count: count() })
            .from(activationCodes)
            .where(eq(activationCodes.isUsed, true)),
          db.select({ count: count() })
            .from(activationCodes)
            .where(and(
              eq(activationCodes.isUsed, false),
              lt(activationCodes.expiresAt, now)
            )),
          db.select({ count: count() })
            .from(activationCodes)
            .where(and(
              eq(activationCodes.isUsed, false),
              gt(activationCodes.expiresAt, now)
            ))
        ])

        postgresStats = {
          total: totalResult[0]?.count || 0,
          used: usedResult[0]?.count || 0,
          expired: expiredResult[0]?.count || 0,
          active: activeResult[0]?.count || 0
        }
      } catch (error) {
        console.warn('获取 Postgres 统计失败:', error instanceof Error ? error.message : String(error))
      }
    }

    // 获取 KV 统计
    try {
      const codes = await kv.smembers('activation:codes')
      kvStats.total = codes.length

      for (const code of codes) {
        const activationCode = await kv.get<KVActivationCode>(`activation:${code}`)
        if (activationCode) {
          if (activationCode.isUsed) {
            kvStats.used++
          } else if (new Date(activationCode.expiresAt) < now) {
            kvStats.expired++
          } else {
            kvStats.active++
          }
        }
      }
    } catch (error) {
      console.warn('获取 KV 统计失败:', error instanceof Error ? error.message : String(error))
    }

    const totalStats = {
      total: postgresStats.total + kvStats.total,
      active: postgresStats.active + kvStats.active,
      used: postgresStats.used + kvStats.used,
      expired: postgresStats.expired + kvStats.expired
    }

    return c.json({
      success: true,
      data: {
        combined: totalStats,
        postgres: postgresStats,
        kv: kvStats,
        estimatedSizeBytes: totalStats.total * 400,
        estimatedSizeMB: (totalStats.total * 400 / 1024 / 1024).toFixed(2)
      }
    })

  } catch (error) {
    console.error('Error getting stats:', error)
    return c.json({
      success: false,
      error: 'Failed to get statistics'
    }, 500)
  }
})

export const GET = handle(app)
export const POST = handle(app)

import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { kv } from '@vercel/kv'
import { v4 as uuidv4 } from 'uuid'
import CryptoJS from 'crypto-js'

export const dynamic = 'force-dynamic'

// 激活码数据结构
interface ActivationCode {
  id: string
  code: string
  createdAt: string
  expiresAt: string
  isUsed: boolean
  usedAt?: string
  metadata?: Record<string, any>
  productInfo?: {
    name: string
    version: string
    features: string[]
  }
}

// 生成激活码
function generateActivationCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8)
  return `${timestamp}-${random}-${uuid}`.toUpperCase()
}

// 生成简化版激活码（更短）
function generateCompactActivationCode(): string {
  const timestamp = Date.now().toString(36).substring(-6) // 取后6位
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}${random}`.toUpperCase()
}

// 加密敏感数据
function encryptData(data: string, secret: string = 'default-secret'): string {
  return CryptoJS.AES.encrypt(data, secret).toString()
}

// 解密敏感数据
function decryptData(encryptedData: string, secret: string = 'default-secret'): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secret)
  return bytes.toString(CryptoJS.enc.Utf8)
}

const app = new Hono().basePath('/api')

// 生成激活码接口
app.post('/activation-codes', async (c) => {
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

    const id = uuidv4()
    const code = generateActivationCode()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000)

    const activationCode: ActivationCode = {
      id,
      code,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isUsed: false,
      metadata,
      productInfo
    }

    // 存储到 KV
    await kv.set(`activation:${code}`, activationCode)
    await kv.set(`activation:id:${id}`, code)

    // 添加到激活码列表
    await kv.sadd('activation:codes', code)

    return c.json({
      success: true,
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

// 验证激活码接口
app.post('/activation-codes/verify', async (c) => {
  try {
    const body = await c.req.json()
    const { code } = body

    if (!code) {
      return c.json({
        success: false,
        error: 'Activation code is required'
      }, 400)
    }

    // 从 KV 获取激活码信息
    const activationCode = await kv.get<ActivationCode>(`activation:${code}`)

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
    activationCode.isUsed = true
    activationCode.usedAt = now.toISOString()
    await kv.set(`activation:${code}`, activationCode)

    return c.json({
      success: true,
      data: {
        id: activationCode.id,
        code: activationCode.code,
        productInfo: activationCode.productInfo,
        metadata: activationCode.metadata,
        activatedAt: activationCode.usedAt
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

// 查询激活码列表接口
app.get('/activation-codes', async (c) => {
  try {
    const { page = '1', limit = '10', status = 'all' } = c.req.query()
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const offset = (pageNum - 1) * limitNum

    // 获取所有激活码
    const codes = await kv.smembers('activation:codes')

    // 获取激活码详细信息
    const activationCodes: ActivationCode[] = []
    for (const code of codes) {
      const activationCode = await kv.get<ActivationCode>(`activation:${code}`)
      if (activationCode) {
        activationCodes.push(activationCode)
      }
    }

    // 根据状态过滤
    let filteredCodes = activationCodes
    if (status === 'used') {
      filteredCodes = activationCodes.filter(code => code.isUsed)
    } else if (status === 'unused') {
      filteredCodes = activationCodes.filter(code => !code.isUsed)
    } else if (status === 'expired') {
      const now = new Date()
      filteredCodes = activationCodes.filter(code => new Date(code.expiresAt) < now)
    }

    // 排序（最新的在前）
    filteredCodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 分页
    const paginatedCodes = filteredCodes.slice(offset, offset + limitNum)

    // 返回结果（不包含敏感信息）
    const result = paginatedCodes.map(code => ({
      id: code.id,
      code: code.code,
      createdAt: code.createdAt,
      expiresAt: code.expiresAt,
      isUsed: code.isUsed,
      usedAt: code.usedAt,
      productInfo: code.productInfo
    }))

    return c.json({
      success: true,
      data: {
        codes: result,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredCodes.length,
          totalPages: Math.ceil(filteredCodes.length / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching activation codes:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch activation codes'
    }, 500)
  }
})

// 获取单个激活码详细信息接口
app.get('/activation-codes/:id', async (c) => {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({
        success: false,
        error: 'Activation code ID is required'
      }, 400)
    }

    // 获取激活码
    const code = await kv.get<string>(`activation:id:${id}`)
    if (!code) {
      return c.json({
        success: false,
        error: 'Activation code not found'
      }, 404)
    }

    const activationCode = await kv.get<ActivationCode>(`activation:${code}`)
    if (!activationCode) {
      return c.json({
        success: false,
        error: 'Activation code data not found'
      }, 404)
    }

    // 检查是否过期
    const now = new Date()
    const expiresAt = new Date(activationCode.expiresAt)
    const isExpired = now > expiresAt

    return c.json({
      success: true,
      data: {
        id: activationCode.id,
        code: activationCode.code,
        createdAt: activationCode.createdAt,
        expiresAt: activationCode.expiresAt,
        isUsed: activationCode.isUsed,
        usedAt: activationCode.usedAt,
        isExpired,
        productInfo: activationCode.productInfo,
        metadata: activationCode.metadata
      }
    })
  } catch (error) {
    console.error('Error fetching activation code:', error)
    return c.json({
      success: false,
      error: 'Failed to fetch activation code'
    }, 500)
  }
})

// 删除激活码接口
app.delete('/activation-codes/:id', async (c) => {
  try {
    const id = c.req.param('id')

    if (!id) {
      return c.json({
        success: false,
        error: 'Activation code ID is required'
      }, 400)
    }

    // 获取激活码
    const code = await kv.get<string>(`activation:id:${id}`)
    if (!code) {
      return c.json({
        success: false,
        error: 'Activation code not found'
      }, 404)
    }

    // 删除相关数据
    await kv.del(`activation:${code}`)
    await kv.del(`activation:id:${id}`)
    await kv.srem('activation:codes', code)

    return c.json({
      success: true,
      message: 'Activation code deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting activation code:', error)
    return c.json({
      success: false,
      error: 'Failed to delete activation code'
    }, 500)
  }
})

// 清理过期激活码接口
app.post('/activation-codes/cleanup', async (c) => {
  try {
    const { daysOld = 30 } = await c.req.json()

    // 获取所有激活码
    const codes = await kv.smembers('activation:codes')
    let deletedCount = 0

    for (const code of codes) {
      const activationCode = await kv.get<ActivationCode>(`activation:${code}`)
      if (activationCode) {
        const now = new Date()
        const expiresAt = new Date(activationCode.expiresAt)
        const daysSinceExpired = (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)

        // 删除过期超过指定天数的激活码
        if (daysSinceExpired > daysOld) {
          await kv.del(`activation:${code}`)
          await kv.del(`activation:id:${activationCode.id}`)
          await kv.srem('activation:codes', code)
          deletedCount++
        }
      }
    }

    return c.json({
      success: true,
      message: `Cleaned up ${deletedCount} expired activation codes`,
      deletedCount
    })
  } catch (error) {
    console.error('Error cleaning up activation codes:', error)
    return c.json({
      success: false,
      error: 'Failed to cleanup activation codes'
    }, 500)
  }
})

// 获取存储统计信息
app.get('/activation-codes/stats', async (c) => {
  try {
    const codes = await kv.smembers('activation:codes')
    let usedCount = 0
    let expiredCount = 0
    let activeCount = 0

    const now = new Date()

    for (const code of codes) {
      const activationCode = await kv.get<ActivationCode>(`activation:${code}`)
      if (activationCode) {
        if (activationCode.isUsed) {
          usedCount++
        } else if (new Date(activationCode.expiresAt) < now) {
          expiredCount++
        } else {
          activeCount++
        }
      }
    }

    const totalCount = codes.length
    const estimatedSize = totalCount * 512 // 每个激活码约512字节

    return c.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        used: usedCount,
        expired: expiredCount,
        estimatedSizeBytes: estimatedSize,
        estimatedSizeMB: (estimatedSize / 1024 / 1024).toFixed(2)
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

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono on Vercel!'
  })
})

app.get('/:wild', (c) => {
  const wild = c.req.param('wild')
  return c.json({
    message: `Hello from Hono on Vercel! You're now on /api/${wild}!`
  })
})

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)
export const PUT = handle(app)
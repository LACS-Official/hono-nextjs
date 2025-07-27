#!/usr/bin/env node

/**
 * 数据迁移脚本：从 Vercel KV 迁移到 Neon Postgres
 * 
 * 使用方法：
 * 1. 确保 .env.local 中配置了正确的 DATABASE_URL 和 KV 凭据
 * 2. 运行: npm run db:migrate
 */

const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { pgTable, text, timestamp, boolean, jsonb, uuid } = require('drizzle-orm/pg-core')

// 定义激活码表结构
const activationCodes = pgTable('activation_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  metadata: jsonb('metadata'),
  productInfo: jsonb('product_info'),
})

// KV 连接 - 检查是否有 KV 环境变量
let kv = null
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = require('@vercel/kv').kv
  }
} catch (error) {
  console.warn('⚠️  KV 模块未找到或配置不完整，将跳过 KV 数据迁移')
}

// 加载环境变量
require('dotenv').config({ path: '.env.local' })

// 检查环境变量
function checkEnvironment() {
  // 检查必需的 DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少必要的环境变量: DATABASE_URL')
    console.error('请在 .env.local 文件中配置 Neon 数据库连接字符串')
    process.exit(1)
  }

  // 检查 KV 配置（可选）
  const hasKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  if (!hasKV) {
    console.warn('⚠️  未找到 KV 配置，将跳过 KV 数据迁移')
    console.warn('如果您有 KV 数据需要迁移，请配置 KV_REST_API_URL 和 KV_REST_API_TOKEN')
    return false
  }

  return true
}

// 创建数据库连接
function createDbConnection() {
  try {
    const sql = neon(process.env.DATABASE_URL)
    return drizzle(sql, { schema: { activationCodes } })
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    process.exit(1)
  }
}

// 从 KV 获取所有激活码
async function fetchAllActivationCodes() {
  if (!kv) {
    console.log('ℹ️  KV 未配置，跳过 KV 数据获取')
    return []
  }

  try {
    console.log('📥 正在从 KV 获取激活码数据...')

    // 获取所有激活码列表
    const codes = await kv.smembers('activation:codes')
    console.log(`   找到 ${codes.length} 个激活码`)

    if (codes.length === 0) {
      console.log('ℹ️  KV 中没有激活码数据，跳过迁移')
      return []
    }

    // 获取每个激活码的详细信息
    const activationCodes = []
    let processed = 0

    for (const code of codes) {
      try {
        const activationCode = await kv.get(`activation:${code}`)
        if (activationCode) {
          activationCodes.push(activationCode)
          processed++

          // 显示进度
          if (processed % 10 === 0 || processed === codes.length) {
            console.log(`   已处理: ${processed}/${codes.length}`)
          }
        }
      } catch (error) {
        console.warn(`⚠️  获取激活码 ${code} 失败:`, error.message)
      }
    }

    console.log(`✅ 成功获取 ${activationCodes.length} 个激活码数据`)
    return activationCodes

  } catch (error) {
    console.error('❌ 从 KV 获取数据失败:', error.message)
    console.warn('继续进行，但不会迁移 KV 数据')
    return []
  }
}

// 转换数据格式
function transformData(kvData) {
  return kvData.map(item => ({
    id: item.id,
    code: item.code,
    createdAt: new Date(item.createdAt),
    expiresAt: new Date(item.expiresAt),
    isUsed: item.isUsed || false,
    usedAt: item.usedAt ? new Date(item.usedAt) : null,
    metadata: item.metadata || null,
    productInfo: item.productInfo || null
  }))
}

// 迁移数据到 Postgres
async function migrateToPostgres(db, data) {
  try {
    console.log('📤 正在迁移数据到 Postgres...')
    
    if (data.length === 0) {
      console.log('ℹ️  没有数据需要迁移')
      return
    }
    
    // 转换数据格式
    const transformedData = transformData(data)
    
    // 批量插入数据
    const batchSize = 100
    let inserted = 0
    
    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize)
      
      try {
        await db.insert(activationCodes).values(batch)
        inserted += batch.length
        console.log(`   已插入: ${inserted}/${transformedData.length}`)
      } catch (error) {
        // 处理重复数据
        if (error.message.includes('duplicate key')) {
          console.warn(`⚠️  跳过重复数据 (批次 ${i + 1}-${i + batch.length})`)
          inserted += batch.length
        } else {
          throw error
        }
      }
    }
    
    console.log(`✅ 成功迁移 ${inserted} 条记录到 Postgres`)
    
  } catch (error) {
    console.error('❌ 迁移到 Postgres 失败:', error.message)
    throw error
  }
}

// 验证迁移结果
async function verifyMigration(db, originalCount) {
  try {
    console.log('🔍 正在验证迁移结果...')
    
    const result = await db.select().from(activationCodes)
    const postgresCount = result.length
    
    console.log(`   KV 原始数据: ${originalCount} 条`)
    console.log(`   Postgres 数据: ${postgresCount} 条`)
    
    if (postgresCount >= originalCount) {
      console.log('✅ 迁移验证成功！')
      return true
    } else {
      console.warn('⚠️  数据数量不匹配，请检查迁移过程')
      return false
    }
    
  } catch (error) {
    console.error('❌ 验证迁移失败:', error.message)
    return false
  }
}

// 主迁移函数
async function main() {
  console.log('🚀 开始数据迁移：KV → Postgres\n')
  
  try {
    // 1. 检查环境
    const hasKV = checkEnvironment()
    console.log('✅ 环境变量检查通过')

    // 2. 创建数据库连接
    const db = createDbConnection()
    console.log('✅ 数据库连接成功')

    // 3. 从 KV 获取数据
    const kvData = await fetchAllActivationCodes()

    // 4. 迁移数据
    await migrateToPostgres(db, kvData)

    // 5. 验证迁移
    const success = await verifyMigration(db, kvData.length)
    
    if (success) {
      console.log('\n🎉 数据迁移完成！')
      console.log('\n📋 下一步操作：')
      console.log('   1. 测试新的 API: npm run test:postgres')
      console.log('   2. 更新前端调用新的 API 端点 (/api/v2/)')
      console.log('   3. 验证功能正常后可以停用 KV')
    } else {
      console.log('\n⚠️  迁移可能存在问题，请检查日志')
    }
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message)
    console.error('\n🔧 故障排除：')
    console.error('   1. 检查 DATABASE_URL 是否正确')
    console.error('   2. 检查 KV 凭据是否有效')
    console.error('   3. 确保网络连接正常')
    console.error('   4. 查看完整错误信息:', error)
    process.exit(1)
  }
}

// 运行迁移
if (require.main === module) {
  main()
}

module.exports = { main }

#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function checkCurrentDatabase() {
  console.log('🔍 检查当前数据库状态...\n')
  
  const databases = {
    'SOFTWARE (主数据库)': process.env.SOFTWARE_DATABASE_URL,
    'ACTIVATION_CODES': process.env.ACTIVATION_CODES_DATABASE_URL,
    'USER_BEHAVIOR': process.env.USER_BEHAVIOR_DATABASE_URL
  }
  
  for (const [name, url] of Object.entries(databases)) {
    if (!url) {
      console.log(`⚠️ ${name}: 未配置`)
      continue
    }
    
    try {
      const sql = neon(url)
      console.log(`📊 ${name}:`)
      
      // 检查连接
      await sql`SELECT 1`
      console.log('  ✅ 连接正常')
      
      // 获取表列表
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
      
      if (tables.length > 0) {
        console.log('  📋 现有表:')
        for (const table of tables) {
          // 获取记录数
          const count = await sql.query(`SELECT COUNT(*) as count FROM ${table.table_name}`)
          console.log(`    - ${table.table_name}: ${count[0].count} 条记录`)
        }
      } else {
        console.log('  📋 无表')
      }
      
      console.log('')
      
    } catch (error) {
      console.log(`  ❌ 连接失败: ${error.message}`)
      console.log('')
    }
  }
}

checkCurrentDatabase().catch(console.error)

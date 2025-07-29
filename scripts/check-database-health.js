#!/usr/bin/env node

/**
 * 数据库健康检查脚本
 * 检查数据库连接和表结构
 */

require('dotenv').config({ path: '.env.local' })

const { neon } = require('@neondatabase/serverless')

async function checkDatabaseHealth() {
  console.log('🔍 开始数据库健康检查...\n')

  // 检查环境变量
  const databaseUrl = process.env.SOFTWARE_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ SOFTWARE_DATABASE_URL 环境变量未设置')
    process.exit(1)
  }

  console.log('✅ 环境变量配置正确')

  try {
    // 创建数据库连接
    const sql = neon(databaseUrl)
    
    // 测试连接
    console.log('🔗 测试数据库连接...')
    await sql`SELECT 1 as test`
    console.log('✅ 数据库连接成功')

    // 检查表是否存在
    console.log('\n📋 检查表结构...')
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('software', 'software_version_history', 'software_announcements', 'download_stats')
      ORDER BY table_name
    `

    console.log('现有表:')
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`)
    })

    if (tables.length === 0) {
      console.log('❌ 未找到软件管理相关的表')
      console.log('\n💡 建议操作:')
      console.log('1. 运行数据库迁移脚本')
      console.log('2. 检查数据库连接字符串是否正确')
      console.log('3. 确认数据库权限设置')
    }

    // 检查 software 表的数据
    if (tables.some(t => t.table_name === 'software')) {
      console.log('\n📊 检查软件数据...')
      try {
        const softwareCount = await sql`SELECT COUNT(*) as count FROM software`
        console.log(`软件总数: ${softwareCount[0].count}`)
        
        if (softwareCount[0].count > 0) {
          const sampleSoftware = await sql`SELECT id, name, current_version FROM software LIMIT 3`
          console.log('示例软件:')
          sampleSoftware.forEach(sw => {
            console.log(`  - #${sw.id}: ${sw.name} (v${sw.current_version})`)
          })
        } else {
          console.log('⚠️ 软件表为空，可能需要添加测试数据')
        }
      } catch (error) {
        console.error('❌ 查询软件数据失败:', error.message)
      }
    }

    // 检查版本历史表
    if (tables.some(t => t.table_name === 'software_version_history')) {
      console.log('\n📈 检查版本历史数据...')
      try {
        const versionCount = await sql`SELECT COUNT(*) as count FROM software_version_history`
        console.log(`版本历史记录数: ${versionCount[0].count}`)
      } catch (error) {
        console.error('❌ 查询版本历史失败:', error.message)
      }
    }

    console.log('\n🎉 数据库健康检查完成!')

  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message)
    console.log('\n💡 可能的解决方案:')
    console.log('1. 检查网络连接')
    console.log('2. 验证数据库连接字符串')
    console.log('3. 确认数据库服务是否运行')
    console.log('4. 检查防火墙设置')
    process.exit(1)
  }
}

// 运行健康检查
checkDatabaseHealth().catch(console.error)

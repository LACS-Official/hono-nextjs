#!/usr/bin/env node

/**
 * 设备连接表简化迁移脚本
 * 删除不需要的字段：softwareVersion, connectionType, ipAddress, country, region, city
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function migrateDeviceConnections() {
  console.log('🔄 开始设备连接表简化迁移...\n')

  const databaseUrl = process.env.USER_BEHAVIOR_DATABASE_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ USER_BEHAVIOR_DATABASE_URL 或 DATABASE_URL 环境变量未设置')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // 检查表是否存在
    console.log('📋 步骤 1: 检查 device_connections 表是否存在...')
    const tableExists = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'device_connections' AND table_schema = 'public'
    `
    
    if (tableExists.length === 0) {
      console.log('⚠️ device_connections 表不存在，无需迁移')
      return
    }
    console.log('✅ device_connections 表存在')

    // 检查需要删除的字段是否存在
    console.log('📋 步骤 2: 检查需要删除的字段...')
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'device_connections' AND table_schema = 'public'
    `
    
    const existingColumns = columns.map(col => col.column_name)
    const fieldsToRemove = ['software_version', 'connection_type', 'ip_address', 'country', 'region', 'city']
    const fieldsToDelete = fieldsToRemove.filter(field => existingColumns.includes(field))
    
    console.log('现有字段:', existingColumns.join(', '))
    console.log('需要删除的字段:', fieldsToDelete.join(', '))
    
    if (fieldsToDelete.length === 0) {
      console.log('✅ 所有需要删除的字段都已不存在，无需迁移')
      return
    }

    // 备份现有数据（可选）
    console.log('📋 步骤 3: 备份现有数据...')
    const existingData = await sql`SELECT COUNT(*) as count FROM device_connections`
    console.log(`发现 ${existingData[0].count} 条现有记录`)

    // 删除字段
    console.log('📋 步骤 4: 删除不需要的字段...')
    for (const field of fieldsToDelete) {
      try {
        console.log(`删除字段: ${field}`)
        await sql`ALTER TABLE device_connections DROP COLUMN IF EXISTS ${sql(field)}`
        console.log(`✅ 字段 ${field} 删除成功`)
      } catch (error) {
        console.error(`❌ 删除字段 ${field} 失败:`, error.message)
      }
    }

    // 验证迁移结果
    console.log('📋 步骤 5: 验证迁移结果...')
    const finalColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'device_connections' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('迁移后的字段:', finalColumns.map(col => col.column_name).join(', '))
    
    // 检查数据完整性
    const finalData = await sql`SELECT COUNT(*) as count FROM device_connections`
    console.log(`迁移后记录数: ${finalData[0].count}`)
    
    if (finalData[0].count === existingData[0].count) {
      console.log('✅ 数据完整性检查通过')
    } else {
      console.log('⚠️ 数据记录数发生变化，请检查')
    }

    console.log('\n🎉 设备连接表简化迁移完成!')
    
  } catch (error) {
    console.error('❌ 迁移失败:', error)
    process.exit(1)
  }
}

// 运行迁移
if (require.main === module) {
  migrateDeviceConnections()
    .then(() => {
      console.log('\n✅ 迁移脚本执行完成')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 迁移脚本执行失败:', error)
      process.exit(1)
    })
}

module.exports = { migrateDeviceConnections }

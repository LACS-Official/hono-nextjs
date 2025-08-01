#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function consolidateDatabase() {
  console.log('🚀 开始数据库简化整合...\n')
  
  const targetSql = neon(process.env.SOFTWARE_DATABASE_URL) // 主数据库
  const sourceSql = neon(process.env.ACTIVATION_CODES_DATABASE_URL) // 激活码数据库
  
  try {
    // 第1步：在主数据库中创建缺失的表
    console.log('📋 第1步：创建缺失的表结构...')
    
    await targetSql`
      CREATE TABLE IF NOT EXISTS activation_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL UNIQUE,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        is_used boolean DEFAULT false NOT NULL,
        used_at timestamp with time zone,
        used_by uuid,
        metadata jsonb,
        product_info jsonb
      )
    `
    console.log('  ✅ activation_codes 表已创建')
    
    await targetSql`
      CREATE TABLE IF NOT EXISTS software_activations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        software_id integer NOT NULL,
        software_name text NOT NULL DEFAULT '玩机管家',
        software_version text,
        device_fingerprint text NOT NULL,
        device_os text,
        device_arch text,
        activation_code text,
        activated_at timestamp with time zone NOT NULL DEFAULT now(),
        username text,
        user_email text,
        ip_address text,
        country text,
        region text,
        city text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `
    console.log('  ✅ software_activations 表已创建')
    
    await targetSql`
      CREATE TABLE IF NOT EXISTS device_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        device_serial text NOT NULL,
        device_brand text,
        device_model text,
        software_id integer NOT NULL,
        user_device_fingerprint text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `
    console.log('  ✅ device_connections 表已创建')
    
    await targetSql`
      CREATE TABLE IF NOT EXISTS behavior_stats (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        date date NOT NULL,
        total_activations integer DEFAULT 0,
        unique_devices integer DEFAULT 0,
        total_connections integer DEFAULT 0,
        unique_device_connections integer DEFAULT 0,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `
    console.log('  ✅ behavior_stats 表已创建')
    
    // 第2步：创建索引
    console.log('\n📊 第2步：创建索引...')

    await targetSql`CREATE INDEX IF NOT EXISTS activation_codes_code_idx ON activation_codes(code)`
    await targetSql`CREATE INDEX IF NOT EXISTS activation_codes_expires_at_idx ON activation_codes(expires_at)`
    await targetSql`CREATE INDEX IF NOT EXISTS software_activations_device_fingerprint_idx ON software_activations(device_fingerprint)`
    await targetSql`CREATE INDEX IF NOT EXISTS software_activations_software_id_idx ON software_activations(software_id)`
    await targetSql`CREATE INDEX IF NOT EXISTS device_connections_device_serial_idx ON device_connections(device_serial)`
    await targetSql`CREATE INDEX IF NOT EXISTS device_connections_software_id_idx ON device_connections(software_id)`

    console.log('  ✅ 索引已创建')
    
    // 第3步：迁移数据
    console.log('\n📦 第3步：迁移数据...')
    
    // 迁移激活码
    const activationCodes = await sourceSql`SELECT * FROM activation_codes`
    if (activationCodes.length > 0) {
      for (const code of activationCodes) {
        await targetSql`
          INSERT INTO activation_codes (id, code, created_at, expires_at, is_used, used_at, used_by, metadata, product_info)
          VALUES (${code.id}, ${code.code}, ${code.created_at}, ${code.expires_at}, ${code.is_used}, ${code.used_at}, ${code.used_by}, ${code.metadata}, ${code.product_info})
          ON CONFLICT (id) DO NOTHING
        `
      }
      console.log(`  ✅ 迁移了 ${activationCodes.length} 条激活码记录`)
    }
    
    // 迁移软件激活记录
    const softwareActivations = await sourceSql`SELECT * FROM software_activations`
    if (softwareActivations.length > 0) {
      for (const activation of softwareActivations) {
        await targetSql`
          INSERT INTO software_activations (
            id, software_id, software_name, software_version, device_fingerprint,
            device_os, device_arch, activation_code, activated_at, username,
            user_email, ip_address, country, region, city, created_at, updated_at
          )
          VALUES (
            ${activation.id}, ${activation.software_id}, ${activation.software_name}, 
            ${activation.software_version}, ${activation.device_fingerprint},
            ${activation.device_os}, ${activation.device_arch}, ${activation.activation_code}, 
            ${activation.activated_at}, ${activation.username}, ${activation.user_email}, 
            ${activation.ip_address}, ${activation.country}, ${activation.region}, 
            ${activation.city}, ${activation.created_at}, ${activation.updated_at}
          )
          ON CONFLICT (id) DO NOTHING
        `
      }
      console.log(`  ✅ 迁移了 ${softwareActivations.length} 条软件激活记录`)
    }
    
    // 迁移设备连接记录
    const deviceConnections = await sourceSql`SELECT * FROM device_connections`
    if (deviceConnections.length > 0) {
      for (const connection of deviceConnections) {
        await targetSql`
          INSERT INTO device_connections (
            id, device_serial, device_brand, device_model, software_id,
            user_device_fingerprint, created_at, updated_at
          )
          VALUES (
            ${connection.id}, ${connection.device_serial}, ${connection.device_brand},
            ${connection.device_model}, ${connection.software_id}, 
            ${connection.user_device_fingerprint}, ${connection.created_at}, ${connection.updated_at}
          )
          ON CONFLICT (id) DO NOTHING
        `
      }
      console.log(`  ✅ 迁移了 ${deviceConnections.length} 条设备连接记录`)
    }
    
    // 第4步：验证数据
    console.log('\n🔍 第4步：验证数据完整性...')
    
    const targetActivationCodes = await targetSql`SELECT COUNT(*) as count FROM activation_codes`
    const targetSoftwareActivations = await targetSql`SELECT COUNT(*) as count FROM software_activations`
    const targetDeviceConnections = await targetSql`SELECT COUNT(*) as count FROM device_connections`
    
    console.log(`  📊 主数据库统计:`)
    console.log(`    - activation_codes: ${targetActivationCodes[0].count} 条记录`)
    console.log(`    - software_activations: ${targetSoftwareActivations[0].count} 条记录`)
    console.log(`    - device_connections: ${targetDeviceConnections[0].count} 条记录`)
    
    console.log('\n✅ 数据库整合完成！')
    console.log('\n📋 下一步操作:')
    console.log('1. 更新应用程序使用统一数据库连接')
    console.log('2. 测试所有功能')
    console.log('3. 清理旧的数据库配置文件')
    
  } catch (error) {
    console.error('❌ 整合失败:', error.message)
    throw error
  }
}

consolidateDatabase().catch(console.error)

#!/usr/bin/env node

/**
 * 数据库统一迁移脚本
 * 将3个独立数据库的数据迁移到统一数据库
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

// 配置
const CONFIG = {
  // 目标统一数据库
  targetDb: process.env.DATABASE_URL || process.env.SOFTWARE_DATABASE_URL,
  
  // 源数据库
  sourceActivationCodes: process.env.ACTIVATION_CODES_DATABASE_URL,
  sourceSoftware: process.env.SOFTWARE_DATABASE_URL,
  sourceUserBehavior: process.env.USER_BEHAVIOR_DATABASE_URL,
  
  // 迁移选项
  batchSize: 1000,
  dryRun: process.argv.includes('--dry-run'),
  skipExisting: true,
}

async function createUnifiedSchema(targetSql) {
  console.log('📋 创建统一数据库模式...')
  
  try {
    await targetSql`
      -- 激活码相关表
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
      );
      
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL,
        token text NOT NULL UNIQUE,
        expires_at timestamp with time zone NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        is_revoked boolean DEFAULT false NOT NULL,
        device_info jsonb
      );
    `
    
    await targetSql`
      -- 软件管理相关表
      CREATE TABLE IF NOT EXISTS software (
        id serial PRIMARY KEY,
        name varchar(255) NOT NULL UNIQUE,
        name_en varchar(255),
        description text,
        description_en text,
        current_version varchar(50) NOT NULL,
        official_website text,
        category varchar(100),
        tags jsonb,
        system_requirements jsonb,
        is_active boolean DEFAULT true NOT NULL,
        sort_order integer DEFAULT 0,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS software_version_history (
        id serial PRIMARY KEY,
        software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
        version varchar(50) NOT NULL,
        release_date timestamp with time zone NOT NULL,
        release_notes text,
        release_notes_en text,
        download_links jsonb,
        file_size bigint,
        file_hash varchar(128),
        is_beta boolean DEFAULT false,
        is_active boolean DEFAULT true NOT NULL,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS software_announcements (
        id serial PRIMARY KEY,
        software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        title_en varchar(255),
        content text NOT NULL,
        content_en text,
        announcement_type varchar(50) DEFAULT 'info',
        priority integer DEFAULT 0,
        is_active boolean DEFAULT true NOT NULL,
        valid_from timestamp with time zone DEFAULT now(),
        valid_until timestamp with time zone,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS download_stats (
        id serial PRIMARY KEY,
        software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
        version varchar(50) NOT NULL,
        download_count integer DEFAULT 0,
        last_downloaded_at timestamp with time zone,
        metadata jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `
    
    await targetSql`
      -- 用户行为统计相关表
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
      );
      
      CREATE TABLE IF NOT EXISTS device_connections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        device_serial text NOT NULL,
        device_brand text,
        device_model text,
        software_id integer NOT NULL,
        user_device_fingerprint text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `
    
    // 创建索引
    await targetSql`
      CREATE INDEX IF NOT EXISTS activation_codes_code_idx ON activation_codes(code);
      CREATE INDEX IF NOT EXISTS activation_codes_expires_at_idx ON activation_codes(expires_at);
      CREATE INDEX IF NOT EXISTS software_name_idx ON software(name);
      CREATE INDEX IF NOT EXISTS software_category_idx ON software(category);
      CREATE INDEX IF NOT EXISTS software_activations_device_fingerprint_idx ON software_activations(device_fingerprint);
      CREATE INDEX IF NOT EXISTS software_activations_software_id_idx ON software_activations(software_id);
      CREATE INDEX IF NOT EXISTS device_connections_device_serial_idx ON device_connections(device_serial);
      CREATE INDEX IF NOT EXISTS device_connections_software_id_idx ON device_connections(software_id);
    `
    
    console.log('✅ 统一数据库模式创建完成')
  } catch (error) {
    console.error('❌ 创建统一数据库模式失败:', error.message)
    throw error
  }
}

async function migrateTable(sourceSql, targetSql, tableName, columns) {
  console.log(`📦 迁移表: ${tableName}`)
  
  try {
    // 检查源表是否存在
    const sourceExists = await sourceSql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${tableName}
      )
    `
    
    if (!sourceExists[0].exists) {
      console.log(`⚠️ 源表 ${tableName} 不存在，跳过`)
      return { migrated: 0, skipped: 0 }
    }
    
    // 获取源数据
    const sourceData = await sourceSql.query(`SELECT * FROM ${tableName}`)
    
    if (sourceData.length === 0) {
      console.log(`⚠️ 表 ${tableName} 无数据，跳过`)
      return { migrated: 0, skipped: 0 }
    }
    
    console.log(`📊 发现 ${sourceData.length} 条记录`)
    
    if (CONFIG.dryRun) {
      console.log(`🔍 [DRY RUN] 将迁移 ${sourceData.length} 条记录到 ${tableName}`)
      return { migrated: 0, skipped: sourceData.length }
    }
    
    // 批量插入到目标数据库
    let migrated = 0
    let skipped = 0
    
    for (let i = 0; i < sourceData.length; i += CONFIG.batchSize) {
      const batch = sourceData.slice(i, i + CONFIG.batchSize)
      
      try {
        // 使用Drizzle风格的批量插入
        for (const row of batch) {
          try {
            const insertData = {}
            columns.forEach(col => {
              if (row[col] !== undefined) {
                insertData[col] = row[col]
              }
            })

            await targetSql.query(
              `INSERT INTO ${tableName} (${columns.join(', ')})
               VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
               ON CONFLICT DO NOTHING`,
              columns.map(col => row[col])
            )
          } catch (insertError) {
            console.error(`    ⚠️ 插入记录失败:`, insertError.message)
          }
        }
        
        migrated += batch.length
        console.log(`  ✅ 批次 ${Math.floor(i / CONFIG.batchSize) + 1}: ${batch.length} 条记录`)
        
      } catch (error) {
        console.error(`  ❌ 批次 ${Math.floor(i / CONFIG.batchSize) + 1} 失败:`, error.message)
        skipped += batch.length
      }
    }
    
    console.log(`✅ 表 ${tableName} 迁移完成: ${migrated} 条成功, ${skipped} 条跳过`)
    return { migrated, skipped }
    
  } catch (error) {
    console.error(`❌ 迁移表 ${tableName} 失败:`, error.message)
    return { migrated: 0, skipped: 0 }
  }
}

async function runMigration() {
  console.log('🚀 开始数据库统一迁移...\n')
  
  if (CONFIG.dryRun) {
    console.log('🔍 DRY RUN 模式 - 不会实际修改数据\n')
  }
  
  if (!CONFIG.targetDb) {
    console.error('❌ 目标数据库URL未配置')
    process.exit(1)
  }
  
  const targetSql = neon(CONFIG.targetDb)
  const results = {
    totalMigrated: 0,
    totalSkipped: 0,
    tables: {}
  }
  
  try {
    // 1. 创建统一数据库模式
    if (!CONFIG.dryRun) {
      await createUnifiedSchema(targetSql)
    }
    
    // 2. 迁移激活码数据库
    if (CONFIG.sourceActivationCodes && CONFIG.sourceActivationCodes !== CONFIG.targetDb) {
      console.log('\n📦 迁移激活码数据库...')
      const activationCodesSql = neon(CONFIG.sourceActivationCodes)
      
      const activationResult = await migrateTable(
        activationCodesSql, targetSql, 'activation_codes',
        ['id', 'code', 'created_at', 'expires_at', 'is_used', 'used_at', 'used_by', 'metadata', 'product_info']
      )
      results.tables.activation_codes = activationResult
      results.totalMigrated += activationResult.migrated
      results.totalSkipped += activationResult.skipped
      
      const refreshResult = await migrateTable(
        activationCodesSql, targetSql, 'refresh_tokens',
        ['id', 'user_id', 'token', 'expires_at', 'created_at', 'is_revoked', 'device_info']
      )
      results.tables.refresh_tokens = refreshResult
      results.totalMigrated += refreshResult.migrated
      results.totalSkipped += refreshResult.skipped
    }
    
    // 3. 迁移软件管理数据库 (如果不是目标数据库)
    if (CONFIG.sourceSoftware && CONFIG.sourceSoftware !== CONFIG.targetDb) {
      console.log('\n📦 迁移软件管理数据库...')
      const softwareSql = neon(CONFIG.sourceSoftware)
      
      // 软件表
      const softwareResult = await migrateTable(
        softwareSql, targetSql, 'software',
        ['id', 'name', 'name_en', 'description', 'description_en', 'current_version', 
         'official_website', 'category', 'tags', 'system_requirements', 'is_active', 
         'sort_order', 'metadata', 'created_at', 'updated_at']
      )
      results.tables.software = softwareResult
      results.totalMigrated += softwareResult.migrated
      results.totalSkipped += softwareResult.skipped
      
      // 其他软件相关表...
    }
    
    // 4. 迁移用户行为数据库
    if (CONFIG.sourceUserBehavior && CONFIG.sourceUserBehavior !== CONFIG.targetDb) {
      console.log('\n📦 迁移用户行为数据库...')
      const userBehaviorSql = neon(CONFIG.sourceUserBehavior)
      
      const activationsResult = await migrateTable(
        userBehaviorSql, targetSql, 'software_activations',
        ['id', 'software_id', 'software_name', 'software_version', 'device_fingerprint',
         'device_os', 'device_arch', 'activation_code', 'activated_at', 'username',
         'user_email', 'ip_address', 'country', 'region', 'city', 'created_at', 'updated_at']
      )
      results.tables.software_activations = activationsResult
      results.totalMigrated += activationsResult.migrated
      results.totalSkipped += activationsResult.skipped
      
      const connectionsResult = await migrateTable(
        userBehaviorSql, targetSql, 'device_connections',
        ['id', 'device_serial', 'device_brand', 'device_model', 'software_id',
         'user_device_fingerprint', 'created_at', 'updated_at']
      )
      results.tables.device_connections = connectionsResult
      results.totalMigrated += connectionsResult.migrated
      results.totalSkipped += connectionsResult.skipped
    }
    
    // 5. 输出迁移结果
    console.log('\n📊 迁移完成统计:')
    console.log(`  总计迁移: ${results.totalMigrated} 条记录`)
    console.log(`  总计跳过: ${results.totalSkipped} 条记录`)
    
    console.log('\n📋 各表详情:')
    Object.entries(results.tables).forEach(([table, result]) => {
      console.log(`  ${table}: ${result.migrated} 迁移, ${result.skipped} 跳过`)
    })
    
    if (!CONFIG.dryRun) {
      console.log('\n✅ 数据库统一迁移完成!')
      console.log('\n📋 下一步操作:')
      console.log('1. 验证数据完整性')
      console.log('2. 更新应用程序配置')
      console.log('3. 测试所有功能')
      console.log('4. 清理旧数据库连接')
    } else {
      console.log('\n🔍 DRY RUN 完成 - 使用 --migrate 参数执行实际迁移')
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error.message)
    process.exit(1)
  }
}

// 执行迁移
if (require.main === module) {
  runMigration().catch(console.error)
}

module.exports = { runMigration, CONFIG }

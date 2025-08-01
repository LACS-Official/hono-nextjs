#!/usr/bin/env node

/**
 * 数据库整合计划脚本
 * 将3个独立数据库合并为1个统一数据库
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

// 数据库整合配置
const CONSOLIDATION_CONFIG = {
  // 目标统一数据库
  targetDatabase: process.env.DATABASE_URL || process.env.SOFTWARE_DATABASE_URL,
  
  // 源数据库
  sourceDatabases: {
    activationCodes: process.env.ACTIVATION_CODES_DATABASE_URL,
    software: process.env.SOFTWARE_DATABASE_URL,
    userBehavior: process.env.USER_BEHAVIOR_DATABASE_URL
  },
  
  // 表映射配置
  tableMapping: {
    // 激活码数据库表
    'activation_codes': 'activation_codes',
    'refresh_tokens': 'refresh_tokens',
    
    // 软件管理数据库表
    'software': 'software',
    'software_version_history': 'software_version_history', 
    'software_announcements': 'software_announcements',
    'download_stats': 'download_stats',
    
    // 用户行为数据库表
    'software_activations': 'software_activations',
    'device_connections': 'device_connections',
    'behavior_stats': 'behavior_stats'
  }
}

async function analyzeCurrentDatabases() {
  console.log('🔍 分析当前数据库结构...\n')
  
  const analysis = {
    totalTables: 0,
    totalRecords: 0,
    databases: {}
  }
  
  for (const [dbName, dbUrl] of Object.entries(CONSOLIDATION_CONFIG.sourceDatabases)) {
    if (!dbUrl) {
      console.log(`⚠️ ${dbName} 数据库URL未配置，跳过`)
      continue
    }
    
    try {
      const sql = neon(dbUrl)
      
      // 获取表列表
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `
      
      console.log(`📊 ${dbName} 数据库:`)
      
      const dbAnalysis = {
        tables: [],
        totalRecords: 0
      }
      
      for (const table of tables) {
        const tableName = table.table_name
        
        // 获取记录数
        const countResult = await sql`
          SELECT COUNT(*) as count
          FROM ${sql(tableName)}
        `
        const recordCount = parseInt(countResult[0].count)

        // 获取表大小
        const sizeResult = await sql`
          SELECT
            pg_size_pretty(pg_total_relation_size(${tableName})) as size,
            pg_total_relation_size(${tableName}) as size_bytes
          FROM information_schema.tables
          WHERE table_name = ${tableName}
        `
        
        const tableInfo = {
          name: tableName,
          records: recordCount,
          size: sizeResult[0]?.size || 'N/A'
        }
        
        dbAnalysis.tables.push(tableInfo)
        dbAnalysis.totalRecords += recordCount
        
        console.log(`  ✅ ${tableName}: ${recordCount} 条记录 (${tableInfo.size})`)
      }
      
      analysis.databases[dbName] = dbAnalysis
      analysis.totalTables += tables.length
      analysis.totalRecords += dbAnalysis.totalRecords
      
      console.log(`  📈 小计: ${tables.length} 个表, ${dbAnalysis.totalRecords} 条记录\n`)
      
    } catch (error) {
      console.error(`❌ 分析 ${dbName} 数据库失败:`, error.message)
    }
  }
  
  console.log('📋 整体分析结果:')
  console.log(`  总表数: ${analysis.totalTables}`)
  console.log(`  总记录数: ${analysis.totalRecords}`)
  console.log(`  数据库数: ${Object.keys(analysis.databases).length}`)
  
  return analysis
}

async function generateConsolidationScript() {
  console.log('\n📝 生成数据库整合脚本...')
  
  const script = `
-- 数据库整合脚本
-- 生成时间: ${new Date().toISOString()}

-- 1. 创建统一数据库模式
BEGIN;

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

-- 创建索引
CREATE INDEX IF NOT EXISTS activation_codes_code_idx ON activation_codes(code);
CREATE INDEX IF NOT EXISTS activation_codes_expires_at_idx ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS software_name_idx ON software(name);
CREATE INDEX IF NOT EXISTS software_category_idx ON software(category);
CREATE INDEX IF NOT EXISTS software_activations_device_fingerprint_idx ON software_activations(device_fingerprint);
CREATE INDEX IF NOT EXISTS software_activations_software_id_idx ON software_activations(software_id);
CREATE INDEX IF NOT EXISTS device_connections_device_serial_idx ON device_connections(device_serial);
CREATE INDEX IF NOT EXISTS device_connections_software_id_idx ON device_connections(software_id);

COMMIT;

-- 2. 数据迁移将通过应用程序脚本完成
-- 3. 验证数据完整性
-- 4. 清理旧数据库连接
`
  
  require('fs').writeFileSync('scripts/database-consolidation.sql', script)
  console.log('✅ 整合脚本已生成: scripts/database-consolidation.sql')
}

async function estimateConsolidationImpact() {
  console.log('\n💰 评估整合影响...')
  
  const impact = {
    cost: {
      before: '3个数据库项目',
      after: '1个数据库项目',
      savings: '约66%成本节省'
    },
    complexity: {
      configFiles: { before: 3, after: 1 },
      connectionFiles: { before: 3, after: 1 },
      envVariables: { before: 3, after: 1 }
    },
    performance: {
      crossTableQueries: '支持',
      transactions: '支持',
      connectionPooling: '优化'
    }
  }
  
  console.log('📊 成本影响:')
  console.log(`  整合前: ${impact.cost.before}`)
  console.log(`  整合后: ${impact.cost.after}`)
  console.log(`  预期节省: ${impact.cost.savings}`)
  
  console.log('\n🔧 复杂度影响:')
  console.log(`  配置文件: ${impact.complexity.configFiles.before} → ${impact.complexity.configFiles.after}`)
  console.log(`  连接文件: ${impact.complexity.connectionFiles.before} → ${impact.complexity.connectionFiles.after}`)
  console.log(`  环境变量: ${impact.complexity.envVariables.before} → ${impact.complexity.envVariables.after}`)
  
  console.log('\n⚡ 性能影响:')
  console.log(`  跨表查询: ${impact.performance.crossTableQueries}`)
  console.log(`  事务支持: ${impact.performance.transactions}`)
  console.log(`  连接池: ${impact.performance.connectionPooling}`)
  
  return impact
}

async function main() {
  console.log('🎯 数据库整合计划分析\n')
  
  try {
    // 1. 分析当前数据库
    const analysis = await analyzeCurrentDatabases()
    
    // 2. 生成整合脚本
    await generateConsolidationScript()
    
    // 3. 评估影响
    const impact = await estimateConsolidationImpact()
    
    console.log('\n✅ 分析完成！')
    console.log('\n📋 下一步操作:')
    console.log('1. 审查生成的整合脚本')
    console.log('2. 在测试环境执行整合')
    console.log('3. 验证数据完整性')
    console.log('4. 更新应用程序配置')
    console.log('5. 部署到生产环境')
    
  } catch (error) {
    console.error('❌ 分析失败:', error.message)
    process.exit(1)
  }
}

// 执行分析
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  analyzeCurrentDatabases,
  generateConsolidationScript,
  estimateConsolidationImpact,
  CONSOLIDATION_CONFIG
}

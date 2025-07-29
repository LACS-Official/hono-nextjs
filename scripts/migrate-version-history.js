#!/usr/bin/env node

/**
 * 数据库迁移脚本 - 添加软件版本历史表
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 从环境变量获取数据库连接信息
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.SOFTWARE_DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 错误: 未找到 SOFTWARE_DATABASE_URL 环境变量');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 连接到数据库...');
    await client.connect();

    // 检查表是否已存在
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'software_version_history'
      );
    `;

    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('✅ 软件版本历史表已存在，跳过迁移');
      return;
    }

    console.log('📦 读取迁移文件...');
    const migrationPath = path.join(__dirname, '../drizzle/0004_add_version_history.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 执行迁移...');
    await client.query(migrationSQL);

    console.log('✅ 迁移成功完成！');
    console.log('📋 已创建表: software_version_history');

    // 插入一些示例数据（可选）
    const sampleDataQuery = `
      INSERT INTO software_version_history (software_id, version, release_date, release_notes, is_stable)
      SELECT 
        s.id,
        s.current_version,
        s.created_at,
        '初始版本',
        true
      FROM software s
      WHERE NOT EXISTS (
        SELECT 1 FROM software_version_history svh WHERE svh.software_id = s.id
      );
    `;

    const result = await client.query(sampleDataQuery);
    console.log(`📝 为 ${result.rowCount} 个软件添加了初始版本记录`);

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行迁移
runMigration().catch(console.error);

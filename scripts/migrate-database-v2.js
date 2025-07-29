#!/usr/bin/env node

/**
 * 软件管理系统数据库迁移脚本 V2
 * 将UUID主键迁移为自增整数ID，优化版本管理
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

    // 检查是否已经迁移
    const checkMigrationQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'software_v2'
      );
    `;

    const migrationExists = await client.query(checkMigrationQuery);
    
    if (migrationExists.rows[0].exists) {
      console.log('⚠️ 检测到已存在迁移表，请确认是否需要重新迁移');
      
      // 询问用户是否继续
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('是否继续迁移？这将覆盖现有的迁移表 (y/N): ', resolve);
      });
      
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ 迁移已取消');
        return;
      }

      // 清理现有迁移表
      console.log('🧹 清理现有迁移表...');
      await client.query('DROP TABLE IF EXISTS download_stats CASCADE;');
      await client.query('DROP TABLE IF EXISTS software_announcements_v2 CASCADE;');
      await client.query('DROP TABLE IF EXISTS software_version_history_v2 CASCADE;');
      await client.query('DROP TABLE IF EXISTS software_v2 CASCADE;');
    }

    console.log('📦 读取迁移文件...');
    const migrationPath = path.join(__dirname, 'migrate-to-v2.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 执行迁移...');
    await client.query(migrationSQL);

    console.log('✅ 迁移成功完成！');

    // 验证迁移结果
    console.log('🔍 验证迁移结果...');
    
    const verificationQuery = `
      SELECT 
        'software_v2' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software_v2
      UNION ALL
      SELECT 
        'software_version_history_v2' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software_version_history_v2
      UNION ALL
      SELECT 
        'software_announcements_v2' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software_announcements_v2;
    `;

    const result = await client.query(verificationQuery);
    
    console.log('\n📊 迁移结果统计:');
    console.table(result.rows);

    // 检查数据完整性
    const integrityCheck = await client.query(`
      SELECT 
        s.name,
        s.id as new_id,
        COUNT(svh.id) as version_count,
        COUNT(sa.id) as announcement_count
      FROM software_v2 s
      LEFT JOIN software_version_history_v2 svh ON svh.software_id = s.id
      LEFT JOIN software_announcements_v2 sa ON sa.software_id = s.id
      GROUP BY s.id, s.name
      ORDER BY s.id
      LIMIT 5;
    `);

    console.log('\n🔗 数据关联检查 (前5条):');
    console.table(integrityCheck.rows);

    console.log('\n✨ 迁移完成！下一步：');
    console.log('1. 验证应用程序功能正常');
    console.log('2. 运行 node scripts/finalize-migration-v2.js 完成迁移');
    console.log('3. 更新应用程序代码以使用新的schema');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行迁移
runMigration().catch(console.error);

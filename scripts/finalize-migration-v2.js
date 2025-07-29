#!/usr/bin/env node

/**
 * 完成数据库迁移脚本 V2
 * 重命名表并清理旧数据
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

async function finalizeMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 连接到数据库...');
    await client.connect();

    // 检查迁移表是否存在
    const checkTablesQuery = `
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_v2') as v2_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software') as original_exists;
    `;

    const tablesCheck = await client.query(checkTablesQuery);
    const { v2_exists, original_exists } = tablesCheck.rows[0];

    if (!v2_exists) {
      console.error('❌ 错误: 未找到迁移表 software_v2，请先运行迁移脚本');
      process.exit(1);
    }

    if (!original_exists) {
      console.error('❌ 错误: 未找到原始表 software，迁移可能已经完成');
      process.exit(1);
    }

    // 最后确认
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️ 警告: 此操作将：');
    console.log('1. 将原始表重命名为 _backup');
    console.log('2. 将新表重命名为正式表名');
    console.log('3. 删除迁移辅助字段');
    console.log('4. 此操作不可逆！');

    const answer = await new Promise(resolve => {
      rl.question('\n确认完成迁移？(yes/N): ', resolve);
    });
    
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消');
      return;
    }

    console.log('📦 读取完成迁移脚本...');
    const finalizePath = path.join(__dirname, 'finalize-migration-v2.sql');
    const finalizeSQL = fs.readFileSync(finalizePath, 'utf8');

    console.log('🚀 执行完成迁移...');
    await client.query(finalizeSQL);

    console.log('✅ 迁移完成！');

    // 最终验证
    console.log('🔍 最终验证...');
    
    const finalVerificationQuery = `
      SELECT 
        'software' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software
      UNION ALL
      SELECT 
        'software_version_history' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software_version_history
      UNION ALL
      SELECT 
        'software_announcements' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM software_announcements
      UNION ALL
      SELECT 
        'download_stats' as table_name,
        COUNT(*) as record_count,
        MIN(id) as min_id,
        MAX(id) as max_id
      FROM download_stats;
    `;

    const finalResult = await client.query(finalVerificationQuery);
    
    console.log('\n📊 最终表统计:');
    console.table(finalResult.rows);

    // 检查序列状态
    const sequenceCheck = await client.query(`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences 
      WHERE sequence_name LIKE '%_id_seq'
      ORDER BY sequence_name;
    `);

    console.log('\n🔢 序列状态:');
    console.table(sequenceCheck.rows);

    console.log('\n🎉 数据库迁移完全完成！');
    console.log('\n📋 后续步骤:');
    console.log('1. 更新应用程序代码以使用新的 schema');
    console.log('2. 测试所有功能确保正常工作');
    console.log('3. 可以安全删除备份表 (*_backup)');
    console.log('4. 更新 API 文档以反映新的 ID 格式');

  } catch (error) {
    console.error('❌ 完成迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 数据库连接已关闭');
  }
}

// 运行完成迁移
finalizeMigration().catch(console.error);

#!/usr/bin/env node

/**
 * 数据库迁移脚本
 * 运行数据库迁移到新的自增ID结构
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function runMigration() {
  console.log('🔄 开始数据库迁移...\n')

  const databaseUrl = process.env.SOFTWARE_DATABASE_URL
  if (!databaseUrl) {
    console.error('❌ SOFTWARE_DATABASE_URL 环境变量未设置')
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // 检查是否已经迁移过
    try {
      const newTableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'software_new'
      `
      
      if (newTableCheck.length > 0) {
        console.log('⚠️ 检测到 software_new 表已存在，可能已经迁移过')
        console.log('继续执行迁移...')
      }
    } catch (error) {
      // 忽略错误，继续迁移
    }

    console.log('📋 步骤 1: 创建新的软件表（使用自增ID）...')
    await sql`
      CREATE TABLE IF NOT EXISTS "software_new" (
        "id" serial PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "name_en" varchar(255),
        "description" text,
        "description_en" text,
        "current_version" varchar(50) NOT NULL,
        "official_website" text,
        "category" varchar(100),
        "tags" jsonb,
        "system_requirements" jsonb,
        "is_active" boolean DEFAULT true NOT NULL,
        "sort_order" integer DEFAULT 0,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "software_new_name_unique" UNIQUE("name")
      )
    `
    console.log('✅ 新软件表创建成功')

    console.log('📋 步骤 2: 创建版本历史表...')
    await sql`
      CREATE TABLE IF NOT EXISTS "software_version_history_new" (
        "id" serial PRIMARY KEY,
        "software_id" integer NOT NULL,
        "version" varchar(50) NOT NULL,
        "release_date" timestamp with time zone NOT NULL,
        "release_notes" text,
        "release_notes_en" text,
        "download_links" jsonb,
        "file_size" varchar(50),
        "file_size_bytes" integer,
        "file_hash" varchar(128),
        "is_stable" boolean DEFAULT true NOT NULL,
        "is_beta" boolean DEFAULT false NOT NULL,
        "is_prerelease" boolean DEFAULT false NOT NULL,
        "version_type" varchar(20) DEFAULT 'release' NOT NULL,
        "changelog_category" jsonb,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `
    console.log('✅ 版本历史表创建成功')

    console.log('📋 步骤 3: 创建软件公告表...')
    await sql`
      CREATE TABLE IF NOT EXISTS "software_announcements_new" (
        "id" serial PRIMARY KEY,
        "software_id" integer NOT NULL,
        "title" varchar(500) NOT NULL,
        "title_en" varchar(500),
        "content" text NOT NULL,
        "content_en" text,
        "type" varchar(50) DEFAULT 'general' NOT NULL,
        "priority" varchar(20) DEFAULT 'normal' NOT NULL,
        "version" varchar(50),
        "is_published" boolean DEFAULT true NOT NULL,
        "published_at" timestamp with time zone DEFAULT now() NOT NULL,
        "expires_at" timestamp with time zone,
        "metadata" jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `
    console.log('✅ 软件公告表创建成功')

    console.log('📋 步骤 4: 创建下载统计表...')
    await sql`
      CREATE TABLE IF NOT EXISTS "download_stats" (
        "id" serial PRIMARY KEY,
        "software_id" integer NOT NULL,
        "version_id" integer,
        "download_source" varchar(50) NOT NULL,
        "download_count" integer DEFAULT 0 NOT NULL,
        "last_download_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `
    console.log('✅ 下载统计表创建成功')

    console.log('📋 步骤 5: 迁移现有数据...')
    // 检查旧表是否有数据
    try {
      const oldData = await sql`SELECT COUNT(*) as count FROM software`
      if (oldData[0].count > 0) {
        console.log(`发现 ${oldData[0].count} 条现有数据，开始迁移...`)
        
        // 迁移软件数据
        await sql`
          INSERT INTO software_new (
            name, name_en, description, description_en, current_version,
            official_website, category, tags, system_requirements,
            is_active, sort_order, metadata, created_at, updated_at
          )
          SELECT 
            name, name_en, description, description_en, current_version,
            official_website, category, tags, system_requirements,
            is_active, COALESCE(sort_order, 0), metadata, created_at, updated_at
          FROM software
          WHERE name NOT IN (SELECT name FROM software_new)
        `
        console.log('✅ 软件数据迁移完成')
      } else {
        console.log('⚠️ 旧表中没有数据，跳过数据迁移')
      }
    } catch (error) {
      console.log('⚠️ 旧表不存在或迁移失败，继续执行...')
    }

    console.log('📋 步骤 6: 替换旧表...')
    // 删除旧表并重命名新表
    await sql`DROP TABLE IF EXISTS software CASCADE`
    await sql`DROP TABLE IF EXISTS software_version_history CASCADE`
    await sql`DROP TABLE IF EXISTS software_announcements CASCADE`
    
    await sql`ALTER TABLE software_new RENAME TO software`
    await sql`ALTER TABLE software_version_history_new RENAME TO software_version_history`
    await sql`ALTER TABLE software_announcements_new RENAME TO software_announcements`
    console.log('✅ 表重命名完成')

    console.log('📋 步骤 7: 添加外键约束...')
    await sql`
      ALTER TABLE software_version_history 
      ADD CONSTRAINT software_version_history_software_id_fk 
      FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE
    `
    
    await sql`
      ALTER TABLE software_announcements 
      ADD CONSTRAINT software_announcements_software_id_fk 
      FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE
    `
    
    await sql`
      ALTER TABLE download_stats 
      ADD CONSTRAINT download_stats_software_id_fk 
      FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE
    `
    console.log('✅ 外键约束添加完成')

    console.log('📋 步骤 8: 创建索引...')
    await sql`CREATE INDEX IF NOT EXISTS software_name_idx ON software(name)`
    await sql`CREATE INDEX IF NOT EXISTS software_category_idx ON software(category)`
    await sql`CREATE INDEX IF NOT EXISTS software_is_active_idx ON software(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS software_version_history_software_id_idx ON software_version_history(software_id)`
    console.log('✅ 索引创建完成')

    console.log('\n🎉 数据库迁移完成!')
    console.log('\n📊 验证迁移结果...')
    
    const newStructure = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'software' 
      ORDER BY ordinal_position
    `
    
    console.log('新表结构:')
    newStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`)
    })

  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// 运行迁移
runMigration().catch(console.error)

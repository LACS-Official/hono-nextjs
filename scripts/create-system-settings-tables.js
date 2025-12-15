import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

// 系统设置数据库连接
const systemSettingsDbUrl = process.env.SYSTEM_SETTINGS_DATABASE_URL
if (!systemSettingsDbUrl) {
  throw new Error('SYSTEM_SETTINGS_DATABASE_URL 环境变量未设置')
}

const sql = neon(systemSettingsDbUrl)
const db = drizzle(sql)

async function createTables() {
  try {
    console.log('开始创建系统设置数据库表...')
    
    // 创建系统设置表
    await sql`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "category" varchar(100) NOT NULL,
        "key" varchar(255) NOT NULL,
        "value" text,
        "description" text,
        "type" varchar(50) DEFAULT 'string' NOT NULL,
        "is_secret" boolean DEFAULT false NOT NULL,
        "is_required" boolean DEFAULT false NOT NULL,
        "validation_rules" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "updated_by" varchar(255)
      )
    `
    
    // 创建系统设置审计日志表
    await sql`
      CREATE TABLE IF NOT EXISTS "system_settings_audit_log" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "setting_id" varchar(255) NOT NULL,
        "action" varchar(50) NOT NULL,
        "old_value" text,
        "new_value" text,
        "reason" text,
        "user_id" varchar(255) NOT NULL,
        "user_agent" text,
        "ip_address" varchar(45),
        "timestamp" timestamp DEFAULT now() NOT NULL
      )
    `
    
    // 创建API访问控制表
    await sql`
      CREATE TABLE IF NOT EXISTS "api_access_control" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "endpoint" varchar(255) NOT NULL,
        "method" varchar(10) NOT NULL,
        "requires_auth" boolean DEFAULT true NOT NULL,
        "allowed_roles" jsonb,
        "rate_limit" jsonb,
        "is_active" boolean DEFAULT true NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `
    
    // 创建系统备份配置表
    await sql`
      CREATE TABLE IF NOT EXISTS "system_backup_config" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL,
        "schedule" varchar(100) NOT NULL,
        "destination" varchar(500) NOT NULL,
        "compression" boolean DEFAULT true NOT NULL,
        "encryption" boolean DEFAULT false NOT NULL,
        "retention_count" integer DEFAULT 7 NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "last_backup_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `
    
    // 创建系统日志配置表
    await sql`
      CREATE TABLE IF NOT EXISTS "system_log_config" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "log_type" varchar(100) NOT NULL,
        "level" varchar(20) NOT NULL,
        "is_enabled" boolean DEFAULT true NOT NULL,
        "retention_days" integer DEFAULT 30 NOT NULL,
        "storage_location" varchar(255),
        "format" varchar(50) DEFAULT 'json' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `
    
    // 创建系统通知配置表
    await sql`
      CREATE TABLE IF NOT EXISTS "system_notification_config" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "name" varchar(255) NOT NULL,
        "type" varchar(50) NOT NULL,
        "trigger" varchar(100) NOT NULL,
        "config" jsonb NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `
    
    console.log('系统设置数据库表创建成功!')
  } catch (error) {
    console.error('创建系统设置数据库表失败:', error)
    process.exit(1)
  }
}

createTables()
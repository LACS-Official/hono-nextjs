-- 创建联系方式表
CREATE TABLE IF NOT EXISTS "contact_info" (
	"id" SERIAL PRIMARY KEY,
	"title" TEXT NOT NULL,
	"description" TEXT NOT NULL,
	"info" TEXT NOT NULL,
	"action" TEXT NOT NULL,
	"analytics_event" TEXT NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建群聊列表表
CREATE TABLE IF NOT EXISTS "group_chats" (
	"id" SERIAL PRIMARY KEY,
	"name" TEXT NOT NULL,
	"limit" TEXT NOT NULL,
	"group_number" TEXT NOT NULL,
	"qrcode" TEXT NOT NULL,
	"join_link" TEXT NOT NULL,
	"analytics_event" TEXT NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建媒体平台表
CREATE TABLE IF NOT EXISTS "media_platforms" (
	"id" TEXT PRIMARY KEY,
	"name" TEXT NOT NULL,
	"logo" TEXT NOT NULL,
	"account" TEXT NOT NULL,
	"account_id" TEXT NOT NULL,
	"qrcode" TEXT NOT NULL,
	"qrcode_title" TEXT NOT NULL,
	"qrcode_desc" TEXT NOT NULL,
	"link" TEXT NOT NULL,
	"analytics_event" TEXT NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建项目列表表
CREATE TABLE IF NOT EXISTS "projects_list" (
	"id" INTEGER PRIMARY KEY,
	"category" TEXT NOT NULL,
	"category_name" TEXT NOT NULL,
	"title" TEXT NOT NULL,
	"description" TEXT NOT NULL,
	"platform" TEXT NOT NULL,
	"update_date" TEXT NOT NULL,
	"link" TEXT NOT NULL,
	"icon" TEXT NOT NULL,
	"p_language" JSONB NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

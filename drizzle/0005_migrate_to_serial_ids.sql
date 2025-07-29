-- 软件管理系统数据库迁移脚本 V2
-- 将 UUID 改为自增整数ID，优化版本管理结构

-- 1. 创建新的软件表（使用自增ID）
CREATE TABLE "software_new" (
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
);

-- 2. 创建UUID到自增ID的映射表
CREATE TABLE "software_id_mapping" (
  "old_uuid" uuid NOT NULL,
  "new_id" serial PRIMARY KEY
);

-- 3. 迁移软件数据（如果旧表存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software') THEN
    -- 插入数据到映射表并获取新ID
    INSERT INTO "software_id_mapping" ("old_uuid")
    SELECT "id" FROM "software" ORDER BY "created_at";
    
    -- 迁移软件数据到新表
    INSERT INTO "software_new" (
      "name", "name_en", "description", "description_en", 
      "current_version", "official_website", "category", 
      "tags", "system_requirements", "is_active", 
      "sort_order", "metadata", "created_at", "updated_at"
    )
    SELECT 
      s."name", s."name_en", s."description", s."description_en",
      s."current_version", s."official_website", s."category",
      s."tags", s."system_requirements", s."is_active",
      COALESCE(s."sort_order", 0), s."metadata", s."created_at", s."updated_at"
    FROM "software" s
    JOIN "software_id_mapping" m ON s."id" = m."old_uuid"
    ORDER BY m."new_id";
  END IF;
END $$;

-- 4. 创建新的版本历史表
CREATE TABLE "software_version_history_new" (
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
);

-- 5. 迁移版本历史数据（如果旧表存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_version_history') THEN
    INSERT INTO "software_version_history_new" (
      "software_id", "version", "release_date", "release_notes", 
      "release_notes_en", "file_size", "is_stable", "is_beta", 
      "metadata", "created_at", "updated_at"
    )
    SELECT 
      m."new_id", vh."version", vh."release_date", vh."release_notes",
      vh."release_notes_en", vh."file_size", vh."is_stable", vh."is_beta",
      vh."metadata", vh."created_at", vh."updated_at"
    FROM "software_version_history" vh
    JOIN "software_id_mapping" m ON vh."software_id" = m."old_uuid"
    ORDER BY vh."created_at";
  END IF;
END $$;

-- 6. 创建新的软件公告表
CREATE TABLE "software_announcements_new" (
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
);

-- 7. 迁移公告数据（如果旧表存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_announcements') THEN
    INSERT INTO "software_announcements_new" (
      "software_id", "title", "title_en", "content", "content_en",
      "type", "priority", "version", "is_published", "published_at",
      "expires_at", "metadata", "created_at", "updated_at"
    )
    SELECT 
      m."new_id", sa."title", sa."title_en", sa."content", sa."content_en",
      sa."type", sa."priority", sa."version", sa."is_published", sa."published_at",
      sa."expires_at", sa."metadata", sa."created_at", sa."updated_at"
    FROM "software_announcements" sa
    JOIN "software_id_mapping" m ON sa."software_id" = m."old_uuid"
    ORDER BY sa."created_at";
  END IF;
END $$;

-- 8. 创建下载统计表
CREATE TABLE "download_stats" (
  "id" serial PRIMARY KEY,
  "software_id" integer NOT NULL,
  "version_id" integer,
  "download_source" varchar(50) NOT NULL,
  "download_count" integer DEFAULT 0 NOT NULL,
  "last_download_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 9. 删除旧表并重命名新表
DO $$
BEGIN
  -- 删除旧表（如果存在）
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_announcements') THEN
    DROP TABLE "software_announcements" CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software_version_history') THEN
    DROP TABLE "software_version_history" CASCADE;
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'software') THEN
    DROP TABLE "software" CASCADE;
  END IF;

  -- 重命名新表
  ALTER TABLE "software_new" RENAME TO "software";
  ALTER TABLE "software_version_history_new" RENAME TO "software_version_history";
  ALTER TABLE "software_announcements_new" RENAME TO "software_announcements";
END $$;

-- 10. 添加外键约束
ALTER TABLE "software_version_history"
ADD CONSTRAINT "software_version_history_software_id_software_id_fk"
FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "software_announcements"
ADD CONSTRAINT "software_announcements_software_id_software_id_fk"
FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "download_stats"
ADD CONSTRAINT "download_stats_software_id_software_id_fk"
FOREIGN KEY ("software_id") REFERENCES "public"."software"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "download_stats"
ADD CONSTRAINT "download_stats_version_id_software_version_history_id_fk"
FOREIGN KEY ("version_id") REFERENCES "public"."software_version_history"("id") ON DELETE cascade ON UPDATE no action;

-- 11. 创建索引
CREATE INDEX "software_name_idx" ON "software" USING btree ("name");
CREATE INDEX "software_category_idx" ON "software" USING btree ("category");
CREATE INDEX "software_is_active_idx" ON "software" USING btree ("is_active");

CREATE INDEX "software_version_history_software_id_idx" ON "software_version_history" USING btree ("software_id");
CREATE INDEX "software_version_history_version_idx" ON "software_version_history" USING btree ("version");
CREATE INDEX "software_version_history_release_date_idx" ON "software_version_history" USING btree ("release_date");

CREATE INDEX "software_announcements_software_id_idx" ON "software_announcements" USING btree ("software_id");
CREATE INDEX "software_announcements_is_published_idx" ON "software_announcements" USING btree ("is_published");

CREATE INDEX "download_stats_software_id_idx" ON "download_stats" USING btree ("software_id");
CREATE INDEX "download_stats_version_id_idx" ON "download_stats" USING btree ("version_id");
CREATE INDEX "download_stats_download_source_idx" ON "download_stats" USING btree ("download_source");

-- 12. 清理映射表
DROP TABLE IF EXISTS "software_id_mapping";

-- 13. 更新序列起始值（确保从1开始）
SELECT setval('software_id_seq', COALESCE((SELECT MAX(id) FROM software), 0) + 1, false);
SELECT setval('software_version_history_id_seq', COALESCE((SELECT MAX(id) FROM software_version_history), 0) + 1, false);
SELECT setval('software_announcements_id_seq', COALESCE((SELECT MAX(id) FROM software_announcements), 0) + 1, false);
SELECT setval('download_stats_id_seq', COALESCE((SELECT MAX(id) FROM download_stats), 0) + 1, false);

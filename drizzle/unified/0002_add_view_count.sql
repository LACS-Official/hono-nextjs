-- 添加软件访问量统计字段
-- 迁移脚本：为 software 表添加 view_count 字段

-- 添加 view_count 字段，默认值为 0
ALTER TABLE "software" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;

-- 为现有记录设置默认访问量为 0（如果有数据的话）
UPDATE "software" SET "view_count" = 0 WHERE "view_count" IS NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN "software"."view_count" IS '软件访问量统计，记录软件详情页面的访问次数';

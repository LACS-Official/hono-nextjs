-- 添加软件启动文件名和文件类型字段
-- 迁移脚本 V6: 为软件表添加 openname 和 filetype 字段

-- 添加 openname 字段（软件启动文件名或命令）
ALTER TABLE "software" ADD COLUMN "openname" varchar(255);

-- 添加 filetype 字段（软件包文件格式类型）
ALTER TABLE "software" ADD COLUMN "filetype" varchar(50);

-- 添加字段注释
COMMENT ON COLUMN "software"."openname" IS '软件启动文件名或命令，例如：bypass/bypass.cmd, main.exe, start.sh';
COMMENT ON COLUMN "software"."filetype" IS '软件包文件格式类型，例如：7z, zip, apk, exe, dmg';

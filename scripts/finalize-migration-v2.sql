-- 完成迁移：重命名表并清理旧数据
-- 注意：此脚本应在确认迁移成功后执行

BEGIN;

-- 1. 备份旧表（重命名为_backup）
ALTER TABLE software RENAME TO software_backup;
ALTER TABLE software_version_history RENAME TO software_version_history_backup;
ALTER TABLE software_announcements RENAME TO software_announcements_backup;

-- 2. 将新表重命名为正式表名
ALTER TABLE software_v2 RENAME TO software;
ALTER TABLE software_version_history_v2 RENAME TO software_version_history;
ALTER TABLE software_announcements_v2 RENAME TO software_announcements;

-- 3. 重命名约束和索引
-- 软件表
ALTER INDEX software_v2_pkey RENAME TO software_pkey;
ALTER INDEX software_v2_name_key RENAME TO software_name_key;
ALTER INDEX idx_software_v2_name RENAME TO idx_software_name;
ALTER INDEX idx_software_v2_category RENAME TO idx_software_category;
ALTER INDEX idx_software_v2_is_active RENAME TO idx_software_is_active;

-- 版本历史表
ALTER INDEX software_version_history_v2_pkey RENAME TO software_version_history_pkey;
ALTER INDEX idx_version_history_v2_software_id RENAME TO idx_version_history_software_id;
ALTER INDEX idx_version_history_v2_version RENAME TO idx_version_history_version;
ALTER INDEX idx_version_history_v2_release_date RENAME TO idx_version_history_release_date;

-- 公告表
ALTER INDEX software_announcements_v2_pkey RENAME TO software_announcements_pkey;
ALTER INDEX idx_announcements_v2_software_id RENAME TO idx_announcements_software_id;
ALTER INDEX idx_announcements_v2_published_at RENAME TO idx_announcements_published_at;

-- 4. 重命名外键约束
ALTER TABLE software_version_history 
RENAME CONSTRAINT fk_software_version_history_software 
TO software_version_history_software_id_software_id_fk;

ALTER TABLE software_announcements 
RENAME CONSTRAINT fk_software_announcements_software 
TO software_announcements_software_id_software_id_fk;

-- 5. 移除迁移辅助字段
ALTER TABLE software DROP COLUMN IF EXISTS old_uuid;
ALTER TABLE software_version_history DROP COLUMN IF EXISTS old_uuid;
ALTER TABLE software_version_history DROP COLUMN IF EXISTS old_software_uuid;
ALTER TABLE software_announcements DROP COLUMN IF EXISTS old_uuid;
ALTER TABLE software_announcements DROP COLUMN IF EXISTS old_software_uuid;

-- 6. 更新序列起始值（确保从正确的数字开始）
SELECT setval('software_id_seq', (SELECT MAX(id) FROM software));
SELECT setval('software_version_history_id_seq', (SELECT MAX(id) FROM software_version_history));
SELECT setval('software_announcements_id_seq', (SELECT MAX(id) FROM software_announcements));
SELECT setval('download_stats_id_seq', 1);

COMMIT;

-- 验证迁移结果
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

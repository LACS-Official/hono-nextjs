-- 软件管理系统数据库迁移脚本 V2
-- 将UUID主键迁移为自增整数ID，优化版本管理

-- 开始事务
BEGIN;

-- 1. 创建新的软件表（使用自增ID）
CREATE TABLE software_v2 (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    name_en VARCHAR(255),
    description TEXT,
    description_en TEXT,
    current_version VARCHAR(50) NOT NULL,
    official_website TEXT,
    category VARCHAR(100),
    tags JSONB,
    system_requirements JSONB,
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- 保留原UUID用于迁移映射
    old_uuid UUID
);

-- 2. 创建新的版本历史表（增强功能）
CREATE TABLE software_version_history_v2 (
    id SERIAL PRIMARY KEY,
    software_id INTEGER NOT NULL,
    version VARCHAR(50) NOT NULL,
    release_date TIMESTAMP WITH TIME ZONE NOT NULL,
    release_notes TEXT,
    release_notes_en TEXT,
    download_links JSONB,
    file_size VARCHAR(50),
    file_size_bytes INTEGER,
    file_hash VARCHAR(128),
    is_stable BOOLEAN DEFAULT true NOT NULL,
    is_beta BOOLEAN DEFAULT false NOT NULL,
    is_prerelease BOOLEAN DEFAULT false NOT NULL,
    version_type VARCHAR(20) DEFAULT 'release' NOT NULL,
    changelog_category JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- 保留原UUID用于迁移映射
    old_uuid UUID,
    old_software_uuid UUID
);

-- 3. 创建新的公告表
CREATE TABLE software_announcements_v2 (
    id SERIAL PRIMARY KEY,
    software_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    title_en VARCHAR(500),
    content TEXT NOT NULL,
    content_en TEXT,
    type VARCHAR(50) DEFAULT 'general' NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
    version VARCHAR(50),
    is_published BOOLEAN DEFAULT true NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    -- 保留原UUID用于迁移映射
    old_uuid UUID,
    old_software_uuid UUID
);

-- 4. 创建下载统计表
CREATE TABLE download_stats (
    id SERIAL PRIMARY KEY,
    software_id INTEGER NOT NULL,
    version_id INTEGER,
    download_source VARCHAR(50) NOT NULL,
    download_count INTEGER DEFAULT 0 NOT NULL,
    last_download_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. 迁移软件数据
INSERT INTO software_v2 (
    name, name_en, description, description_en, current_version,
    official_website, category, tags, system_requirements,
    is_active, sort_order, metadata, created_at, updated_at, old_uuid
)
SELECT 
    name, name_en, description, description_en, current_version,
    official_website, category, tags, system_requirements,
    is_active, sort_order, metadata, created_at, updated_at, id
FROM software
ORDER BY created_at; -- 保持创建顺序

-- 6. 迁移版本历史数据
INSERT INTO software_version_history_v2 (
    software_id, version, release_date, release_notes, release_notes_en,
    download_links, file_size, is_stable, is_beta, metadata,
    created_at, updated_at, old_uuid, old_software_uuid
)
SELECT 
    s2.id, -- 新的软件ID
    svh.version,
    svh.release_date,
    svh.release_notes,
    svh.release_notes_en,
    -- 转换下载链接格式
    CASE 
        WHEN svh.download_url IS NOT NULL THEN 
            jsonb_build_object('official', svh.download_url)
        ELSE NULL
    END,
    svh.file_size,
    svh.is_stable,
    svh.is_beta,
    svh.metadata,
    svh.created_at,
    svh.updated_at,
    svh.id,
    svh.software_id
FROM software_version_history svh
JOIN software_v2 s2 ON s2.old_uuid = svh.software_id
ORDER BY svh.release_date;

-- 7. 迁移公告数据
INSERT INTO software_announcements_v2 (
    software_id, title, title_en, content, content_en, type, priority,
    version, is_published, published_at, expires_at, metadata,
    created_at, updated_at, old_uuid, old_software_uuid
)
SELECT 
    s2.id, -- 新的软件ID
    sa.title, sa.title_en, sa.content, sa.content_en, sa.type, sa.priority,
    sa.version, sa.is_published, sa.published_at, sa.expires_at, sa.metadata,
    sa.created_at, sa.updated_at, sa.id, sa.software_id
FROM software_announcements sa
JOIN software_v2 s2 ON s2.old_uuid = sa.software_id
ORDER BY sa.created_at;

-- 8. 添加外键约束
ALTER TABLE software_version_history_v2 
ADD CONSTRAINT fk_software_version_history_software 
FOREIGN KEY (software_id) REFERENCES software_v2(id) ON DELETE CASCADE;

ALTER TABLE software_announcements_v2 
ADD CONSTRAINT fk_software_announcements_software 
FOREIGN KEY (software_id) REFERENCES software_v2(id) ON DELETE CASCADE;

ALTER TABLE download_stats 
ADD CONSTRAINT fk_download_stats_software 
FOREIGN KEY (software_id) REFERENCES software_v2(id) ON DELETE CASCADE;

ALTER TABLE download_stats 
ADD CONSTRAINT fk_download_stats_version 
FOREIGN KEY (version_id) REFERENCES software_version_history_v2(id) ON DELETE CASCADE;

-- 9. 创建索引
CREATE INDEX idx_software_v2_name ON software_v2(name);
CREATE INDEX idx_software_v2_category ON software_v2(category);
CREATE INDEX idx_software_v2_is_active ON software_v2(is_active);

CREATE INDEX idx_version_history_v2_software_id ON software_version_history_v2(software_id);
CREATE INDEX idx_version_history_v2_version ON software_version_history_v2(version);
CREATE INDEX idx_version_history_v2_release_date ON software_version_history_v2(release_date);

CREATE INDEX idx_announcements_v2_software_id ON software_announcements_v2(software_id);
CREATE INDEX idx_announcements_v2_published_at ON software_announcements_v2(published_at);

CREATE INDEX idx_download_stats_software_id ON download_stats(software_id);
CREATE INDEX idx_download_stats_version_id ON download_stats(version_id);

-- 提交事务
COMMIT;

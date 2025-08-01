
-- 数据库整合脚本
-- 生成时间: 2025-08-01T09:04:13.226Z

-- 1. 创建统一数据库模式
BEGIN;

-- 激活码相关表
CREATE TABLE IF NOT EXISTS activation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  is_used boolean DEFAULT false NOT NULL,
  used_at timestamp with time zone,
  used_by uuid,
  metadata jsonb,
  product_info jsonb
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_revoked boolean DEFAULT false NOT NULL,
  device_info jsonb
);

-- 软件管理相关表
CREATE TABLE IF NOT EXISTS software (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL UNIQUE,
  name_en varchar(255),
  description text,
  description_en text,
  current_version varchar(50) NOT NULL,
  official_website text,
  category varchar(100),
  tags jsonb,
  system_requirements jsonb,
  is_active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS software_version_history (
  id serial PRIMARY KEY,
  software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  version varchar(50) NOT NULL,
  release_date timestamp with time zone NOT NULL,
  release_notes text,
  release_notes_en text,
  download_links jsonb,
  file_size bigint,
  file_hash varchar(128),
  is_beta boolean DEFAULT false,
  is_active boolean DEFAULT true NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS software_announcements (
  id serial PRIMARY KEY,
  software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  title_en varchar(255),
  content text NOT NULL,
  content_en text,
  announcement_type varchar(50) DEFAULT 'info',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true NOT NULL,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS download_stats (
  id serial PRIMARY KEY,
  software_id integer NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  version varchar(50) NOT NULL,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamp with time zone,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 用户行为统计相关表
CREATE TABLE IF NOT EXISTS software_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id integer NOT NULL,
  software_name text NOT NULL DEFAULT '玩机管家',
  software_version text,
  device_fingerprint text NOT NULL,
  device_os text,
  device_arch text,
  activation_code text,
  activated_at timestamp with time zone NOT NULL DEFAULT now(),
  username text,
  user_email text,
  ip_address text,
  country text,
  region text,
  city text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_serial text NOT NULL,
  device_brand text,
  device_model text,
  software_id integer NOT NULL,
  user_device_fingerprint text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS activation_codes_code_idx ON activation_codes(code);
CREATE INDEX IF NOT EXISTS activation_codes_expires_at_idx ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS software_name_idx ON software(name);
CREATE INDEX IF NOT EXISTS software_category_idx ON software(category);
CREATE INDEX IF NOT EXISTS software_activations_device_fingerprint_idx ON software_activations(device_fingerprint);
CREATE INDEX IF NOT EXISTS software_activations_software_id_idx ON software_activations(software_id);
CREATE INDEX IF NOT EXISTS device_connections_device_serial_idx ON device_connections(device_serial);
CREATE INDEX IF NOT EXISTS device_connections_software_id_idx ON device_connections(software_id);

COMMIT;

-- 2. 数据迁移将通过应用程序脚本完成
-- 3. 验证数据完整性
-- 4. 清理旧数据库连接

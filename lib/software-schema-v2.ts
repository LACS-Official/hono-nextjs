// 软件管理数据库模式定义 V2 - 优化版本
import { pgTable, text, timestamp, boolean, jsonb, varchar, integer, serial } from 'drizzle-orm/pg-core'

// 软件信息表 - 使用自增ID
export const software = pgTable('software', {
  id: serial('id').primaryKey(), // 改为自增整数ID
  name: varchar('name', { length: 255 }).notNull().unique(), // 软件名称
  nameEn: varchar('name_en', { length: 255 }), // 英文名称
  description: text('description'), // 软件简介
  descriptionEn: text('description_en'), // 英文简介
  currentVersion: varchar('current_version', { length: 50 }).notNull(), // 当前版本
  // 移除 latestVersion 字段，改为自动计算
  officialWebsite: text('official_website'), // 官方网站
  category: varchar('category', { length: 100 }), // 软件分类
  tags: jsonb('tags'), // 标签数组
  systemRequirements: jsonb('system_requirements'), // 系统要求
  isActive: boolean('is_active').default(true).notNull(), // 是否启用
  sortOrder: integer('sort_order').default(0), // 排序顺序
  metadata: jsonb('metadata'), // 额外元数据
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件版本历史表 - 增强版本管理
export const softwareVersionHistory = pgTable('software_version_history', {
  id: serial('id').primaryKey(), // 改为自增整数ID
  softwareId: integer('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 50 }).notNull(),
  releaseDate: timestamp('release_date', { withTimezone: true }).notNull(),
  releaseNotes: text('release_notes'), // 中文更新日志
  releaseNotesEn: text('release_notes_en'), // 英文更新日志
  
  // 多下载源支持
  downloadLinks: jsonb('download_links').$type<{
    official?: string;      // 官方下载链接
    quark?: string;        // 夸克网盘链接
    pan123?: string;       // 123网盘链接
    baidu?: string;        // 百度网盘链接
    thunder?: string;      // 迅雷下载链接
    backup?: string[];     // 其他备用链接
  }>(),
  
  fileSize: varchar('file_size', { length: 50 }),
  fileSizeBytes: integer('file_size_bytes'), // 文件大小（字节）
  fileHash: varchar('file_hash', { length: 128 }), // 文件哈希值
  
  isStable: boolean('is_stable').default(true).notNull(),
  isBeta: boolean('is_beta').default(false).notNull(),
  isPrerelease: boolean('is_prerelease').default(false).notNull(),
  
  // 版本标签和分类
  versionType: varchar('version_type', { length: 20 }).default('release').notNull(), // release, beta, alpha, rc
  changelogCategory: jsonb('changelog_category').$type<string[]>(), // 更新类型：feature, bugfix, security, performance
  
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件公告表 - 使用自增ID
export const softwareAnnouncements = pgTable('software_announcements', {
  id: serial('id').primaryKey(), // 改为自增整数ID
  softwareId: integer('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(), // 公告标题
  titleEn: varchar('title_en', { length: 500 }), // 英文标题
  content: text('content').notNull(), // 公告内容
  contentEn: text('content_en'), // 英文内容
  type: varchar('type', { length: 50 }).default('general').notNull(), // 公告类型
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 优先级
  version: varchar('version', { length: 50 }), // 相关版本
  isPublished: boolean('is_published').default(true).notNull(), // 是否发布
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // 过期时间
  metadata: jsonb('metadata'), // 额外元数据
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 下载统计表 - 新增
export const downloadStats = pgTable('download_stats', {
  id: serial('id').primaryKey(),
  softwareId: integer('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  versionId: integer('version_id').references(() => softwareVersionHistory.id, { onDelete: 'cascade' }),
  downloadSource: varchar('download_source', { length: 50 }).notNull(), // official, quark, pan123, baidu, thunder
  downloadCount: integer('download_count').default(0).notNull(),
  lastDownloadAt: timestamp('last_download_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件信息类型定义
export type Software = typeof software.$inferSelect
export type NewSoftware = typeof software.$inferInsert

// 软件版本历史类型定义
export type SoftwareVersionHistory = typeof softwareVersionHistory.$inferSelect
export type NewSoftwareVersionHistory = typeof softwareVersionHistory.$inferInsert

// 软件公告类型定义
export type SoftwareAnnouncement = typeof softwareAnnouncements.$inferSelect
export type NewSoftwareAnnouncement = typeof softwareAnnouncements.$inferInsert

// 下载统计类型定义
export type DownloadStats = typeof downloadStats.$inferSelect
export type NewDownloadStats = typeof downloadStats.$inferInsert

// 下载链接类型定义
export interface DownloadLinks {
  official?: string;
  quark?: string;
  pan123?: string;
  baidu?: string;
  thunder?: string;
  backup?: string[];
}

// 版本信息扩展类型
export interface VersionWithStats extends SoftwareVersionHistory {
  downloadStats?: DownloadStats[];
  isLatest?: boolean;
}

// 软件信息扩展类型
export interface SoftwareWithVersions extends Software {
  versions?: VersionWithStats[];
  latestVersion?: string;
  totalDownloads?: number;
}

// 软件管理数据库模式定义
import { pgTable, text, timestamp, boolean, jsonb, uuid, varchar, integer } from 'drizzle-orm/pg-core'

// 软件信息表
export const software = pgTable('software', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(), // 软件名称
  nameEn: varchar('name_en', { length: 255 }), // 英文名称
  description: text('description'), // 软件简介
  descriptionEn: text('description_en'), // 英文简介
  currentVersion: varchar('current_version', { length: 50 }).notNull(), // 当前版本
  latestVersion: varchar('latest_version', { length: 50 }).notNull(), // 最新可用版本
  downloadUrl: text('download_url'), // 下载链接
  downloadUrlBackup: text('download_url_backup'), // 备用下载链接
  officialWebsite: text('official_website'), // 官方网站
  category: varchar('category', { length: 100 }), // 软件分类
  tags: jsonb('tags'), // 标签数组
  systemRequirements: jsonb('system_requirements'), // 系统要求
  fileSize: varchar('file_size', { length: 50 }), // 文件大小
  isActive: boolean('is_active').default(true).notNull(), // 是否启用
  sortOrder: integer('sort_order').default(0), // 排序顺序
  metadata: jsonb('metadata'), // 额外元数据
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件公告表
export const softwareAnnouncements = pgTable('software_announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  softwareId: uuid('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(), // 公告标题
  titleEn: varchar('title_en', { length: 500 }), // 英文标题
  content: text('content').notNull(), // 公告内容
  contentEn: text('content_en'), // 英文内容
  type: varchar('type', { length: 50 }).default('general').notNull(), // 公告类型: general, update, security, maintenance
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // 优先级: low, normal, high, urgent
  version: varchar('version', { length: 50 }), // 相关版本
  isPublished: boolean('is_published').default(true).notNull(), // 是否发布
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }), // 过期时间
  metadata: jsonb('metadata'), // 额外元数据
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件版本历史表
export const softwareVersionHistory = pgTable('software_version_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  softwareId: uuid('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  version: varchar('version', { length: 50 }).notNull(),
  releaseDate: timestamp('release_date', { withTimezone: true }).notNull(),
  releaseNotes: text('release_notes'),
  releaseNotesEn: text('release_notes_en'),
  downloadUrl: text('download_url'),
  fileSize: varchar('file_size', { length: 50 }),
  isStable: boolean('is_stable').default(true).notNull(),
  isBeta: boolean('is_beta').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 软件信息类型定义
export type Software = typeof software.$inferSelect
export type NewSoftware = typeof software.$inferInsert

// 软件公告类型定义
export type SoftwareAnnouncement = typeof softwareAnnouncements.$inferSelect
export type NewSoftwareAnnouncement = typeof softwareAnnouncements.$inferInsert

// 软件版本历史类型定义
export type SoftwareVersionHistory = typeof softwareVersionHistory.$inferSelect
export type NewSoftwareVersionHistory = typeof softwareVersionHistory.$inferInsert

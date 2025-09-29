import { pgTable, text, integer, serial, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 联系方式表
export const contactInfo = pgTable('contact_info', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  info: text('info').notNull(),
  action: text('action').notNull(),
  analyticsEvent: text('analytics_event').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// 群聊列表表
export const groupChats = pgTable('group_chats', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  limit: text('limit').notNull(),
  groupNumber: text('group_number').notNull(),
  qrcode: text('qrcode').notNull(),
  joinLink: text('join_link').notNull(),
  analyticsEvent: text('analytics_event').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// 媒体平台表
export const mediaPlatforms = pgTable('media_platforms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logo: text('logo').notNull(),
  account: text('account').notNull(),
  accountId: text('account_id').notNull(),
  qrcode: text('qrcode').notNull(),
  qrcodeTitle: text('qrcode_title').notNull(),
  qrcodeDesc: text('qrcode_desc').notNull(),
  link: text('link').notNull(),
  analyticsEvent: text('analytics_event').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// 项目列表表
export const projectsList = pgTable('projects_list', {
  id: integer('id').primaryKey(),
  category: text('category').notNull(),
  categoryName: text('category_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  platform: text('platform').notNull(),
  updateDate: text('update_date').notNull(),
  link: text('link').notNull(),
  icon: text('icon').notNull(),
  pLanguage: jsonb('p_language').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// 关于我们信息表
export const aboutUsInfo = pgTable('about_us_info', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // 分类：介绍、团队、历史、愿景等
  displayOrder: integer('display_order').default(0), // 显示顺序
  isPublished: integer('is_published').default(1), // 是否发布：1-是，0-否
  metadata: jsonb('metadata').$type<Record<string, any>>(), // 额外的元数据
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// TypeScript 类型定义
export type ContactInfo = typeof contactInfo.$inferSelect;
export type NewContactInfo = typeof contactInfo.$inferInsert;

export type GroupChat = typeof groupChats.$inferSelect;
export type NewGroupChat = typeof groupChats.$inferInsert;

export type MediaPlatform = typeof mediaPlatforms.$inferSelect;
export type NewMediaPlatform = typeof mediaPlatforms.$inferInsert;

export type Project = typeof projectsList.$inferSelect;
export type NewProject = typeof projectsList.$inferInsert;

export type AboutUsInfo = typeof aboutUsInfo.$inferSelect;
export type NewAboutUsInfo = typeof aboutUsInfo.$inferInsert;

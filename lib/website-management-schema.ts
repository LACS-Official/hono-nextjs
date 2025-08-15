/**
 * 简化的网站管理数据库模式定义
 * 用于内容管理API服务，提供公告和轮播图管理功能
 */

import { pgTable, serial, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

// 网站信息表（简化版）
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // 网站名称
  domain: varchar('domain', { length: 255 }).notNull().unique(), // 网站域名

  // 网站状态
  isActive: boolean('is_active').default(true).notNull(), // 是否启用

  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 公告管理表
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),

  // 公告基本信息
  title: varchar('title', { length: 255 }).notNull(), // 公告标题
  content: text('content').notNull(), // 公告内容
  type: varchar('type', { length: 50 }).default('info'), // 公告类型: info, warning, error, success

  // 显示配置
  isSticky: boolean('is_sticky').default(false), // 是否置顶
  sortOrder: integer('sort_order').default(0), // 排序顺序

  // 显示条件
  startDate: timestamp('start_date', { withTimezone: true }), // 开始显示时间
  endDate: timestamp('end_date', { withTimezone: true }), // 结束显示时间

  // 状态
  isActive: boolean('is_active').default(true).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),

  // 统计信息
  viewCount: integer('view_count').default(0),

  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 轮播图/横幅管理表（简化版）
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),

  // 基本信息
  title: varchar('title', { length: 255 }).notNull(), // 横幅标题
  description: text('description'), // 描述

  // 图片信息
  imageUrl: text('image_url').notNull(), // 图片URL
  imageAlt: varchar('image_alt', { length: 255 }), // 图片alt文本

  // 链接信息
  linkUrl: text('link_url'), // 点击跳转链接
  linkTarget: varchar('link_target', { length: 20 }).default('_self'), // 链接打开方式 (_self, _blank)

  // 显示配置
  sortOrder: integer('sort_order').default(0), // 排序顺序

  // 状态
  isActive: boolean('is_active').default(true).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),

  // 统计信息
  viewCount: integer('view_count').default(0),
  clickCount: integer('click_count').default(0),

  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})



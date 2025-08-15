/**
 * 网站管理数据库模式定义
 * 用于管理多个网站的配置和内容
 */

import { pgTable, serial, varchar, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core'

// 网站信息表
export const websites = pgTable('websites', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // 网站名称
  domain: varchar('domain', { length: 255 }).notNull().unique(), // 网站域名
  title: varchar('title', { length: 500 }), // 网站标题
  description: text('description'), // 网站描述
  logo: text('logo'), // 网站Logo URL
  favicon: text('favicon'), // 网站图标 URL
  
  // 网站配置
  config: jsonb('config').$type<{
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      textColor?: string;
    };
    layout?: {
      headerStyle?: string;
      footerStyle?: string;
      sidebarEnabled?: boolean;
    };
    features?: {
      searchEnabled?: boolean;
      categoriesEnabled?: boolean;
      tagsEnabled?: boolean;
      commentsEnabled?: boolean;
    };
    seo?: {
      keywords?: string[];
      author?: string;
      robots?: string;
    };
    analytics?: {
      googleAnalyticsId?: string;
      baiduAnalyticsId?: string;
    };
  }>(),
  
  // 网站状态
  isActive: boolean('is_active').default(true).notNull(), // 是否启用
  isPublic: boolean('is_public').default(true).notNull(), // 是否公开
  
  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 轮播图/横幅管理表
export const banners = pgTable('banners', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),
  
  // 基本信息
  title: varchar('title', { length: 255 }).notNull(), // 横幅标题
  subtitle: varchar('subtitle', { length: 500 }), // 副标题
  description: text('description'), // 描述
  
  // 图片信息
  imageUrl: text('image_url').notNull(), // 图片URL
  imageAlt: varchar('image_alt', { length: 255 }), // 图片alt文本
  
  // 链接信息
  linkUrl: text('link_url'), // 点击跳转链接
  linkTarget: varchar('link_target', { length: 20 }).default('_self'), // 链接打开方式 (_self, _blank)
  
  // 显示配置
  position: varchar('position', { length: 50 }).default('main'), // 显示位置 (main, sidebar, footer)
  sortOrder: integer('sort_order').default(0), // 排序顺序
  
  // 样式配置
  style: jsonb('style').$type<{
    width?: string;
    height?: string;
    borderRadius?: string;
    shadow?: boolean;
    overlay?: {
      enabled?: boolean;
      color?: string;
      opacity?: number;
    };
    animation?: {
      type?: string; // fade, slide, zoom
      duration?: number;
    };
  }>(),
  
  // 显示条件
  displayConditions: jsonb('display_conditions').$type<{
    startDate?: string;
    endDate?: string;
    devices?: string[]; // desktop, mobile, tablet
    pages?: string[]; // 特定页面显示
    userTypes?: string[]; // guest, registered, premium
  }>(),
  
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

// 网站页面管理表
export const websitePages = pgTable('website_pages', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),
  
  // 页面基本信息
  title: varchar('title', { length: 255 }).notNull(), // 页面标题
  slug: varchar('slug', { length: 255 }).notNull(), // URL路径
  content: text('content'), // 页面内容
  excerpt: text('excerpt'), // 页面摘要
  
  // SEO信息
  metaTitle: varchar('meta_title', { length: 255 }), // SEO标题
  metaDescription: text('meta_description'), // SEO描述
  metaKeywords: varchar('meta_keywords', { length: 500 }), // SEO关键词
  
  // 页面配置
  template: varchar('template', { length: 100 }).default('default'), // 页面模板
  layout: varchar('layout', { length: 100 }).default('default'), // 页面布局
  
  // 状态
  status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
  isHomepage: boolean('is_homepage').default(false), // 是否为首页
  
  // 排序和层级
  parentId: integer('parent_id'), // 父页面ID
  sortOrder: integer('sort_order').default(0),
  
  // 时间戳
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 网站菜单管理表
export const websiteMenus = pgTable('website_menus', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),
  
  // 菜单信息
  name: varchar('name', { length: 255 }).notNull(), // 菜单名称
  label: varchar('label', { length: 255 }).notNull(), // 显示标签
  url: text('url'), // 链接地址
  icon: varchar('icon', { length: 100 }), // 图标
  
  // 层级结构
  parentId: integer('parent_id'), // 父菜单ID
  sortOrder: integer('sort_order').default(0), // 排序
  level: integer('level').default(0), // 菜单层级
  
  // 显示配置
  position: varchar('position', { length: 50 }).default('header'), // header, footer, sidebar
  target: varchar('target', { length: 20 }).default('_self'), // 链接打开方式
  
  // 权限和状态
  isActive: boolean('is_active').default(true).notNull(),
  requireAuth: boolean('require_auth').default(false), // 是否需要登录
  
  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 网站用户表（软件资源网站专用）
export const websiteUsers = pgTable('website_users', {
  id: serial('id').primaryKey(),
  websiteId: integer('website_id').notNull().references(() => websites.id, { onDelete: 'cascade' }),
  
  // 用户基本信息
  username: varchar('username', { length: 100 }).notNull(), // 用户名
  email: varchar('email', { length: 255 }).notNull(), // 邮箱
  passwordHash: text('password_hash').notNull(), // 密码哈希
  
  // 用户资料
  displayName: varchar('display_name', { length: 255 }), // 显示名称
  avatar: text('avatar'), // 头像URL
  bio: text('bio'), // 个人简介
  
  // 用户状态
  status: varchar('status', { length: 20 }).default('active'), // active, inactive, banned
  emailVerified: boolean('email_verified').default(false), // 邮箱是否验证
  
  // 用户权限
  role: varchar('role', { length: 50 }).default('user'), // user, moderator, admin
  permissions: jsonb('permissions').$type<string[]>(), // 权限列表
  
  // 统计信息
  loginCount: integer('login_count').default(0), // 登录次数
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }), // 最后登录时间
  lastLoginIp: varchar('last_login_ip', { length: 45 }), // 最后登录IP
  
  // 时间戳
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

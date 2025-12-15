/**
 * 系统设置面板数据库模式
 * 用于管理环境变量、API配置、权限控制等系统设置
 */

import { 
  pgTable, 
  text, 
  integer, 
  boolean, 
  timestamp, 
  jsonb,
  varchar,
  index,
  primaryKey
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// 系统设置表
export const systemSettings = pgTable('system_settings', {
  id: varchar('id', { length: 255 }).primaryKey(),
  category: varchar('category', { length: 100 }).notNull(), // 设置分类：env_vars, api_config, security, logging等
  key: varchar('key', { length: 255 }).notNull(), // 设置键名
  value: text('value'), // 设置值（可能包含敏感信息）
  description: text('description'), // 设置描述
  type: varchar('type', { length: 50 }).notNull().default('string'), // 数据类型：string, number, boolean, json
  isSecret: boolean('is_secret').notNull().default(false), // 是否为敏感信息
  isRequired: boolean('is_required').notNull().default(false), // 是否为必需项
  validationRules: jsonb('validation_rules'), // 验证规则（JSON格式）
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: varchar('updated_by', { length: 255 }), // 更新者ID
})

// 系统设置审计日志表
export const systemSettingsAuditLog = pgTable('system_settings_audit_log', {
  id: varchar('id', { length: 255 }).primaryKey(),
  settingId: varchar('setting_id', { length: 255 }).notNull(), // 关联的设置ID
  action: varchar('action', { length: 50 }).notNull(), // 操作类型：create, update, delete
  oldValue: text('old_value'), // 旧值
  newValue: text('new_value'), // 新值
  reason: text('reason'), // 修改原因
  userId: varchar('user_id', { length: 255 }).notNull(), // 操作用户ID
  userAgent: text('user_agent'), // 用户代理
  ipAddress: varchar('ip_address', { length: 45 }), // IP地址
  timestamp: timestamp('timestamp').notNull().defaultNow(),
})

// API访问控制表
export const apiAccessControl = pgTable('api_access_control', {
  id: varchar('id', { length: 255 }).primaryKey(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(), // API端点
  method: varchar('method', { length: 10 }).notNull(), // HTTP方法
  requiresAuth: boolean('requires_auth').notNull().default(true), // 是否需要认证
  allowedRoles: jsonb('allowed_roles'), // 允许的角色列表
  rateLimit: jsonb('rate_limit'), // 速率限制配置
  isActive: boolean('is_active').notNull().default(true), // 是否启用
  description: text('description'), // 描述
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 系统日志配置表
export const systemLogConfig = pgTable('system_log_config', {
  id: varchar('id', { length: 255 }).primaryKey(),
  logType: varchar('log_type', { length: 100 }).notNull(), // 日志类型：access, error, audit, system
  level: varchar('level', { length: 20 }).notNull(), // 日志级别：debug, info, warn, error
  isEnabled: boolean('is_enabled').notNull().default(true), // 是否启用
  retentionDays: integer('retention_days').notNull().default(30), // 保留天数
  storageLocation: varchar('storage_location', { length: 255 }), // 存储位置
  format: varchar('format', { length: 50 }).notNull().default('json'), // 日志格式
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 系统备份配置表
export const systemBackupConfig = pgTable('system_backup_config', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // 备份配置名称
  type: varchar('type', { length: 50 }).notNull(), // 备份类型：database, files, full
  schedule: varchar('schedule', { length: 100 }).notNull(), // 备份计划（cron表达式）
  destination: varchar('destination', { length: 500 }).notNull(), // 备份目标位置
  compression: boolean('compression').notNull().default(true), // 是否压缩
  encryption: boolean('encryption').notNull().default(false), // 是否加密
  retentionCount: integer('retention_count').notNull().default(7), // 保留备份数量
  isActive: boolean('is_active').notNull().default(true), // 是否启用
  lastBackupAt: timestamp('last_backup_at'), // 最后备份时间
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 系统通知配置表
export const systemNotificationConfig = pgTable('system_notification_config', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // 通知配置名称
  type: varchar('type', { length: 50 }).notNull(), // 通知类型：email, webhook, sms
  trigger: varchar('trigger', { length: 100 }).notNull(), // 触发条件
  config: jsonb('config').notNull(), // 通知配置（JSON格式）
  isActive: boolean('is_active').notNull().default(true), // 是否启用
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// 定义关系
export const systemSettingsRelations = relations(systemSettings, ({ many }) => ({
  auditLogs: many(systemSettingsAuditLog),
}))

export const systemSettingsAuditLogRelations = relations(systemSettingsAuditLog, ({ one }) => ({
  setting: one(systemSettings, {
    fields: [systemSettingsAuditLog.settingId],
    references: [systemSettings.id],
  }),
}))

// 类型导出
export type SystemSetting = typeof systemSettings.$inferSelect
export type NewSystemSetting = typeof systemSettings.$inferInsert
export type SystemSettingsAuditLog = typeof systemSettingsAuditLog.$inferSelect
export type NewSystemSettingsAuditLog = typeof systemSettingsAuditLog.$inferInsert
export type ApiAccessControl = typeof apiAccessControl.$inferSelect
export type NewApiAccessControl = typeof apiAccessControl.$inferInsert
export type SystemLogConfig = typeof systemLogConfig.$inferSelect
export type NewSystemLogConfig = typeof systemLogConfig.$inferInsert
export type SystemBackupConfig = typeof systemBackupConfig.$inferSelect
export type NewSystemBackupConfig = typeof systemBackupConfig.$inferInsert
export type SystemNotificationConfig = typeof systemNotificationConfig.$inferSelect
export type NewSystemNotificationConfig = typeof systemNotificationConfig.$inferInsert
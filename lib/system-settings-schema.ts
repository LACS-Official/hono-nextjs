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

// 登录日志表
export const loginLogs = pgTable('login_logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), // 用户ID
  email: varchar('email', { length: 255 }).notNull(), // 用户邮箱
  ipAddress: varchar('ip_address', { length: 45 }).notNull(), // 登录IP地址
  userAgent: text('user_agent').notNull(), // 用户代理
  deviceInfo: jsonb('device_info').notNull(), // 设备信息（JSON格式）
  networkInfo: jsonb('network_info').notNull(), // 网络信息（JSON格式）
  loginTime: timestamp('login_time').notNull().defaultNow(), // 登录时间
  sessionId: varchar('session_id', { length: 255 }).notNull(), // 会话ID
  isActive: boolean('is_active').notNull().default(true), // 会话是否活跃
  createdAt: timestamp('created_at').notNull().defaultNow(), // 创建时间
}, (table) => ({
  // 创建索引优化查询性能
  userIdIdx: index('login_logs_user_id_idx').on(table.userId),
  loginTimeIdx: index('login_logs_login_time_idx').on(table.loginTime.desc()),
  ipAddressIdx: index('login_logs_ip_address_idx').on(table.ipAddress),
  sessionIdIdx: index('login_logs_session_id_idx').on(table.sessionId),
  isActiveIdx: index('login_logs_is_active_idx').on(table.isActive),
}))

// 黑名单表（用于锁定IP或设备）
export const blockedItems = pgTable('blocked_items', {
  id: varchar('id', { length: 255 }).primaryKey(),
  type: varchar('type', { length: 20 }).notNull(), // 'ip' 或 'device'
  value: varchar('value', { length: 255 }).notNull(), // IP地址或设备指纹/UA
  reason: text('reason'), // 拉黑原因
  isActive: boolean('is_active').notNull().default(true), // 是否启用
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'), // 过期时间（可选）
  createdBy: varchar('created_by', { length: 255 }), // 创建者ID
}, (table) => ({
  valueIdx: index('blocked_items_value_idx').on(table.value),
  typeIdx: index('blocked_items_type_idx').on(table.type),
}))

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
export type LoginLog = typeof loginLogs.$inferSelect
export type NewLoginLog = typeof loginLogs.$inferInsert
export type BlockedItem = typeof blockedItems.$inferSelect
export type NewBlockedItem = typeof blockedItems.$inferInsert
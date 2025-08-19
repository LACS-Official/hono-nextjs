/**
 * 用户行为统计数据库模式定义
 * 用于记录软件使用和设备连接统计信息
 */

import { pgTable, text, timestamp, integer, boolean, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core'

// 软件使用统计表（原软件激活统计表）
export const softwareUsage = pgTable('software_usage', {
  id: uuid('id').primaryKey().defaultRandom(),

  // 软件信息
  softwareId: integer('software_id').notNull(), // 软件ID，对应API_CONFIG.SOFTWARE_ID
  softwareName: text('software_name').notNull().default('玩机管家'),
  softwareVersion: text('software_version'), // 软件版本

  // 设备指纹信息（用于唯一标识设备）
  deviceFingerprint: text('device_fingerprint').notNull(), // 设备指纹

  // 使用统计信息
  used: integer('used').notNull().default(1), // 使用次数，每次调用API时自增1
  usedAt: timestamp('used_at').notNull().defaultNow(), // 最后使用时间

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // 索引
  deviceFingerprintIdx: index('software_usage_device_fingerprint_idx').on(table.deviceFingerprint),
  softwareIdIdx: index('software_usage_software_id_idx').on(table.softwareId),
  usedAtIdx: index('software_usage_used_at_idx').on(table.usedAt),

  // 唯一约束：同一设备指纹和软件ID组合唯一
  uniqueDeviceUsage: uniqueIndex('software_usage_device_fingerprint_unique').on(table.deviceFingerprint, table.softwareId),
}))

// 保持向后兼容性的别名
export const softwareActivations = softwareUsage

// 设备连接统计表（简化版本）
export const deviceConnections = pgTable('device_connections', {
  id: uuid('id').primaryKey().defaultRandom(),

  // 设备基本信息
  deviceSerial: text('device_serial').notNull(), // 设备序列号
  deviceBrand: text('device_brand'), // 设备品牌
  deviceModel: text('device_model'), // 设备型号

  // 软件信息
  softwareId: integer('software_id').notNull(), // 软件ID

  // 用户设备指纹（关联到激活记录）
  userDeviceFingerprint: text('user_device_fingerprint'), // 用户设备指纹

  // 连接统计
  linked: integer('linked').notNull().default(1), // 连接次数，每次连接时自增

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // 索引
  deviceSerialIdx: index('device_connections_device_serial_idx').on(table.deviceSerial),
  softwareIdIdx: index('device_connections_software_id_idx').on(table.softwareId),
  userDeviceFingerprintIdx: index('device_connections_user_device_fingerprint_idx').on(table.userDeviceFingerprint),
}))

// 统计汇总表（用于快速查询）
export const behaviorStats = pgTable('behavior_stats', {
  id: uuid('id').primaryKey().defaultRandom(),

  // 统计类型
  statType: text('stat_type').notNull(), // 'usage' | 'device_connection' | 'daily_summary'

  // 软件信息
  softwareId: integer('software_id').notNull(),

  // 统计数据（JSON格式存储）
  statData: text('stat_data').notNull(), // JSON字符串

  // 统计时间范围
  statDate: timestamp('stat_date').notNull(), // 统计日期
  statPeriod: text('stat_period').notNull(), // 统计周期：'daily', 'weekly', 'monthly'

  // 时间戳
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // 索引
  statTypeIdx: index('behavior_stats_stat_type_idx').on(table.statType),
  statDateIdx: index('behavior_stats_stat_date_idx').on(table.statDate),
  softwareIdIdx: index('behavior_stats_software_id_idx').on(table.softwareId),

  // 唯一约束：同一类型、同一软件、同一时间段只能有一条记录
  uniqueStatRecord: uniqueIndex('behavior_stats_unique').on(table.statType, table.softwareId, table.statDate, table.statPeriod),
}))

// 导出类型定义
export type SoftwareActivation = typeof softwareActivations.$inferSelect
export type NewSoftwareActivation = typeof softwareActivations.$inferInsert

export type DeviceConnection = typeof deviceConnections.$inferSelect
export type NewDeviceConnection = typeof deviceConnections.$inferInsert

export type BehaviorStat = typeof behaviorStats.$inferSelect
export type NewBehaviorStat = typeof behaviorStats.$inferInsert

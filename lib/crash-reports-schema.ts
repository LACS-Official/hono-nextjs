/**
 * 客户端崩溃与异常日志数据库模式
 */
import { pgTable, serial, varchar, text, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core'
import { software } from './software-schema'

export const clientCrashReports = pgTable('client_crash_reports', {
  id: serial('id').primaryKey(),
  softwareId: integer('software_id').references(() => software.id, { onDelete: 'set null' }),
  softwareName: varchar('software_name', { length: 100 }).notNull(),
  appVersion: varchar('app_version', { length: 50 }).notNull(),
  osName: varchar('os_name', { length: 50 }).notNull(),
  osVersion: varchar('os_version', { length: 100 }),
  deviceModel: varchar('device_model', { length: 100 }),
  cpuArch: varchar('cpu_arch', { length: 50 }),
  gpuRenderer: varchar('gpu_renderer', { length: 255 }),
  errorType: varchar('error_type', { length: 100 }).notNull(), // Exception or Error Class name
  errorMessage: text('error_message').notNull(),
  errorStack: text('error_stack'),
  crashModule: varchar('crash_module', { length: 255 }), // file, class or native module
  crashHash: varchar('crash_hash', { length: 64 }).notNull(), // MD5 hash for aggregation/grouping
  customData: jsonb('custom_data'), // additional context, memory, logs
  clientIp: varchar('client_ip', { length: 50 }),
  userId: varchar('user_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('unresolved'), // unresolved, investigating, resolved, ignored
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    softwareIdx: index('idx_crash_software').on(table.softwareId),
    appVersionIdx: index('idx_crash_version').on(table.appVersion),
    crashHashIdx: index('idx_crash_hash').on(table.crashHash),
    statusIdx: index('idx_crash_status').on(table.status),
    createdAtIdx: index('idx_crash_created_at').on(table.createdAt),
  }
})

export type ClientCrashReport = typeof clientCrashReports.$inferSelect
export type NewClientCrashReport = typeof clientCrashReports.$inferInsert

/**
 * 捐赠人员数据库模式定义
 * 用于管理软件捐赠人员信息
 */

import { pgTable, serial, varchar, date, timestamp } from 'drizzle-orm/pg-core'

// 捐赠人员表
export const donors = pgTable('donors', {
  id: serial('id').primaryKey(), // 主键，自动生成
  name: varchar('name', { length: 255 }).notNull(), // 捐赠人姓名，必填字符串
  donationDate: date('donation_date').notNull(), // 捐赠日期，必填日期格式
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), // 创建时间，自动生成
})

// 导出类型定义
export type Donor = typeof donors.$inferSelect
export type NewDonor = typeof donors.$inferInsert

// 激活码数据库模式定义
import { pgTable, text, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core'

// 激活码表 - 与 Stack Auth 集成
export const activationCodes = pgTable('activation_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  usedBy: uuid('used_by'), // 使用者 ID
  userId: uuid('user_id'), // 用户 ID
  metadata: jsonb('metadata'),
  productInfo: jsonb('product_info'),
})

// 激活码类型定义
export type ActivationCode = typeof activationCodes.$inferSelect
export type NewActivationCode = typeof activationCodes.$inferInsert

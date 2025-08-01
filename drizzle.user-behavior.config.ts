import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: './lib/user-behavior-schema.ts',
  out: './drizzle/user-behavior',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.USER_BEHAVIOR_DATABASE_URL || process.env.DATABASE_URL!,
  },
} satisfies Config

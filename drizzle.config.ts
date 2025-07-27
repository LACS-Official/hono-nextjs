import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: './lib/db-schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config

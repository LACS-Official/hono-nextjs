import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: './lib/software-schema.ts',
  out: './drizzle/software',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SOFTWARE_DATABASE_URL!,
  },
} satisfies Config

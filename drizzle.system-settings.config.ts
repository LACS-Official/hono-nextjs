import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: [
    './lib/system-settings-schema.ts'
  ],
  out: './drizzle/system-settings',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SYSTEM_SETTINGS_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
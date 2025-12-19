import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: [
    './lib/activation-codes-schema.ts'
  ],
  out: './drizzle/activation-codes',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.ACTIVATION_CODES_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config
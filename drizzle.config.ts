import type { Config } from 'drizzle-kit'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

export default {
  schema: [
    './lib/activation-codes-schema.ts',
    './lib/software-schema.ts',
    './lib/user-behavior-schema.ts',
    './lib/donors-schema.ts',
    './lib/website-management-schema.ts',
    './lib/info-management-schema.ts',
    './lib/system-settings-schema.ts'
  ],
  out: './drizzle/unified',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 
         process.env.SOFTWARE_DATABASE_URL || 
         process.env.ACTIVATION_CODES_DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config

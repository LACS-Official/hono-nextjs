// 创建激活码数据库表的脚本
const { Client } = require('pg');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: '.env.local' });

// 获取数据库连接字符串
const connectionString = process.env.ACTIVATION_CODES_DATABASE_URL;

if (!connectionString) {
  console.error('Error: ACTIVATION_CODES_DATABASE_URL environment variable is required.');
  process.exit(1);
}

// 创建 PostgreSQL 客户端
const client = new Client({ connectionString });

// 激活码表创建SQL
const createActivationCodesTableSQL = `
CREATE TABLE IF NOT EXISTS activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID,
  user_id UUID,
  metadata JSONB,
  product_info JSONB
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_expires_at ON activation_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_activation_codes_created_at ON activation_codes(created_at);
`;

// 数据库初始化函数
async function initDatabase() {
  try {
    console.log('Connecting to activation codes database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Creating activation codes table...');
    await client.query(createActivationCodesTableSQL);
    console.log('Activation codes table created successfully!');

    // 添加版本控制表（可选）
    const createVersionTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_versions (
      id SERIAL PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      description TEXT
    );
    `;

    await client.query(createVersionTableSQL);
    console.log('Schema versions table created successfully!');

    // 插入初始版本记录
    const insertVersionSQL = `
    INSERT INTO schema_versions (version, description) 
    VALUES ('1.0.0', 'Initial activation codes schema')
    ON CONFLICT (version) DO NOTHING;
    `;

    await client.query(insertVersionSQL);
    console.log('Initial schema version inserted!');

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\nActivation codes database is ready for use.');
    console.log('You can now run drizzle-kit push with the activation-codes config to keep schema in sync.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed.');
  }
}

// 执行初始化
initDatabase();

// 命令行参数处理
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/create-activation-codes-tables-pg.js');
  console.log('\nOptions:');
  console.log('  --help, -h  Show this help message');
  console.log('\nEnvironment Variables:');
  console.log('  ACTIVATION_CODES_DATABASE_URL  PostgreSQL database connection string');
  process.exit(0);
}
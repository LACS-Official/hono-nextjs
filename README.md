# 🚀 Neon API Server

基于 Next.js 和 Neon Postgres 构建的现代化API服务器，提供激活码管理和OAuth认证功能。

## ✨ 主要功能

- 🔑 **激活码管理** - 生成、验证、统计激活码
- 🔐 **OAuth认证** - GitHub OAuth集成
- 🛡️ **安全保护** - API Key认证、CORS配置、速率限制
- 📊 **数据统计** - 激活码使用情况统计
- 🔄 **混合存储** - 支持KV和Postgres双存储模式

## 🛠️ 技术栈

- **框架**: Next.js 14
- **数据库**: Neon Postgres
- **ORM**: Drizzle ORM
- **API**: Hono + Next.js API Routes
- **样式**: Tailwind CSS
- **部署**: Vercel

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd hono-nextjs
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量：
```env
# 数据库配置
DATABASE_URL='postgresql://username:password@hostname:port/database?sslmode=require'

# API 安全配置
API_KEY=your-secret-api-key-here

# GitHub OAuth 配置（可选）
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 4. 数据库设置
```bash
# 生成数据库迁移
npm run db:generate

# 推送到数据库
npm run db:push
```

### 5. 启动开发服务器
```bash
npm run dev
```

访问 `http://localhost:3000` 查看API服务器。

## 📚 API 文档

### 激活码管理

#### 生成激活码
```http
POST /api/activation-codes
Content-Type: application/json
X-API-Key: your-api-key

{
  "expirationDays": 365,
  "metadata": {},
  "productInfo": {
    "name": "Product Name",
    "version": "1.0.0",
    "features": ["feature1", "feature2"]
  }
}
```

#### 获取激活码列表
```http
GET /api/activation-codes?page=1&limit=10&status=all
X-API-Key: your-api-key
```

#### 验证激活码
```http
POST /api/activation-codes/verify
Content-Type: application/json
X-API-Key: your-api-key

{
  "code": "ACTIVATION-CODE-HERE"
}
```

#### 获取统计信息
```http
GET /api/activation-codes/stats
X-API-Key: your-api-key
```

### 健康检查
```http
GET /api/health
```

## 🔒 安全配置

### CORS 配置
- 默认允许来源: `https://admin.lacs.cc`
- 支持的方法: `GET, POST, OPTIONS`
- 安全头部: 已配置防XSS、内容类型嗅探等

### API Key 认证
```bash
# 启用API Key认证
ENABLE_API_KEY_AUTH=true
API_KEY=your-very-secure-api-key
```

### 速率限制
```bash
# 启用速率限制
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## 🧪 调试和测试

### Debug 文件夹
项目包含一个 `debug/` 文件夹，用于存放所有调试和测试相关的文件：

- 📁 `debug/cors-test/` - CORS配置测试页面
- 📁 `debug/security-test/` - 安全配置测试页面
- 📁 `debug/activation-test/` - 激活码功能测试页面
- 📁 `debug/oauth-test/` - OAuth功能测试页面
- 📄 `debug/test-cors.html` - 独立CORS测试文件

### 管理Debug文件
```bash
# Windows PowerShell
.\debug\manage-debug.ps1 list

# Windows 批处理
.\debug\manage-debug.bat list

# 可用命令: list, clean, restore, check, help
```

**注意**: `debug/` 文件夹已配置为Git忽略，不会被提交到仓库。

## 📦 部署

### Vercel 部署
1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 一键部署

### 环境变量配置
确保在部署平台配置以下环境变量：
- `DATABASE_URL`
- `API_KEY`
- `GITHUB_CLIENT_ID` (可选)
- `GITHUB_CLIENT_SECRET` (可选)
- `ENABLE_API_KEY_AUTH=true`
- `ENABLE_RATE_LIMITING=true`

## 📝 开发脚本

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库操作
npm run db:generate  # 生成迁移
npm run db:push      # 推送到数据库
npm run db:studio    # 打开数据库管理界面

# 部署相关
npm run deploy:check  # 部署前检查
npm run deploy:build  # 检查并构建
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Neon 文档](https://neon.tech/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Hono 文档](https://hono.dev/)

## 📞 支持

如有问题或建议，请创建 Issue 或联系维护者。

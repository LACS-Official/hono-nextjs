# 🚀 LACS API Server

基于 Next.js 和 Neon Postgres 构建的现代化API服务器，提供激活码管理、软件管理和OAuth认证功能。

## ✨ 主要功能

- 🔑 **激活码管理** - 生成、验证、统计激活码，支持批量操作
- 🛡️ **OAuth认证** - GitHub OAuth集成，安全的用户认证
- 📦 **软件管理** - 软件版本管理、发布历史、公告系统
- 🔐 **安全保护** - API Key认证、CORS配置、速率限制、请求日志
- 📊 **数据统计** - 激活码使用情况统计、系统健康监控
- 🔄 **数据库分离** - 激活码和软件管理独立数据库架构
- 📱 **响应式设计** - 完全适配移动端和桌面端

## 🛠️ 技术栈

- **前端框架**: Next.js 14 + React 18
- **UI组件库**: Ant Design 5.x + Tailwind CSS
- **数据库**: Neon Postgres (分离架构)
- **ORM**: Drizzle ORM
- **API框架**: Hono + Next.js API Routes
- **认证**: JWT + GitHub OAuth
- **部署**: Vercel
- **开发工具**: TypeScript, ESLint

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 或 yarn 包管理器
- Neon Postgres 数据库账户

### 1. 克隆项目

```bash
git clone <repository-url>
cd hono-nextjs
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量：

```env
# 数据库配置（分离架构）
ACTIVATION_CODES_DATABASE_URL='postgresql://username:password@hostname:port/activation_codes_db?sslmode=require'
SOFTWARE_DATABASE_URL='postgresql://username:password@hostname:port/software_db?sslmode=require'

# API 安全配置
API_KEY=your-secret-api-key-here
ENABLE_API_KEY_AUTH=true

# GitHub OAuth 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
JWT_SECRET=your-jwt-secret-key

# 管理员配置
ALLOWED_GITHUB_USERNAME=your-github-username
ALLOWED_GITHUB_EMAIL=your-email@example.com

# 可选配置
ALLOWED_ORIGINS=https://admin.lacs.cc,http://localhost:3000
API_KEY_EXPIRATION_HOURS=24
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### 4. 数据库设置

```bash
# 生成数据库迁移文件
npm run db:generate

# 推送迁移到数据库
npm run db:push

# 打开数据库管理界面（可选）
npm run db:studio
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 查看应用。

## 📚 API 文档

### 基础信息

- **Base URL**: `https://your-domain.com/api`
- **认证方式**: API Key (Header: `X-API-Key`)
- **数据格式**: JSON
- **字符编码**: UTF-8

### 健康检查

```http
GET /api/health
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "responseTime": "15ms",
    "databases": {
      "activationCodes": {
        "status": "connected",
        "healthy": true
      },
      "software": {
        "status": "connected", 
        "healthy": true
      }
    },
    "version": "1.0.0"
  }
}
```

### 激活码管理

#### 生成激活码

```http
POST /api/activation-codes
Content-Type: application/json
X-API-Key: your-api-key

{
  "expirationDays": 365,
  "metadata": {
    "purpose": "license",
    "features": ["feature1", "feature2"]
  },
  "productInfo": {
    "name": "Product Name",
    "version": "1.0.0"
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

### 软件管理

#### 获取软件列表

```http
GET /api/app/software
X-API-Key: your-api-key
```

#### 获取特定软件信息

```http
GET /api/app/software/{name}
X-API-Key: your-api-key
```

#### 更新软件版本

```http
PUT /api/app/software/{name}
Content-Type: application/json
X-API-Key: your-api-key

{
  "version": "1.2.0",
  "downloadUrl": "https://example.com/download",
  "releaseNotes": "Bug fixes and improvements"
}
```

## 🔒 安全配置

### CORS 配置

项目支持动态CORS配置，可通过环境变量设置允许的来源：

```env
ALLOWED_ORIGINS=https://admin.lacs.cc,https://your-domain.com
```

### API Key 认证

```env
# 启用API Key认证
ENABLE_API_KEY_AUTH=true
API_KEY=your-very-secure-api-key
API_KEY_EXPIRATION_HOURS=24
```

### 速率限制

```env
# 启用速率限制
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### GitHub OAuth 设置

1. 在 GitHub 创建 OAuth App
2. 设置回调URL: `https://your-domain.com/api/auth/callback`
3. 配置环境变量

详细设置请参考：[GitHub OAuth 设置指南](./GITHUB_OAUTH_SETUP.md)

## 📦 部署

### Vercel 部署（推荐）

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 一键部署

### 环境变量配置

确保在部署平台配置所有必要的环境变量。

### 部署前检查

```bash
# 运行部署前检查
npm run deploy:check

# 检查并构建
npm run deploy:build
```

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

## 🧪 测试和调试

项目包含完整的测试和调试工具：

- 📁 `tests/debug/` - 调试和测试页面
- 🔧 健康检查端点 - `/api/health`
- 📊 数据库连接监控
- 🔍 请求日志记录

## 📚 架构文档

- [数据库分离架构](./docs/DATABASE_SEPARATION.md)
- [API接口文档](./docs/api/)
- [安全配置说明](./docs/SECURITY.md)
- [部署检查清单](./docs/DEPLOYMENT_CHECKLIST_V2.md)

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
- [Ant Design 文档](https://ant.design/)

## 📞 支持

如有问题或建议，请创建 Issue 或联系维护者。

---

**版本**: 1.0.0  
**最后更新**: 2024-01-01

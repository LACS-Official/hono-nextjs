# Hono + Next.js 全栈应用

这是一个基于 **Hono** 和 **Next.js** 的现代化全栈 Web 应用，集成了 GitHub OAuth 登录和激活码管理系统。

## 🚀 功能特性

### 认证系统
- ✅ **GitHub OAuth 2.0 登录** - 完整的授权流程
- ✅ **用户信息获取** - 用户名、邮箱、头像等
- ✅ **访问令牌管理** - 安全的令牌存储和验证

### 激活码系统
- ✅ **激活码生成** - 支持自定义过期时间和元数据
- ✅ **激活码验证** - 完整的验证和使用流程
- ✅ **数据库存储** - 使用 Neon Postgres 数据库
- ✅ **批量管理** - 激活码列表查询和统计

### 技术特性
- ✅ **响应式设计** - 支持移动端和桌面端
- ✅ **TypeScript 支持** - 完整的类型安全
- ✅ **现代化 UI** - 使用 Tailwind CSS 构建
- ✅ **数据库集成** - Drizzle ORM + Neon Postgres
- ✅ **API 版本控制** - 支持多版本 API 接口

## 🛠️ 技术栈

### 后端
- **Next.js 14.2.3** - React 全栈框架
- **Hono 4.4.2** - 轻量级 Web 框架
- **TypeScript 4.9.4** - 类型安全
- **Drizzle ORM 0.44.3** - 现代化数据库 ORM
- **Neon Postgres** - 无服务器 PostgreSQL 数据库

### 前端
- **React 18.3.1** - UI 库
- **Tailwind CSS 3.4.4** - 样式框架
- **Next.js App Router** - 现代化路由

### 存储
- **Neon Postgres** - 生产级 PostgreSQL 数据库

### 开发工具
- **Drizzle Kit** - 数据库迁移和管理
- **UUID** - 唯一标识符生成
- **Crypto-JS** - 加密和哈希功能

## 📁 项目结构

```
hono-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/github/
│   │   │   ├── login/route.ts      # GitHub OAuth 登录
│   │   │   ├── callback/route.ts   # OAuth 回调处理
│   │   │   └── user/route.ts       # 用户信息获取
│   │   ├── activation-codes/       # 激活码 API
│   │   │   ├── route.ts            # 生成和获取激活码
│   │   │   ├── verify/route.ts     # 验证激活码
│   │   │   ├── stats/route.ts      # 激活码统计
│   │   │   ├── cleanup/route.ts    # 清理过期激活码
│   │   │   └── [id]/route.ts       # 单个激活码操作
│   │   ├── activation-codes-hybrid/ # 混合模式 API（迁移期间）
│   │   │   └── route.ts            # KV + Postgres 混合

│   ├── oauth-test/page.tsx         # OAuth 测试页面
│   ├── activation-test/page.tsx    # 激活码测试页面
│   ├── Hello.tsx                   # 主页面组件
│   ├── layout.tsx                  # 根布局
│   └── page.tsx                    # 首页
├── lib/
│   ├── db-connection.ts            # 数据库连接配置
│   └── db-schema.ts                # 数据库表结构定义
├── scripts/
│   └── migrate-kv-to-postgres.js   # 数据迁移脚本
├── drizzle/                        # 数据库迁移文件
├── styles/
│   └── globals.css                 # 全局样式
├── drizzle.config.ts               # Drizzle 配置
├── env.example                     # 环境变量示例
├── GITHUB_OAUTH_SETUP.md          # OAuth 设置指南
├── ACTIVATION_CODES_API.md        # 激活码 API 文档
└── README.md                       # 项目文档
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd hono-nextjs
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置回调 URL：`http://localhost:3000/api/auth/github/callback`

### 4. 配置环境变量

```bash
cp env.example .env.local
```

编辑 `.env.local` 文件：

```env
# GitHub OAuth 配置
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# Neon Postgres 配置（推荐）
DATABASE_URL=postgresql://username:password@host/database
```

### 5. 数据库设置（可选）

如果使用 Postgres 数据库：

```bash
# 生成数据库迁移文件
npm run db:generate

# 推送数据库结构
npm run db:push

# 打开数据库管理界面
npm run db:studio
```

### 6. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 📖 API 文档

### GitHub OAuth 端点

#### 1. 登录端点
```
GET /api/auth/github/login
```
重定向用户到 GitHub OAuth 授权页面。

#### 2. 回调端点
```
GET /api/auth/github/callback
```
处理 GitHub 的授权回调，交换访问令牌并获取用户信息。

#### 3. 用户信息端点
```
GET /api/auth/github/user
```
使用访问令牌获取当前用户信息。

### 激活码 API 端点

激活码管理系统提供完整的激活码生命周期管理功能，包括生成、验证、查询和统计等操作。

#### 1. 生成激活码
```
POST /api/activation-codes
```

**功能描述**：生成一个新的激活码，支持自定义过期时间和产品信息。

**请求体参数**：
```json
{
  "expirationDays": 365,           // 可选，过期天数，默认 365
  "metadata": {                    // 可选，自定义元数据
    "customerEmail": "user@example.com",
    "licenseType": "enterprise"
  },
  "productInfo": {                 // 可选，产品信息
    "name": "我的软件",
    "version": "1.0.0",
    "features": ["premium", "support"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ABC123-DEF456-GHI789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "productInfo": {
      "name": "我的软件",
      "version": "1.0.0",
      "features": ["premium", "support"]
    }
  }
}
```

#### 2. 验证激活码
```
POST /api/activation-codes/verify
```

**功能描述**：验证激活码的有效性并标记为已使用。

**请求体参数**：
```json
{
  "code": "ABC123-DEF456-GHI789"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ABC123-DEF456-GHI789",
    "productInfo": {
      "name": "我的软件",
      "version": "1.0.0",
      "features": ["premium", "support"]
    },
    "metadata": {
      "customerEmail": "user@example.com"
    },
    "activatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**失败响应**：
```json
{
  "success": false,
  "error": "激活码无效或已过期"
}
```

#### 3. 获取激活码列表
```
GET /api/activation-codes
```

**功能描述**：获取激活码列表，支持分页和状态过滤。

**查询参数**：
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 10
- `status`: 状态过滤
  - `all`: 全部（默认）
  - `used`: 已使用
  - `unused`: 未使用
  - `expired`: 已过期
  - `active`: 有效（未使用且未过期）

**请求示例**：
```
GET /api/activation-codes?page=1&limit=5&status=unused
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "id": "uuid-here",
        "code": "ABC123-DEF456-GHI789",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "expiresAt": "2025-01-01T00:00:00.000Z",
        "isUsed": false,
        "productInfo": {
          "name": "我的软件",
          "version": "1.0.0",
          "features": ["premium"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 10,
      "totalPages": 2
    }
  }
}
```

#### 4. 获取单个激活码详情
```
GET /api/activation-codes/[id]
```

**功能描述**：根据 ID 获取激活码的详细信息。

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ABC123-DEF456-GHI789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "isUsed": false,
    "isExpired": false,
    "productInfo": {
      "name": "我的软件",
      "version": "1.0.0",
      "features": ["premium"]
    },
    "metadata": {
      "customerEmail": "user@example.com"
    }
  }
}
```

#### 5. 删除激活码
```
DELETE /api/activation-codes/[id]
```

**功能描述**：根据 ID 删除指定的激活码。

**响应示例**：
```json
{
  "success": true,
  "message": "激活码删除成功"
}
```

#### 6. 获取激活码统计信息
```
GET /api/activation-codes/stats
```

**功能描述**：获取激活码的统计信息，包括总数、已使用数量、过期数量等。

**响应示例**：
```json
{
  "success": true,
  "data": {
    "total": 100,
    "used": 45,
    "unused": 35,
    "expired": 20,
    "active": 35,
    "usageRate": 45.0
  }
}
```

#### 7. 清理过期激活码
```
POST /api/activation-codes/cleanup
```

**功能描述**：清理过期超过指定天数的激活码。

**请求体参数**：
```json
{
  "daysOld": 30  // 可选，清理过期超过多少天的激活码，默认 30
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "已清理 15 个过期激活码",
  "deletedCount": 15
}
```

#### 错误处理

所有接口在出错时都会返回统一的错误格式：

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

**常见错误码**：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

详细的激活码 API 文档请参考：
- [激活码API文档.md](激活码API文档.md) - 完整的中文文档
- [ACTIVATION_CODES_API.md](ACTIVATION_CODES_API.md) - 英文版本文档

### 通用 API 端点

#### Hello 端点
```
GET /api/hello
```
返回欢迎消息。

## 🧪 测试功能

### OAuth 登录测试

1. 访问 http://localhost:3000/oauth-test
2. 点击 "使用 GitHub 登录" 按钮
3. 完成 GitHub 授权
4. 查看用户信息

### 激活码系统测试

1. 访问 http://localhost:3000/activation-test
2. 测试激活码生成和验证功能
3. 查看激活码列表和统计信息

### API 测试

```bash
# 测试 Hello API
curl http://localhost:3000/api/hello

# 测试用户信息 API（需要访问令牌）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/github/user

# 测试激活码生成
curl -X POST http://localhost:3000/api/activation-codes \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30, "productInfo": {"name": "Test Product"}}'

# 测试激活码验证
curl -X POST http://localhost:3000/api/activation-codes/verify \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_ACTIVATION_CODE"}'

# 测试激活码列表
curl http://localhost:3000/api/activation-codes?page=1&limit=10&status=active

# 测试激活码统计
curl http://localhost:3000/api/activation-codes/stats

# 测试 API 路径（运行完整测试）
node scripts/test-activation-codes-api.js
```

## 🚀 部署指南

### Vercel 部署（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   REDIRECT_URI=https://your-domain.vercel.app/api/auth/github/callback
   DATABASE_URL=your_neon_postgres_url
   ```
4. 更新 GitHub OAuth App 的回调 URL

### 其他平台部署

项目支持部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- Heroku
- 自托管服务器

## 🔧 开发指南

### 添加新功能

1. **API 路由**：在 `app/api/` 目录下创建新的路由文件
2. **页面组件**：在 `app/` 目录下创建新的页面文件
3. **样式**：使用 Tailwind CSS 类名或创建新的 CSS 文件

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码

### 测试

```bash
# 运行开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 数据库操作
npm run db:generate    # 生成迁移文件
npm run db:push        # 推送数据库结构
npm run db:studio      # 打开数据库管理界面


# 测试 Postgres 连接
npm run test:postgres
```

## 🔒 安全注意事项

1. **环境变量**：永远不要将敏感信息提交到版本控制
2. **HTTPS**：生产环境必须使用 HTTPS
3. **令牌安全**：访问令牌应该安全存储
4. **CSRF 保护**：验证 state 参数
5. **错误处理**：不要暴露敏感错误信息
6. **数据库安全**：使用连接池和参数化查询
7. **激活码安全**：激活码应该具有足够的随机性和过期时间
8. **API 限流**：生产环境应该实施 API 限流策略

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [Next.js](https://nextjs.org/) - React 全栈框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [GitHub OAuth](https://docs.github.com/en/developers/apps/building-oauth-apps) - OAuth 2.0 实现
- [Drizzle ORM](https://orm.drizzle.team/) - 现代化 TypeScript ORM
- [Neon](https://neon.tech/) - 无服务器 PostgreSQL 数据库


## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [GitHub OAuth 设置指南](GITHUB_OAUTH_SETUP.md)
2. 查看 [激活码 API 中文文档](激活码API文档.md)
3. 查看 [激活码 API 英文文档](ACTIVATION_CODES_API.md)
4. 搜索现有的 [Issues](../../issues)
5. 创建新的 [Issue](../../issues/new)

### 常见问题



**Q: 数据库连接失败怎么办？**
A: 检查 `DATABASE_URL` 环境变量，确保 Neon 数据库正常运行。

---

**享受编码！** 🎉

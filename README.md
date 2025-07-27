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
│   │   ├── v2/activation-codes/    # Postgres 版激活码 API
│   │   │   ├── route.ts            # 生成激活码
│   │   │   ├── verify/route.ts     # 验证激活码
│   │   │   └── list/route.ts       # 激活码列表
│   │   ├── activation-codes-hybrid/ # 混合模式 API
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



#### Postgres 版本（推荐）
```
POST /api/v2/activation-codes          # 生成激活码
POST /api/v2/activation-codes/verify   # 验证激活码
GET  /api/v2/activation-codes/list     # 获取激活码列表
```

#### 混合模式（迁移期间）
```
POST /api/activation-codes-hybrid     # 混合模式激活码操作
```

详细的激活码 API 文档请参考：[ACTIVATION_CODES_API.md](ACTIVATION_CODES_API.md)

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
curl -X POST http://localhost:3000/api/v2/activation-codes \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30, "productInfo": {"name": "Test Product"}}'

# 测试激活码验证
curl -X POST http://localhost:3000/api/v2/activation-codes/verify \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_ACTIVATION_CODE"}'
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
2. 查看 [激活码 API 文档](ACTIVATION_CODES_API.md)
3. 搜索现有的 [Issues](../../issues)
4. 创建新的 [Issue](../../issues/new)

### 常见问题



**Q: 数据库连接失败怎么办？**
A: 检查 `DATABASE_URL` 环境变量，确保 Neon 数据库正常运行。

---

**享受编码！** 🎉

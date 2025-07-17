# Hono + Next.js GitHub OAuth 项目

这是一个基于 **Hono** 和 **Next.js** 的全栈 Web 应用，集成了 GitHub OAuth 登录功能。

## 🚀 功能特性

- ✅ **GitHub OAuth 2.0 登录** - 完整的授权流程
- ✅ **用户信息获取** - 用户名、邮箱、头像等
- ✅ **访问令牌管理** - 安全的令牌存储和验证
- ✅ **响应式设计** - 支持移动端和桌面端
- ✅ **TypeScript 支持** - 完整的类型安全
- ✅ **现代化 UI** - 使用 Tailwind CSS 构建

## 🛠️ 技术栈

### 后端
- **Next.js 14.2.3** - React 全栈框架
- **Hono 4.4.2** - 轻量级 Web 框架
- **TypeScript 4.9.4** - 类型安全

### 前端
- **React 18.3.1** - UI 库
- **Tailwind CSS 3.4.4** - 样式框架
- **Next.js App Router** - 现代化路由

## 📁 项目结构

```
hono-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/github/
│   │   │   ├── login/route.ts      # GitHub OAuth 登录
│   │   │   ├── callback/route.ts   # OAuth 回调处理
│   │   │   └── user/route.ts       # 用户信息获取
│   │   └── [...route]/route.ts     # 通用 API 路由
│   ├── oauth-test/page.tsx         # OAuth 测试页面
│   ├── Hello.tsx                   # 主页面组件
│   ├── layout.tsx                  # 根布局
│   └── page.tsx                    # 首页
├── styles/
│   └── globals.css                 # 全局样式
├── env.example                     # 环境变量示例
├── GITHUB_OAUTH_SETUP.md          # OAuth 设置指南
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
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

### 5. 启动开发服务器

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

### API 测试

```bash
# 测试 Hello API
curl http://localhost:3000/api/hello

# 测试用户信息 API（需要访问令牌）
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/github/user
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
```

## 🔒 安全注意事项

1. **环境变量**：永远不要将敏感信息提交到版本控制
2. **HTTPS**：生产环境必须使用 HTTPS
3. **令牌安全**：访问令牌应该安全存储
4. **CSRF 保护**：验证 state 参数
5. **错误处理**：不要暴露敏感错误信息

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

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [GitHub OAuth 设置指南](GITHUB_OAUTH_SETUP.md)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

---

**享受编码！** 🎉

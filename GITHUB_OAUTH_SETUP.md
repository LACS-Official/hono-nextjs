# GitHub OAuth 认证系统设置指南

## 📋 概述

本项目已成功集成 GitHub OAuth 认证系统，为管理员前端提供安全的身份验证。只有授权的 GitHub 账户才能访问管理员控制台。

## 🔧 环境配置

### 1. GitHub OAuth 应用设置

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App" 创建新应用
3. 填写应用信息：
   - **Application name**: LACS Admin
   - **Homepage URL**: `http://localhost:3000` (开发环境) 或您的域名
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`

4. 创建后获取 `Client ID` 和 `Client Secret`

### 2. 环境变量配置

在 `.env.local` 文件中添加以下配置：

```env
# GitHub OAuth 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# JWT 配置
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# 管理员权限配置
ALLOWED_GITHUB_USERNAME=LACS-Official
ALLOWED_GITHUB_EMAIL=2935278133@qq.com

# 前端配置
FRONTEND_URL=http://localhost:3000/admin

# API 端点配置
NEXT_PUBLIC_API_URL=http://localhost:3000/app
```

### 3. 生产环境配置

对于生产环境，请更新以下配置：

```env
REDIRECT_URI=https://your-domain.com/api/auth/github/callback
FRONTEND_URL=https://your-domain.com/admin
NEXT_PUBLIC_API_URL=https://your-domain.com/app
JWT_SECRET=your-strong-production-secret
```

## 🚀 使用流程

### 用户认证流程

1. **访问首页** (`/`) - 显示系统概览和功能介绍，无需登录
2. **访问管理员页面** (`/admin`) - 自动检查认证状态，未登录时显示登录提示
3. **登录页面** (`/login`) - 显示 GitHub OAuth 登录按钮
4. **GitHub 授权** - 用户点击登录按钮，跳转到 GitHub 授权页面
5. **权限验证** - 系统验证用户是否为授权管理员
6. **管理员控制台** (`/admin`) - 成功登录后访问管理功能

### 路由保护

- **公开路由**: `/`, `/login`, `/api-docs`, `/api/auth/*` - 无需认证即可访问
- **受保护路由**: `/admin/*` - 需要 GitHub OAuth 认证，未登录时显示登录提示
- **API 保护**: 管理员 API 端点需要有效的 JWT Token

## 🔐 安全特性

### 认证机制

- **GitHub OAuth 2.0**: 使用 GitHub 官方 OAuth 服务
- **JWT Token**: 安全的会话管理，支持过期时间设置
- **HttpOnly Cookies**: 防止 XSS 攻击的安全 Cookie 存储
- **权限验证**: 只允许指定的 GitHub 用户名和邮箱访问

### 会话管理

- **自动过期**: JWT Token 默认 7 天过期
- **安全存储**: 使用 HttpOnly、Secure、SameSite 属性的 Cookie
- **登出功能**: 清除客户端和服务端的认证信息

## 🛠️ API 端点

### 认证相关 API

- `GET /api/auth/github/login` - 发起 GitHub OAuth 登录
- `GET /api/auth/github/callback` - GitHub OAuth 回调处理
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出

### 使用示例

```javascript
// 获取当前用户信息
const response = await fetch('/api/auth/me', {
  credentials: 'include'
})
const data = await response.json()

// 登出
await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include'
})
```

## 🎨 前端组件

### 主要组件

- **AuthProvider**: 认证上下文提供者
- **AuthGuard**: 路由保护组件
- **LoginPage**: 登录页面
- **Navigation**: 带用户信息的导航栏

### 使用示例

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading, login, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <button onClick={login}>Login</button>
  
  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## 🔍 故障排除

### 常见问题

1. **OAuth 回调失败**
   - 检查 GitHub OAuth 应用的回调 URL 设置
   - 确认 `REDIRECT_URI` 环境变量正确

2. **JWT 验证失败**
   - 检查 `JWT_SECRET` 是否设置
   - 确认 Cookie 设置正确

3. **权限被拒绝**
   - 检查 `ALLOWED_GITHUB_USERNAME` 和 `ALLOWED_GITHUB_EMAIL` 配置
   - 确认 GitHub 账户信息匹配

### 调试模式

在开发环境中，可以查看浏览器控制台和网络请求来调试认证流程。

## 🚀 使用方法

1. **配置环境变量** - 设置 GitHub OAuth 应用信息
2. **访问系统** - 打开 `http://localhost:3000` 查看系统概览
3. **进入管理员控制台** - 点击"进入管理控制台"按钮或直接访问 `/admin`
4. **GitHub 登录** - 如未登录，系统会提示使用 GitHub 账户登录
5. **管理功能** - 成功认证后访问所有管理功能

## 📝 更新日志

- ✅ 项目清理：删除未使用的测试文件和依赖
- ✅ GitHub OAuth 集成：完整的认证流程实现
- ✅ JWT 会话管理：安全的令牌处理
- ✅ 路由保护：管理员页面访问控制
- ✅ 用户界面：登录页面和用户信息显示
- ✅ 安全优化：HttpOnly Cookie 和权限验证
- ✅ 访问逻辑优化：只有访问 `/admin` 路由才需要登录
- ✅ API 端点修复：修复软件管理 API 路由，从 `/api/app/software` 迁移到 `/app/software`

## 🚀 部署建议

1. **生产环境**：使用强密码作为 `JWT_SECRET`
2. **HTTPS**：确保生产环境使用 HTTPS
3. **域名配置**：正确设置 GitHub OAuth 回调 URL
4. **监控**：添加认证失败的日志监控

---

如有问题，请查看项目文档或联系开发团队。

# GitHub OAuth 登录设置指南

## 概述

本项目已集成 GitHub OAuth 登录功能，允许用户使用 GitHub 账户登录应用。

## 功能特性

- ✅ GitHub OAuth 2.0 授权流程
- ✅ 用户信息获取（用户名、邮箱、头像等）
- ✅ 访问令牌管理
- ✅ 前端测试页面
- ✅ 错误处理和状态管理

## API 端点

### 1. 登录端点
```
GET /api/auth/github/login
```
重定向用户到 GitHub OAuth 授权页面。

### 2. 回调端点
```
GET /api/auth/github/callback
```
处理 GitHub 的授权回调，交换访问令牌并获取用户信息。

### 3. 用户信息端点
```
GET /api/auth/github/user
```
使用访问令牌获取当前用户信息。

## 设置步骤

### 1. 创建 GitHub OAuth App

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写应用信息：
   - **Application name**: 你的应用名称
   - **Homepage URL**: `http://localhost:3000` (开发环境)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback`
4. 点击 "Register application"
5. 记录下 **Client ID** 和 **Client Secret**

### 2. 配置环境变量

1. 复制 `env.example` 文件为 `.env.local`：
   ```bash
   cp env.example .env.local
   ```

2. 编辑 `.env.local` 文件，填入你的 GitHub OAuth 配置：
   ```env
   GITHUB_CLIENT_ID=your_github_client_id_here
   GITHUB_CLIENT_SECRET=your_github_client_secret_here
   REDIRECT_URI=http://localhost:3000/api/auth/github/callback
   ```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 测试 OAuth 登录

1. 访问 `http://localhost:3000`
2. 点击 "测试 GitHub OAuth 登录" 按钮
3. 或者直接访问 `http://localhost:3000/oauth-test`

## 生产环境部署

### 1. 更新 GitHub OAuth App 设置

1. 在 GitHub Developer Settings 中编辑你的 OAuth App
2. 更新 **Authorization callback URL** 为你的生产域名：
   ```
   https://your-domain.com/api/auth/github/callback
   ```

### 2. 更新环境变量

```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
REDIRECT_URI=https://your-domain.com/api/auth/github/callback
```

## 安全注意事项

1. **Client Secret 保护**: 永远不要将 Client Secret 提交到版本控制系统
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **状态验证**: 在生产环境中应该验证 state 参数以防止 CSRF 攻击
4. **令牌存储**: 访问令牌应该安全存储，不要直接暴露给前端
5. **会话管理**: 实现适当的会话管理和令牌刷新机制

## 故障排除

### 常见错误

1. **"bad_verification_code"**: 授权码已过期或无效
2. **"redirect_uri_mismatch"**: 回调 URL 不匹配
3. **"invalid_client"**: Client ID 或 Client Secret 错误

### 调试步骤

1. 检查环境变量是否正确设置
2. 确认 GitHub OAuth App 的回调 URL 配置
3. 查看浏览器控制台和服务器日志
4. 验证网络连接和防火墙设置

## 自定义和扩展

### 添加更多权限

在登录 URL 中修改 `scope` 参数：

```typescript
const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email,repo&state=${state}`
```

### 集成数据库

在实际应用中，你应该：
1. 将用户信息存储到数据库
2. 实现 JWT 或 Session 认证
3. 添加用户角色和权限管理
4. 实现令牌刷新机制

## 相关资源

- [GitHub OAuth App 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Hono 文档](https://hono.dev/)
- [Next.js 文档](https://nextjs.org/docs) 
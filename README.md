# 🚀 LACS API Server

现代化的全栈API服务器，提供激活码管理、软件管理和公告系统的完整解决方案。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/hono-nextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 核心功能

| 功能模块 | 描述 | 状态 |
|---------|------|------|
| 🔑 **激活码管理** | 生成、验证、统计激活码，支持批量操作和过期管理 | ✅ 完成 |
| 📦 **软件管理** | 软件信息管理、版本历史追踪、多源下载链接 | ✅ 完成 |
| 📢 **公告系统** | 软件公告发布、多语言支持、优先级管理 | ✅ 完成 |
| 🛡️ **安全认证** | GitHub OAuth + JWT + API Key 多重认证 | ✅ 完成 |
| 📊 **数据统计** | 实时统计面板、健康监控、使用分析 | ✅ 完成 |
| 📱 **响应式UI** | 移动端适配、暗色主题、无障碍支持 | ✅ 完成 |

## 🛠️ 技术架构

```
Frontend: Next.js 14 + React 18 + Ant Design 5.x + Tailwind CSS
Backend:  Next.js API Routes + Hono Framework
Database: Neon Postgres (双库分离) + Drizzle ORM
Auth:     GitHub OAuth + JWT + API Key
Deploy:   Vercel + Edge Functions
```

## 🚀 快速开始

### 📋 环境要求

- Node.js 18+
- Neon Postgres 数据库
- GitHub OAuth App

### ⚡ 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/hono-nextjs)

### 🔧 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd hono-nextjs

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件（见下方配置说明）

# 4. 初始化数据库
npm run db:push

# 5. 启动开发服务器
npm run dev
```

### 🔐 环境变量配置

<details>
<summary>点击展开完整配置</summary>

```env
# 🗄️ 数据库配置（双库分离架构）
ACTIVATION_CODES_DATABASE_URL='postgresql://user:pass@host:port/activation_codes_db?sslmode=require'
SOFTWARE_DATABASE_URL='postgresql://user:pass@host:port/software_db?sslmode=require'

# 🔑 API 安全配置
API_KEY=your-secret-api-key-here
ENABLE_API_KEY_AUTH=true
API_KEY_EXPIRATION_HOURS=24

# 🛡️ GitHub OAuth 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
JWT_SECRET=your-jwt-secret-key

# 👤 管理员配置
ALLOWED_GITHUB_USERNAME=your-github-username
ALLOWED_GITHUB_EMAIL=your-email@example.com

# 🌐 CORS 和安全配置
ALLOWED_ORIGINS=https://admin.lacs.cc,http://localhost:3000
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

</details>

> 📖 详细配置说明请参考 [环境变量文档](./docs/ENVIRONMENT_VARIABLES.md)

## 📚 API 文档

### 🔗 快速链接

| 文档类型 | 链接 | 描述 |
|---------|------|------|
| 🚀 **API使用指南** | [API Usage Guide](./docs/API_USAGE_GUIDE.md) | 完整的API集成指南 |
| 💻 **使用示例** | [Usage Examples](./docs/API_USAGE_EXAMPLES.md) | 代码示例和最佳实践 |
| 🏷️ **标签筛选功能** | [Tag Filtering](./docs/API_TAG_FILTERING_EXAMPLES.md) | 软件标签筛选详细指南 |
| 📖 **API参考文档** | [API Reference](./docs/API_REFERENCE.md) | 详细的API端点文档 |
| ⚡ **快速参考** | [Quick Reference](./docs/api/API_QUICK_REFERENCE_COMPLETE.md) | 常用API的快速查询 |
| 🧪 **Postman集合** | [Collection](./docs/api/API_POSTMAN_COLLECTION.json) | 可导入的API测试集合 |

### 🚀 核心端点

```bash
# 健康检查
GET /api/health

# 激活码管理
GET    /api/activation-codes          # 获取激活码列表
POST   /api/activation-codes          # 生成新激活码
POST   /api/activation-codes/verify   # 验证激活码
GET    /api/activation-codes/stats    # 获取统计信息

# 软件管理
GET    /app/software                  # 获取软件列表
GET    /app/software/id/{id}          # 获取软件详情
POST   /app/software                  # 添加新软件
PUT    /app/software/id/{id}          # 更新软件信息

# 版本管理
GET    /app/software/id/{id}/versions           # 获取版本历史
POST   /app/software/id/{id}/versions           # 添加新版本
PUT    /app/software/id/{id}/versions/{versionId}  # 更新版本

# 公告管理
GET    /app/software/id/{id}/announcements      # 获取公告列表
POST   /app/software/id/{id}/announcements      # 添加新公告
PUT    /app/software/id/{id}/announcements/{announcementId}  # 更新公告
```

### 🔐 认证方式

```bash
# API Key 认证（推荐）
curl -H "X-API-Key: your-api-key" https://api.example.com/endpoint

# JWT 认证（管理界面）
curl -H "Authorization: Bearer your-jwt-token" https://api.example.com/endpoint
```

> 📖 查看 [完整API文档](./docs/API_REFERENCE.md) 了解详细的请求/响应格式

## 🔒 安全与部署

### 🛡️ 安全特性

| 安全层级 | 功能 | 配置 |
|---------|------|------|
| **认证** | API Key + JWT + OAuth | `ENABLE_API_KEY_AUTH=true` |
| **CORS** | 动态来源控制 | `ALLOWED_ORIGINS=domain1,domain2` |
| **限流** | 请求频率限制 | `ENABLE_RATE_LIMITING=true` |
| **加密** | 数据传输加密 | 自动HTTPS + SSL |

### 🚀 部署选项

<details>
<summary><strong>🔥 Vercel 部署（推荐）</strong></summary>

```bash
# 1. 连接 GitHub 仓库到 Vercel
# 2. 配置环境变量
# 3. 一键部署

# 部署前检查
npm run deploy:check
npm run deploy:build
```

**优势**: 零配置、自动HTTPS、全球CDN、无服务器架构

</details>

<details>
<summary><strong>🐳 Docker 部署</strong></summary>

```bash
# 构建镜像
docker build -t lacs-api .

# 运行容器
docker run -p 3000:3000 --env-file .env.local lacs-api
```

</details>

<details>
<summary><strong>☁️ 其他平台</strong></summary>

支持部署到：Railway、Render、DigitalOcean、AWS、Azure 等任何支持 Node.js 的平台

</details>

> 📖 详细部署指南请参考 [部署文档](./docs/DEPLOYMENT_CHECKLIST_V2.md)

## 🛠️ 开发工具

### 📝 常用命令

```bash
# 🚀 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
npm run lint             # 代码检查

# 🗄️ 数据库
npm run db:generate      # 生成迁移文件
npm run db:push          # 推送到数据库
npm run db:studio        # 数据库管理界面

# 🚀 部署
npm run deploy:check     # 部署前检查
npm run deploy:build     # 检查并构建
```

### 🧪 调试工具

| 工具 | 路径 | 用途 |
|------|------|------|
| 健康检查 | `/api/health` | 系统状态监控 |
| API文档 | `/api-docs` | 交互式API文档 |
| 数据库管理 | `npm run db:studio` | 可视化数据库操作 |
| 调试页面 | `/tests/debug/` | 功能测试页面 |

## 📚 文档导航

### 📖 核心文档

| 文档 | 描述 | 链接 |
|------|------|------|
| 🚀 **快速开始** | 环境配置和部署指南 | [DEPLOYMENT_CHECKLIST_V2.md](./docs/DEPLOYMENT_CHECKLIST_V2.md) |
| 🔐 **安全配置** | 认证、CORS、限流配置 | [SECURITY.md](./docs/SECURITY.md) |
| 🗄️ **数据库架构** | 双库分离设计说明 | [DATABASE_SEPARATION.md](./docs/DATABASE_SEPARATION.md) |
| 📡 **API参考** | 完整的API接口文档 | [API_REFERENCE.md](./docs/API_REFERENCE.md) |

### 🔧 技术文档

<details>
<summary>点击展开完整文档列表</summary>

- [环境变量配置](./docs/ENVIRONMENT_VARIABLES.md)
- [GitHub OAuth设置](./GITHUB_OAUTH_SETUP.md)
- [响应式优化](./docs/RESPONSIVE_OPTIMIZATION.md)
- [软件管理系统](./docs/SOFTWARE_MANAGEMENT_COMPLETE_SUMMARY.md)
- [版本管理功能](./docs/VERSION_MANAGEMENT_FIXES.md)

</details>

## 🤝 贡献与支持

### 💡 贡献指南

```bash
# 1. Fork 项目
git clone https://github.com/your-username/hono-nextjs.git

# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m "feat: add amazing feature"

# 4. 推送并创建 PR
git push origin feature/amazing-feature
```

### 📞 获取帮助

- 🐛 **Bug报告**: [创建Issue](https://github.com/your-repo/issues/new?template=bug_report.md)
- 💡 **功能建议**: [创建Issue](https://github.com/your-repo/issues/new?template=feature_request.md)
- 💬 **讨论交流**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 自由使用、修改和分发。

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/hono-nextjs?style=social)](https://github.com/your-repo/hono-nextjs/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/hono-nextjs?style=social)](https://github.com/your-repo/hono-nextjs/network/members)

**版本**: 2.0.0 | **最后更新**: 2025-01-29

</div>

# 🚀 LACS API Server

现代化的API服务器，提供激活码管理、软件管理和用户行为统计的完整解决方案。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 核心功能

| 功能模块 | 描述 |
|---------|------|
| 🔑 **激活码管理** | 生成、验证、统计激活码，支持批量操作和过期管理 |
| 📦 **软件管理** | 软件信息管理、版本历史追踪、公告发布 |
| 📊 **用户行为统计** | 软件激活统计、设备连接追踪、使用分析 |
| 🛡️ **安全认证** | API Key认证、CORS控制、请求限流 |
| 💾 **统一数据库** | 简化的单数据库架构，降低维护复杂度 |

## 🛠️ 技术架构

```
Backend:  Next.js 14 API Routes + Hono Framework
Database: Neon PostgreSQL + Drizzle ORM (统一数据库)
Auth:     API Key + JWT认证
Deploy:   Vercel + Edge Functions
```

## 🚀 快速开始

### 📋 环境要求

- Node.js 18+
- Neon PostgreSQL 数据库

### 🔧 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd hono-nextjs

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 4. 初始化数据库
npm run db:push

# 5. 启动开发服务器
npm run dev
```

### 🔐 环境变量配置

```env
# 数据库配置（统一数据库）
DATABASE_URL='postgresql://user:pass@host:port/database?sslmode=require'

# API 安全配置
API_KEY=your-secret-api-key-here
ENABLE_API_KEY_AUTH=true

# CORS 配置
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
```

## 📚 API 文档

### 🔗 文档链接

| 文档类型 | 链接 | 描述 |
|---------|------|------|
| 🚀 **API使用指南** | [API_USAGE_GUIDE.md](./docs/API_USAGE_GUIDE.md) | 完整的API集成指南 |
| 📖 **API参考文档** | [API_REFERENCE.md](./docs/API_REFERENCE.md) | 详细的API端点文档 |

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

# 公告管理
GET    /app/software/id/{id}/announcements      # 获取公告列表
POST   /app/software/id/{id}/announcements      # 添加新公告

# 用户行为统计
GET    /api/user-behavior/stats       # 获取综合统计
POST   /api/user-behavior/activations # 记录软件激活
POST   /api/user-behavior/device-connections # 记录设备连接
```

### 🔐 认证方式

```bash
# API Key 认证
curl -H "X-API-Key: your-api-key" https://your-domain.com/api/endpoint
```

> 📖 查看 [完整API文档](./docs/API_REFERENCE.md) 了解详细的请求/响应格式

## 🔒 安全特性

| 安全层级 | 功能 | 配置 |
|---------|------|------|
| **认证** | API Key认证 | `ENABLE_API_KEY_AUTH=true` |
| **CORS** | 来源控制 | `ALLOWED_ORIGINS=domain1,domain2` |
| **限流** | 请求频率限制 | 内置限流机制 |
| **加密** | HTTPS传输 | 自动SSL加密 |

## 🛠️ 开发工具

### 📝 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建生产版本
npm run start            # 启动生产服务器

# 数据库
npm run db:generate      # 生成迁移文件
npm run db:push          # 推送到数据库
npm run db:studio        # 数据库管理界面
```

### 🧪 调试工具

| 工具 | 路径 | 用途 |
|------|------|------|
| 健康检查 | `/api/health` | 系统状态监控 |
| 数据库管理 | `npm run db:studio` | 可视化数据库操作 |

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) - 自由使用、修改和分发。

---

<div align="center">

**版本**: 2.0.0 | **最后更新**: 2025-08-01

</div>

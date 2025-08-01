# 📋 更新日志

所有重要的项目变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [2.1.0] - 2025-08-01

### 🆕 新增功能

- **currentVersionId 字段**: 所有软件API响应现在包含 `currentVersionId` 字段
  - 指向版本历史表中最新稳定版本的ID
  - 支持智能版本关联和快速访问版本详情
  - 自动选择最新稳定版本（`isStable: true`）
- **增强版本管理函数**: 新增 `getLatestVersionWithId()` 函数
- **完整的软件管理API**: 支持创建、更新、删除软件
- **软件API客户端**: 新增 `utils/software-api.ts` 统一API调用

### 🔧 改进

- **API响应结构优化**: 统一软件相关API的响应格式
- **TypeScript类型定义**: 更新所有相关接口定义
- **错误处理增强**: 改进版本获取的错误处理逻辑
- **向后兼容性**: 保留原有 `getLatestVersion()` 函数

### 📚 文档更新

- **API参考文档**: 更新 `docs/API_REFERENCE.md` 包含新功能
- **软件API文档**: 新增 `docs/SOFTWARE_API_REFERENCE.md` 专门文档
- **README更新**: 添加新功能说明和API端点
- **代码示例**: 提供 `currentVersionId` 使用示例

### 🧪 测试

- **API测试**: 验证所有软件管理API端点
- **版本关联测试**: 确认 `currentVersionId` 正确指向最新版本
- **兼容性测试**: 验证现有功能不受影响

## [2.0.0] - 2025-07-30

### 🔄 重大变更

- **统一数据库架构**: 合并激活码、软件管理和用户行为数据库
- **API路径调整**: 软件管理API从 `/api/app/software` 调整为 `/app/software`
- **数据库迁移**: 使用 Drizzle ORM 统一管理数据库架构

### 🆕 新增功能

- **多下载源支持**: 版本历史支持多个下载链接
- **软件分类和标签**: 增强软件组织和搜索功能
- **版本类型管理**: 支持 release、beta、alpha 等版本类型
- **公告系统**: 软件公告发布和管理功能

### 🔧 改进

- **性能优化**: 数据库查询优化和索引改进
- **安全增强**: API Key认证和CORS配置优化
- **错误处理**: 统一错误响应格式

### 📚 文档

- **部署指南**: 新增统一数据库部署文档
- **API文档**: 更新所有API端点文档
- **迁移指南**: 提供从旧版本迁移的详细步骤

## [1.0.0] - 2024-01-01

### 🎉 初始发布

- **激活码管理**: 生成、验证、统计激活码功能
- **软件管理**: 基础软件信息管理功能
- **用户认证**: GitHub OAuth 认证系统
- **API安全**: API Key认证和速率限制
- **健康检查**: 系统状态监控端点
- **前端界面**: 管理员控制台界面

### 🛠️ 技术栈

- **后端**: Next.js 14 API Routes + Hono Framework
- **数据库**: Neon PostgreSQL + Drizzle ORM
- **认证**: GitHub OAuth + JWT
- **部署**: Vercel + Edge Functions
- **前端**: React + Ant Design

---

## 📝 说明

### 版本号规则

- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 变更类型

- `🆕 新增功能` - 新功能
- `🔧 改进` - 对现有功能的改进
- `🐛 修复` - Bug修复
- `🔄 重大变更` - 不兼容的变更
- `📚 文档` - 文档相关变更
- `🧪 测试` - 测试相关变更
- `🛠️ 技术栈` - 技术栈变更

### 链接格式

- [2.1.0]: https://github.com/your-repo/compare/v2.0.0...v2.1.0
- [2.0.0]: https://github.com/your-repo/compare/v1.0.0...v2.0.0
- [1.0.0]: https://github.com/your-repo/releases/tag/v1.0.0

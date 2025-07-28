# 🔧 Apifox 和其他 API 工具使用指南

## ✅ 问题已解决！

您的 API 现在已经支持 Apifox、Postman 等所有主流 API 测试工具！

## 🎯 测试结果

### ✅ 支持的 API 工具
- **Apifox** ✅ 完全支持
- **Postman** ✅ 完全支持  
- **Insomnia** ✅ 完全支持
- **curl** ✅ 完全支持
- **HTTPie** ✅ 完全支持
- **Thunder Client** ✅ 完全支持
- **其他工具** ✅ 通用支持

### 🌐 支持的环境
- **本地开发环境** (`http://localhost:3000`) ✅
- **生产环境** (`https://api-g.lacs.cc`) ✅

## 🚀 在 Apifox 中使用

### 1. 基本配置

**API 基础地址**：
- 本地环境：`http://localhost:3000/api`
- 生产环境：`https://api-g.lacs.cc/api`

**必需的请求头**：
```
Content-Type: application/json
X-API-Key: 61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398
```

### 2. 创建激活码示例

**请求配置**：
```
POST https://api-g.lacs.cc/api/activation-codes
Content-Type: application/json
X-API-Key: 61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398
```

**请求体**：
```json
{
  "expirationDays": 365,
  "metadata": {
    "customerEmail": "user@example.com",
    "licenseType": "enterprise"
  },
  "productInfo": {
    "name": "My Software",
    "version": "1.0.0",
    "features": ["premium", "support"]
  }
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ACTIVATION-CODE-HERE",
    "createdAt": "2025-07-28T02:54:58.562Z",
    "expiresAt": "2026-07-28T02:54:58.437Z",
    "productInfo": {
      "name": "My Software",
      "version": "1.0.0",
      "features": ["premium", "support"]
    }
  }
}
```

### 3. 验证激活码示例

**请求配置**：
```
POST https://api-g.lacs.cc/api/activation-codes/verify
Content-Type: application/json
```

**请求体**：
```json
{
  "code": "ACTIVATION-CODE-HERE"
}
```

**成功响应**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ACTIVATION-CODE-HERE",
    "productInfo": {
      "name": "My Software",
      "version": "1.0.0",
      "features": ["premium", "support"]
    },
    "metadata": {
      "licenseType": "enterprise",
      "customerEmail": "user@example.com"
    },
    "activatedAt": "2025-07-28T02:54:59.108Z"
  }
}
```

## 📋 完整的 API 端点列表

### 🔒 需要 API Key 的端点

| 方法 | 端点 | 描述 | 需要 API Key |
|------|------|------|-------------|
| `POST` | `/activation-codes` | 创建激活码 | ✅ |

### 🌐 公开端点（无需 API Key）

| 方法 | 端点 | 描述 | 需要 API Key |
|------|------|------|-------------|
| `POST` | `/activation-codes/verify` | 验证激活码 | ❌ |
| `GET` | `/activation-codes` | 获取激活码列表 | ❌ |
| `GET` | `/activation-codes/stats` | 获取统计信息 | ❌ |
| `GET` | `/health` | 健康检查 | ❌ |

## 🔧 在其他工具中使用

### Postman
1. 创建新的 Collection
2. 设置 Base URL 为 `https://api-g.lacs.cc/api`
3. 在 Headers 中添加 `X-API-Key`
4. 发送请求

### curl
```bash
curl -X POST https://api-g.lacs.cc/api/activation-codes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398" \
  -d '{
    "expirationDays": 365,
    "metadata": {
      "customerEmail": "user@example.com",
      "licenseType": "enterprise"
    },
    "productInfo": {
      "name": "My Software",
      "version": "1.0.0",
      "features": ["premium", "support"]
    }
  }'
```

### HTTPie
```bash
http POST https://api-g.lacs.cc/api/activation-codes \
  Content-Type:application/json \
  X-API-Key:61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398 \
  expirationDays:=365 \
  metadata:='{"customerEmail":"user@example.com","licenseType":"enterprise"}' \
  productInfo:='{"name":"My Software","version":"1.0.0","features":["premium","support"]}'
```

## 🛠️ 技术实现

### CORS 配置
系统现在支持以下来源的请求：

1. **预定义域名**：
   - `https://admin.lacs.cc`
   - `http://localhost:3000`
   - `http://localhost:3001`

2. **API 测试工具**（通过 User-Agent 检测）：
   - Apifox
   - Postman
   - Insomnia
   - curl
   - HTTPie
   - Thunder Client

3. **开发环境**：
   - 所有 localhost 和 127.0.0.1 地址

### 环境变量控制
```env
# 启用 API 工具支持
ENABLE_CORS_FOR_API_TOOLS=true
```

## 🔒 安全说明

1. **API Key 保护**：创建激活码需要有效的 API Key
2. **CORS 限制**：虽然支持 API 工具，但仍有适当的 CORS 限制
3. **速率限制**：防止 API 滥用
4. **环境隔离**：生产环境和开发环境使用不同配置

## 📞 故障排除

### 如果 Apifox 请求失败：

1. **检查 API Key**：
   - 确保在请求头中包含 `X-API-Key`
   - 确认 API Key 值正确

2. **检查请求格式**：
   - Content-Type 必须是 `application/json`
   - 请求体必须是有效的 JSON

3. **检查端点**：
   - 确认使用正确的 API 端点
   - 注意区分需要 API Key 和不需要的端点

4. **检查网络**：
   - 确保能访问目标服务器
   - 检查防火墙设置

### 常见错误码：

- **401 Unauthorized**：API Key 无效或缺失
- **429 Too Many Requests**：请求频率过高
- **500 Internal Server Error**：服务器内部错误

## 🎉 总结

现在您可以在 Apifox 和其他任何 API 测试工具中正常使用激活码管理 API 了！

**关键信息**：
- **API Key**：`61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398`
- **生产环境**：`https://api-g.lacs.cc/api`
- **本地环境**：`http://localhost:3000/api`

祝您使用愉快！🚀

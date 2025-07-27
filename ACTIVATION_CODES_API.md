# 激活码管理 API 文档

本文档描述了软件激活码管理系统的 API 接口。

## 概述

激活码系统提供以下功能：
- 生成唯一的激活码
- 验证激活码有效性
- 查询激活码列表
- 获取单个激活码详情
- 删除激活码

## 数据结构

### ActivationCode 对象

```typescript
interface ActivationCode {
  id: string              // 唯一标识符
  code: string            // 激活码
  createdAt: string       // 创建时间 (ISO 8601)
  expiresAt: string       // 过期时间 (ISO 8601)
  isUsed: boolean         // 是否已使用
  usedAt?: string         // 使用时间 (ISO 8601)
  metadata?: object       // 自定义元数据
  productInfo?: {         // 产品信息
    name: string
    version: string
    features: string[]
  }
}
```

## API 接口

### 1. 生成激活码

**POST** `/api/activation-codes`

生成一个新的激活码。

#### 请求体

```json
{
  "expirationDays": 365,           // 可选，过期天数，默认 365
  "metadata": {                    // 可选，自定义元数据
    "customerEmail": "user@example.com",
    "licenseType": "enterprise"
  },
  "productInfo": {                 // 可选，产品信息
    "name": "My Software",
    "version": "1.0.0",
    "features": ["premium", "support"]
  }
}
```

#### 响应

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ABC123-DEF456-GHI789",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "productInfo": {
      "name": "My Software",
      "version": "1.0.0",
      "features": ["premium", "support"]
    }
  }
}
```

### 2. 验证激活码

**POST** `/api/activation-codes/verify`

验证激活码并标记为已使用。

#### 请求体

```json
{
  "code": "ABC123-DEF456-GHI789"
}
```

#### 响应

成功时：
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "code": "ABC123-DEF456-GHI789",
    "productInfo": {
      "name": "My Software",
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

失败时：
```json
{
  "success": false,
  "error": "Invalid activation code"
}
```

### 3. 获取激活码列表

**GET** `/api/activation-codes`

获取激活码列表，支持分页和状态过滤。

#### 查询参数

- `page`: 页码，默认 1
- `limit`: 每页数量，默认 10
- `status`: 状态过滤，可选值：`all`、`used`、`unused`、`expired`

#### 示例

```
GET /api/activation-codes?page=1&limit=5&status=unused
```

#### 响应

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
          "name": "My Software",
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

### 4. 获取单个激活码详情

**GET** `/api/activation-codes/:id`

根据 ID 获取激活码的详细信息。

#### 响应

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
      "name": "My Software",
      "version": "1.0.0",
      "features": ["premium"]
    },
    "metadata": {
      "customerEmail": "user@example.com"
    }
  }
}
```

### 5. 删除激活码

**DELETE** `/api/activation-codes/:id`

根据 ID 删除激活码。

#### 响应

```json
{
  "success": true,
  "message": "Activation code deleted successfully"
}
```

## 错误处理

所有接口在出错时都会返回以下格式：

```json
{
  "success": false,
  "error": "错误描述"
}
```

常见错误码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### JavaScript/Node.js

```javascript
// 生成激活码
const response = await fetch('/api/activation-codes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    expirationDays: 30,
    productInfo: {
      name: 'My App',
      version: '1.0.0',
      features: ['basic']
    }
  })
})

const result = await response.json()
console.log(result.data.code) // 激活码

// 验证激活码
const verifyResponse = await fetch('/api/activation-codes/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'ABC123-DEF456-GHI789'
  })
})

const verifyResult = await verifyResponse.json()
if (verifyResult.success) {
  console.log('激活成功！', verifyResult.data)
} else {
  console.log('激活失败：', verifyResult.error)
}
```

## 测试

运行测试脚本：

```bash
# 安装依赖
npm install undici

# 启动开发服务器
npm run dev

# 在另一个终端运行测试
node test-activation-codes.js
```

## 部署注意事项

1. **环境变量配置**：确保在 Vercel 中配置了 KV 数据库
2. **安全性**：在生产环境中建议添加 API 认证
3. **监控**：建议添加日志记录和错误监控
4. **备份**：定期备份激活码数据

## 扩展功能

可以考虑添加的功能：
- 批量生成激活码
- 激活码使用统计
- 激活码导出功能
- 邮件发送激活码
- 激活码续期功能

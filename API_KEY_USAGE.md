# 🔑 API Key 验证使用指南

## ✅ 配置完成

您的激活码管理系统已成功启用 API Key 验证！

### 🔐 您的 API Key
```
61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398
```

**⚠️ 重要提醒：请妥善保管此 API Key，不要在公开场所分享！**

## 📋 验证结果

根据测试结果，API Key 验证工作正常：

- ✅ **无 API Key 请求**：正确拒绝（401 错误）
- ✅ **错误 API Key 请求**：正确拒绝（401 错误）  
- ✅ **正确 API Key 请求**：成功处理（200 成功）
- ✅ **验证激活码**：无需 API Key，正常工作

## 🚀 如何使用

### 1. 创建激活码（需要 API Key）

```bash
curl -X POST http://localhost:3000/api/activation-codes \
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

### 2. JavaScript/Node.js 示例

```javascript
const API_KEY = '61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398';

async function createActivationCode() {
  const response = await fetch('http://localhost:3000/api/activation-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    },
    body: JSON.stringify({
      expirationDays: 365,
      metadata: {
        customerEmail: "user@example.com",
        licenseType: "enterprise"
      },
      productInfo: {
        name: "My Software",
        version: "1.0.0",
        features: ["premium", "support"]
      }
    })
  });

  const result = await response.json();
  console.log(result);
}
```

### 3. Python 示例

```python
import requests

API_KEY = '61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398'

def create_activation_code():
    url = 'http://localhost:3000/api/activation-codes'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
    }
    data = {
        'expirationDays': 365,
        'metadata': {
            'customerEmail': 'user@example.com',
            'licenseType': 'enterprise'
        },
        'productInfo': {
            'name': 'My Software',
            'version': '1.0.0',
            'features': ['premium', 'support']
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```

## 🔒 受保护的端点

目前需要 API Key 的端点：

- `POST /api/activation-codes` - 创建激活码

## 🌐 公开端点（无需 API Key）

- `POST /api/activation-codes/verify` - 验证激活码
- `GET /api/activation-codes` - 获取激活码列表
- `GET /api/activation-codes/stats` - 获取统计信息
- `GET /api/health` - 健康检查

## ⚙️ 环境变量配置

在您的 `.env.local` 文件中：

```env
# 启用 API Key 验证
ENABLE_API_KEY_AUTH=true

# API Key
API_KEY=61193d820fd9c87f8efd2f87e14f553a7d15daca6eeeb3305da5d56bf41fd398

# 启用速率限制
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

## 🛡️ 安全建议

1. **保密性**：不要在代码仓库、日志或公开场所暴露 API Key
2. **环境隔离**：生产环境使用不同的 API Key
3. **定期轮换**：建议定期更换 API Key
4. **HTTPS**：生产环境务必使用 HTTPS
5. **监控**：监控 API 使用情况，发现异常及时处理

## 🔄 如何更换 API Key

1. 生成新的 API Key：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. 更新 `.env.local` 文件中的 `API_KEY` 值

3. 重启服务器

4. 更新所有客户端代码中的 API Key

## 📞 故障排除

### 401 错误：Invalid or missing API Key
- 检查请求头是否包含 `X-API-Key`
- 确认 API Key 值是否正确
- 验证环境变量 `ENABLE_API_KEY_AUTH=true` 是否设置

### 429 错误：Rate limit exceeded
- 请求频率过高，等待一段时间后重试
- 检查 `RATE_LIMIT_MAX_REQUESTS` 和 `RATE_LIMIT_WINDOW_MS` 配置

## 📈 监控和日志

系统会记录以下信息：
- API Key 验证失败的请求
- 速率限制触发的请求
- 激活码创建和验证的操作日志

建议在生产环境中配置适当的日志监控和告警。

# 用户行为API端点认证机制修改说明

## 修改概述

根据要求，对用户行为相关的API端点进行了访问控制和认证机制的修改：

### 修改的API端点

| 方法 | 端点 | 描述 | 新的认证机制 |
|------|------|------|-------------|
| GET | `/api/user-behavior/stats` | 获取综合统计信息 | GitHub OAuth |
| POST | `/api/user-behavior/usage` | 记录软件使用 | 专用API Key + 频率限制 |
| GET | `/api/user-behavior/usage` | 获取使用统计 | GitHub OAuth |
| POST | `/api/user-behavior/device-connections` | 记录设备连接 | 专用API Key + 频率限制 |
| GET | `/api/user-behavior/device-connections` | 获取设备连接统计 | GitHub OAuth |

## 具体修改内容

### 1. GET端点访问控制修改

**修改的端点：**
- `/api/user-behavior/stats` (获取综合统计信息)
- `/api/user-behavior/usage` (获取使用统计)
- `/api/user-behavior/device-connections` (获取设备连接统计)

**新的访问控制：**
- 只有通过GitHub OAuth登录的用户才能访问这些端点
- 使用 `validateGitHubOAuth()` 函数验证JWT token
- 未认证的请求返回401错误

### 2. POST端点认证机制修改

**修改的端点：**
- `/api/user-behavior/usage` (记录软件使用)
- `/api/user-behavior/device-connections` (记录设备连接)

**新的认证机制：**
- 使用专用的 `USER_BEHAVIOR_RECORD_API_KEY` 进行验证
- 该API Key与其他API端点使用的API Key区别开来
- 使用 `validateUserBehaviorRecordApiKey()` 函数进行验证

### 3. POST端点频率限制

**限制规则：**
- 同一个IP地址在10秒内只能访问每个POST记录API一次
- 使用IP级别的频率限制，每个端点独立计算
- 超出频率限制时返回429状态码和 `Retry-After` 头部

**实现细节：**
- 使用 `checkUserBehaviorRateLimit()` 函数检查频率限制
- 使用 `getClientIp()` 函数获取客户端真实IP地址
- 支持 `x-forwarded-for`、`x-real-ip`、`cf-connecting-ip` 等头部

## 新增的函数和功能

### 1. 频率限制相关

```typescript
// 检查用户行为记录API的频率限制
checkUserBehaviorRateLimit(clientIp: string, endpoint: string, windowMs?: number)

// 获取客户端IP地址
getClientIp(request: Request): string
```

### 2. 专用API Key验证

```typescript
// 用户行为记录API专用的API Key验证
validateUserBehaviorRecordApiKey(request: Request): ApiKeyValidationResult
```

## 环境变量配置

### 新增环境变量

在 `.env.example` 中添加了新的环境变量：

```bash
# 用户行为记录API专用的API Key
USER_BEHAVIOR_RECORD_API_KEY=your_user_behavior_record_api_key
```

### 相关环境变量

```bash
# GitHub OAuth 认证配置
ENABLE_GITHUB_OAUTH_AUTH=true
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here

# 授权的 GitHub 用户
ALLOWED_GITHUB_USERNAME=your_github_username
ALLOWED_GITHUB_EMAIL=your_email@example.com
```

## 错误响应示例

### 1. GET端点未认证

```json
{
  "success": false,
  "error": "GitHub OAuth authentication required"
}
```

### 2. POST端点API Key错误

```json
{
  "success": false,
  "error": "Invalid or missing API Key for user behavior recording"
}
```

### 3. 频率限制超出

```json
{
  "success": false,
  "error": "Rate limit exceeded. Please wait 8 seconds before trying again."
}
```

响应头部包含：
```
Status: 429 Too Many Requests
Retry-After: 8
```

## 测试说明

### 运行测试脚本

项目中包含了测试脚本 `test-api-endpoints.js`，可以用来验证修改后的认证机制：

```bash
# 安装依赖（如果在Node.js环境中运行）
npm install node-fetch

# 运行测试
node test-api-endpoints.js
```

### 手动测试

1. **测试POST端点：**
   ```bash
   # 无API Key（应返回401）
   curl -X POST http://localhost:3000/api/user-behavior/usage \
     -H "Content-Type: application/json" \
     -d '{"softwareId":1,"deviceFingerprint":"test"}'

   # 正确API Key（应成功）
   curl -X POST http://localhost:3000/api/user-behavior/usage \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your_user_behavior_record_api_key" \
     -d '{"softwareId":1,"deviceFingerprint":"test"}'
   ```

2. **测试GET端点：**
   ```bash
   # 无认证（应返回401）
   curl http://localhost:3000/api/user-behavior/stats

   # 需要通过前端管理页面登录后获取JWT token进行测试
   ```

## 注意事项

1. **环境变量设置：** 确保在 `.env` 文件中设置了 `USER_BEHAVIOR_RECORD_API_KEY`
2. **GitHub OAuth配置：** 确保GitHub OAuth相关环境变量已正确配置
3. **频率限制：** 频率限制使用内存存储，重启服务器会重置限制计数
4. **生产环境：** 建议在生产环境中使用Redis等持久化存储来管理频率限制
5. **IP获取：** 在代理或负载均衡器后面时，确保正确配置IP转发头部

## 兼容性说明

- 修改保持了原有的CORS配置和安全检查
- 保持了原有的错误处理和响应格式
- 向后兼容，不影响其他API端点的功能

# 📡 LACS API Server 使用指南

> 🚀 完整的API集成指南，从入门到精通

## 🎯 快速导航

| 章节 | 内容 | 适用场景 |
|------|------|----------|
| [🚀 快速开始](#-快速开始) | 5分钟上手指南 | 新手入门 |
| [🔐 认证方式](#-认证方式) | API Key认证 | 安全集成 |
| [🔑 激活码管理](#-激活码管理api) | 激活码相关API | 许可证管理 |
| [📦 软件管理](#-软件管理api) | 软件信息管理API | 软件发布 |
| [📊 访问量统计](#-访问量统计功能说明) | 访问量统计和排行榜 | 数据分析 |
| [🔧 管理员功能](#-管理员访问量管理api) | 访问量管理和重置 | 系统管理 |
| [📊 用户行为统计](#-用户行为统计api) | 使用统计API | 数据分析 |
| [🚨 错误处理](#-错误处理) | 状态码和错误处理 | 异常处理 |
| [💻 代码示例](#-代码示例) | 多语言集成示例 | 实际开发 |

## 🚀 快速开始

### 📋 基础信息

```bash
# 基础URL
Production:  https://api-g.lacs.cc
Development: http://localhost:3000

# 认证方式
API Key:     X-API-Key: your-api-key

# 数据格式
Content-Type: application/json
Accept: application/json
```

### ⚡ 5分钟快速测试

```bash
# 1. 健康检查
curl https://your-domain.com/api/health

# 2. 生成激活码
curl -X POST "https://your-domain.com/api/activation-codes" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'

# 3. 获取软件列表
curl "https://your-domain.com/app/software" \
  -H "X-API-Key: your-api-key"

# 4. 获取软件详情（会自动增加访问量）
curl "https://your-domain.com/app/software/id/1" \
  -H "X-API-Key: your-api-key"

# 5. 获取访问量排行榜
curl "https://your-domain.com/app/software/ranking?limit=5" \
  -H "X-API-Key: your-api-key"

# 6. 获取统计信息
curl "https://your-domain.com/api/user-behavior/stats" \
  -H "X-API-Key: your-api-key"
```

## 🔐 认证方式

### API Key 认证

所有API请求都需要在请求头中包含API Key：

```http
X-API-Key: your-api-key-here
```

**示例**:
```bash
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     https://your-domain.com/api/endpoint
```

### 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2025-08-01T00:00:00.000Z"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误类型",
  "message": "详细错误信息",
  "code": 400,
  "timestamp": "2025-08-01T00:00:00.000Z"
}
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  })
});

const { token } = await authResponse.json();

// 使用JWT Token
const response = await fetch('/admin/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔑 激活码管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/api/activation-codes` | 生成激活码 | API Key |
| POST | `/api/activation-codes/verify` | 验证激活码 | API Key |
| GET | `/api/activation-codes` | 查询激活码列表 | API Key |
| GET | `/api/activation-codes/stats` | 获取统计信息 | API Key |
| POST | `/api/activation-codes/cleanup` | 清理过期激活码 | API Key |
| POST | `/api/activation-codes/cleanup-unused` | 清理未使用激活码 | API Key |

### 🎲 生成激活码

**端点**：`POST /api/activation-codes`

**请求参数**：
```json
{
  "expirationDays": 365,          // 过期天数（必需）
  "metadata": {                   // 元数据（可选）
    "purpose": "license",
    "features": ["feature1", "feature2"],
    "userId": "user123"
  },
  "productInfo": {                // 产品信息（可选）
    "name": "软件名称",
    "version": "1.0.0",
    "edition": "professional"
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "code": "MDMNBPJX-3S0P6E-B1360C10",
    "id": 123,
    "createdAt": "2025-01-29T10:00:00.000Z",
    "expiresAt": "2026-01-29T10:00:00.000Z",
    "isActivated": false,
    "metadata": {
      "purpose": "license",
      "features": ["feature1", "feature2"]
    }
  },
  "message": "激活码生成成功"
}
```

### ✅ 验证激活码

**端点**：`POST /api/activation-codes/verify`

**请求参数**：
```json
{
  "code": "MDMNBPJX-3S0P6E-B1360C10"  // 激活码（必需）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "code": "MDMNBPJX-3S0P6E-B1360C10",
    "isValid": true,
    "isActivated": true,
    "activatedAt": "2025-01-29T10:05:00.000Z",
    "expiresAt": "2026-01-29T10:00:00.000Z",
    "metadata": {
      "purpose": "license",
      "features": ["feature1", "feature2"]
    },
    "productInfo": {
      "name": "软件名称",
      "version": "1.0.0"
    }
  },
  "message": "激活码验证成功"
}
```

### 📋 查询激活码列表

**端点**：`GET /api/activation-codes`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10，最大：100）
&status=all          # 状态筛选：all|active|expired|used
&search=MDMNBPJX     # 搜索关键词
&sortBy=createdAt    # 排序字段：createdAt|expiresAt|activatedAt
&sortOrder=desc      # 排序方向：asc|desc
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "code": "MDMNBPJX-3S0P6E-B1360C10",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "expiresAt": "2026-01-29T10:00:00.000Z",
      "isActivated": true,
      "activatedAt": "2025-01-29T10:05:00.000Z",
      "metadata": {
        "purpose": "license"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 📊 获取统计信息

**端点**：`GET /api/activation-codes/stats`

**响应示例**：
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "active": 750,
    "expired": 200,
    "used": 600,
    "unused": 400,
    "recentlyCreated": 50,
    "recentlyActivated": 30,
    "expiringThisWeek": 25,
    "activationRate": 60.0,
    "dailyStats": [
      {
        "date": "2025-01-29",
        "created": 10,
        "activated": 8
      }
    ]
  }
}
```

## 📦 软件管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software` | 获取软件列表 | API Key |
| GET | `/app/software/tags` | 获取所有可用标签 | API Key |
| POST | `/app/software` | 添加新软件 | API Key |
| GET | `/app/software/id/{id}` | 获取软件详情（含访问量统计） | API Key |
| GET | `/app/software/{name}` | 根据名称获取软件 | API Key |
| GET | `/app/software/ranking` | 获取访问量排行榜 | API Key |
| PUT | `/app/software/id/{id}` | 更新软件信息 | API Key |
| DELETE | `/app/software/id/{id}` | 删除软件 | API Key |

#### 🔧 管理员专用接口

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/admin/software/view-count` | 获取访问量统计数据 | API Key |
| POST | `/admin/software/view-count` | 重置软件访问量 | API Key |

### 📋 获取软件列表

**端点**：`GET /app/software`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&category=tools      # 分类筛选
&tags=utility,productivity  # 标签筛选（多个标签用逗号分隔）
&search=软件名       # 搜索关键词
&sortBy=name         # 排序字段
&sortOrder=asc       # 排序方向
```

**标签筛选说明**：
- 支持单个标签：`?tags=utility`
- 支持多个标签：`?tags=utility,productivity,tools`
- 多个标签使用OR逻辑：软件包含任意一个标签即可匹配
- 标签名称区分大小写
- 自动去除空格和空标签

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "示例软件",
      "nameEn": "Example Software",
      "description": "这是一个示例软件",
      "descriptionEn": "This is an example software",
      "currentVersion": "1.0.0",
      "category": "tools",
      "tags": ["utility", "productivity"],
      "officialWebsite": "https://example.com",
      "openname": "main.exe",
      "filetype": "zip",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-01-29T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 🏷️ 根据标签获取软件

**端点**：`GET /app/software?tags=tag1,tag2`

**使用示例**：
```bash
# 获取包含"utility"标签的软件
curl "https://your-domain.com/app/software?tags=utility" \
  -H "X-API-Key: your-api-key"

# 获取包含多个标签的软件（OR逻辑）
curl "https://your-domain.com/app/software?tags=utility,productivity,tools" \
  -H "X-API-Key: your-api-key"

# 结合其他筛选条件
curl "https://your-domain.com/app/software?tags=utility&category=tools&page=1&limit=10" \
  -H "X-API-Key: your-api-key"
```

**JavaScript示例**：
```javascript
// 获取包含特定标签的软件
const utilitySoftware = await api.getSoftwareList({ tags: 'utility' });

// 获取包含多个标签的软件
const productivitySoftware = await api.getSoftwareList({
  tags: 'utility,productivity,tools'
});

// 结合分类和标签筛选
const filteredSoftware = await api.getSoftwareList({
  category: 'tools',
  tags: 'utility,productivity',
  page: 1,
  limit: 20
});
```

**Python示例**：
```python
# 获取包含特定标签的软件
utility_software = api.get_software_list(tags='utility')

# 获取包含多个标签的软件
productivity_software = api.get_software_list(tags='utility,productivity,tools')

# 结合其他筛选条件
filtered_software = api.get_software_list(
    category='tools',
    tags='utility,productivity',
    page=1,
    limit=20
)
```

### 🏷️ 获取所有可用标签

**端点**：`GET /app/software/tags`

**查询参数**：
```bash
?includeCount=true   # 是否包含标签使用次数
&minCount=1          # 最小使用次数筛选
&sortBy=name         # 排序字段：name|count
&sortOrder=asc       # 排序方向：asc|desc
```

**响应示例（不包含计数）**：
```json
{
  "success": true,
  "data": {
    "tags": [
      "utility",
      "productivity",
      "tools",
      "development",
      "design"
    ],
    "total": 5
  }
}
```

**响应示例（包含计数）**：
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "name": "utility",
        "count": 15
      },
      {
        "name": "productivity",
        "count": 12
      },
      {
        "name": "tools",
        "count": 8
      }
    ],
    "total": 3,
    "totalSoftware": 50
  }
}
```

**使用示例**：
```bash
# 获取所有标签
curl "https://your-domain.com/app/software/tags" \
  -H "X-API-Key: your-api-key"

# 获取标签及使用次数，按使用次数降序排列
curl "https://your-domain.com/app/software/tags?includeCount=true&sortBy=count&sortOrder=desc" \
  -H "X-API-Key: your-api-key"

# 只获取使用次数>=5的标签
curl "https://your-domain.com/app/software/tags?includeCount=true&minCount=5" \
  -H "X-API-Key: your-api-key"
```

### ➕ 添加新软件

**端点**：`POST /app/software`

**请求参数**：
```json
{
  "name": "新软件",                    // 软件名称（必需）
  "nameEn": "New Software",           // 英文名称（可选）
  "description": "软件描述",           // 描述（必需）
  "descriptionEn": "Software description", // 英文描述（可选）
  "currentVersion": "1.0.0",          // 当前版本（必需）
  "category": "tools",                // 分类（可选）
  "tags": ["utility", "productivity"], // 标签（可选）
  "officialWebsite": "https://example.com", // 官网（可选）
  "openname": "bypass/bypass.cmd",    // 启动文件名或命令（可选）
  "filetype": "7z",                   // 文件格式类型（可选）
  "metadata": {                       // 元数据（可选）
    "developer": "开发者名称",
    "license": "MIT",
    "platform": ["Windows", "macOS", "Linux"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新软件",
    "nameEn": "New Software",
    "description": "软件描述",
    "currentVersion": "1.0.0",
    "category": "tools",
    "createdAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "软件添加成功"
}
```

### 🔍 获取软件详情

**端点**：`GET /app/software/id/{id}` 或 `GET /app/software/{name}`

**新增字段说明**：
- `openname`（字符串，可选）：软件的启动文件名或命令，用于指导用户如何启动软件
  - 示例：`"bypass/bypass.cmd"`、`"main.exe"`、`"start.sh"`
- `filetype`（字符串，可选）：软件包的文件格式类型，帮助用户了解下载文件的格式
  - 示例：`"7z"`、`"zip"`、`"apk"`、`"exe"`、`"dmg"`
- `viewCount`（整数，必需）：软件的访问量统计，记录软件详情页面的访问次数
  - 每次访问软件详情接口时自动递增
  - 用于统计软件的受欢迎程度和使用情况

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "示例软件",
    "nameEn": "Example Software",
    "description": "详细的软件描述",
    "currentVersionId": 2,
    "latestDownloadUrl": "https://example.com/download/example-software-v1.2.0.exe",
    "currentVersion": "1.2.0",
    "category": "tools",
    "tags": ["utility", "productivity"],
    "officialWebsite": "https://example.com",
    "systemRequirements": {
      "os": ["Windows", "macOS"],
      "memory": "4GB",
      "storage": "100MB"
    },
    "openname": "bypass/bypass.cmd",
    "filetype": "7z",
    "viewCount": 1250,
    "metadata": {
      "developer": "开发者名称",
      "license": "MIT"
    },
    "createdAt": "2025-01-29T10:00:00.000Z",
    "updatedAt": "2025-01-29T12:00:00.000Z"
  },
    "versions": [
      {
        "id": 1,
        "version": "1.2.0",
        "releaseDate": "2025-01-29T12:00:00.000Z",
        "isStable": true
      }
    ],
    "announcements": [
      {
        "id": 1,
        "title": "版本更新通知",
        "type": "update",
        "priority": "normal",
        "publishedAt": "2025-01-29T12:00:00.000Z"
      }
    ]
  }
}
```

### 🆕 版本相关字段说明

从 v2.1.0 开始，所有软件相关的API响应都包含版本相关字段：

**currentVersionId 字段**：
- **类型**: `number | null`
- **含义**: 指向版本历史表中最新稳定版本的ID
- **选择逻辑**:
  1. 筛选稳定版本 (`isStable: true`)
  2. 按发布日期降序排序
  3. 按版本号语义化排序
  4. 返回最新版本的ID

**latestDownloadUrl 字段**：
- **类型**: `string | null`
- **含义**: 最新稳定版本的下载链接
- **选择逻辑**:
  1. 从最新稳定版本的 `downloadLinks` 中选择
  2. 优先级：official > quark > pan123 > baidu > thunder > backup[0]
  3. 如果没有可用链接则返回 `null`

**使用示例**：
```javascript
// 获取软件信息
const software = await fetch('/app/software/id/1')
const data = await software.json()

// 直接使用 latestDownloadUrl（推荐方式）
if (data.data.latestDownloadUrl) {
  console.log('最新版本下载链接:', data.data.latestDownloadUrl)
  // 可以直接用于下载按钮或链接
  window.open(data.data.latestDownloadUrl)
}

// 或者使用 currentVersionId 获取完整版本详情
if (data.data.currentVersionId) {
  const versions = await fetch('/app/software/id/1/versions')
  const versionData = await versions.json()

  const currentVersion = versionData.data.find(
    v => v.id === data.data.currentVersionId
  )

  console.log('完整下载链接信息:', currentVersion.downloadLinks)
}
```

## 📊 访问量统计功能说明

### 🔄 自动访问量统计机制

访问量统计功能会在每次调用 `GET /app/software/id/{id}` 接口时自动触发：

1. **自动递增**：每次成功访问软件详情页面，对应软件的 `viewCount` 字段会自动递增 1
2. **原子性操作**：使用数据库原子性操作确保并发访问时的数据一致性
3. **容错设计**：即使访问量更新失败，也不会影响软件详情的正常返回
4. **实时更新**：访问量统计实时生效，立即反映在后续的API响应中

### 🛡️ 防刷机制

为防止恶意刷访问量，系统实施了多层防护机制：

#### 频率限制
- **时间窗口**：1分钟
- **最大请求数**：同一IP对同一软件最多访问10次
- **封禁时长**：超限后自动封禁15分钟

#### 异常检测
- **规律性检测**：识别过于规律的访问模式（疑似机器人）
- **短时间大量访问**：检测30秒内超过5次的异常访问
- **智能处理**：异常访问不增加访问量但仍返回软件信息

#### 错误响应
当触发防刷机制时，API会返回 `429 Too Many Requests` 状态码：
```json
{
  "success": false,
  "error": "访问频率过高",
  "retryAfter": 900
}
```

### 🏆 获取访问量排行榜

**端点**：`GET /app/software/ranking`

**查询参数**：
```bash
?page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10，最大：100）
&category=tools      # 分类筛选（可选）
&tags=utility        # 标签筛选（可选）
&minViewCount=100    # 最小访问量筛选（可选）
&timeRange=all       # 时间范围：all|today|week|month|year（可选）
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "玩机管家",
      "nameEn": "Mobile Manager",
      "description": "专业的手机管理工具",
      "currentVersion": "1.0.0",
      "category": "tools",
      "tags": ["utility", "mobile"],
      "viewCount": 1250,
      "rank": 1,
      "officialWebsite": "https://example.com",
      "createdAt": "2025-01-29T10:00:00.000Z",
      "updatedAt": "2025-08-15T07:03:23.833Z"
    },
    {
      "id": 2,
      "name": "示例软件",
      "nameEn": "Example Software",
      "description": "另一个示例软件",
      "currentVersion": "2.0.0",
      "category": "productivity",
      "tags": ["productivity", "office"],
      "viewCount": 980,
      "rank": 2,
      "officialWebsite": "https://example2.com",
      "createdAt": "2025-01-28T10:00:00.000Z",
      "updatedAt": "2025-08-14T15:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "summary": {
    "totalSoftware": 50,
    "totalViews": 25000,
    "averageViews": 500
  }
}
```

**使用示例**：
```bash
# 获取访问量前10的软件
curl "https://your-domain.com/app/software/ranking?limit=10" \
  -H "X-API-Key: your-api-key"

# 获取特定分类的访问量排行榜
curl "https://your-domain.com/app/software/ranking?category=tools&limit=20" \
  -H "X-API-Key: your-api-key"

# 获取访问量超过100的软件排行榜
curl "https://your-domain.com/app/software/ranking?minViewCount=100" \
  -H "X-API-Key: your-api-key"
```

## � 管理员访问量管理API

### 📊 获取访问量统计数据

**端点**：`GET /admin/software/view-count`

**权限要求**：管理员API Key

**查询参数**：
```bash
?format=json             # 返回格式：json|csv（默认：json）
&startDate=2025-01-01    # 开始日期（可选）
&endDate=2025-01-31      # 结束日期（可选）
&minViewCount=100        # 最小访问量筛选（可选）
&maxViewCount=1000       # 最大访问量筛选（可选）
```

**响应示例（JSON格式）**：
```json
{
  "success": true,
  "data": {
    "statistics": [
      {
        "id": 1,
        "name": "玩机管家",
        "nameEn": "Mobile Manager",
        "category": "tools",
        "viewCount": 1250,
        "createdAt": "2025-01-29T10:00:00.000Z",
        "updatedAt": "2025-08-15T07:03:23.833Z"
      },
      {
        "id": 2,
        "name": "示例软件",
        "nameEn": "Example Software",
        "category": "productivity",
        "viewCount": 980,
        "createdAt": "2025-01-28T10:00:00.000Z",
        "updatedAt": "2025-08-14T15:30:00.000Z"
      }
    ],
    "summary": {
      "totalSoftware": 50,
      "totalViews": 25000,
      "averageViews": 500,
      "maxViews": 1250,
      "minViews": 10
    },
    "metadata": {
      "queryParams": {
        "format": "json",
        "startDate": null,
        "endDate": null,
        "minViewCount": null,
        "maxViewCount": null
      },
      "generatedAt": "2025-08-15T10:00:00.000Z"
    }
  }
}
```

**CSV导出示例**：
```bash
# 导出CSV格式的访问量统计
curl "https://your-domain.com/admin/software/view-count?format=csv" \
  -H "X-API-Key: your-admin-api-key" \
  -o software-view-stats.csv
```

### 🔄 重置软件访问量

**端点**：`POST /admin/software/view-count`

**权限要求**：管理员API Key

**请求体参数**：
```json
{
  "action": "reset",           // 操作类型（必需）
  "softwareId": "1",          // 软件ID（可选，不提供则重置所有）
  "newValue": 0               // 新的访问量值（可选，默认为0）
}
```

**响应示例（重置单个软件）**：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "玩机管家",
    "oldViewCount": "unknown",
    "newViewCount": 0
  },
  "message": "软件 \"玩机管家\" 的访问量已重置为 0"
}
```

**响应示例（重置所有软件）**：
```json
{
  "success": true,
  "data": {
    "affectedCount": 50,
    "newViewCount": 0
  },
  "message": "已重置所有软件的访问量为 0"
}
```

**使用示例**：
```bash
# 重置特定软件的访问量
curl -X POST "https://your-domain.com/admin/software/view-count" \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset",
    "softwareId": "1",
    "newValue": 0
  }'

# 重置所有软件的访问量
curl -X POST "https://your-domain.com/admin/software/view-count" \
  -H "X-API-Key: your-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reset",
    "newValue": 0
  }'
```

## �📝 版本管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software/id/{id}/versions` | 获取版本历史 | API Key |
| POST | `/app/software/id/{id}/versions` | 添加新版本 | API Key |
| GET | `/app/software/id/{id}/versions/{versionId}` | 获取版本详情 | API Key |
| PUT | `/app/software/id/{id}/versions/{versionId}` | 更新版本信息 | API Key |
| DELETE | `/app/software/id/{id}/versions/{versionId}` | 删除版本 | API Key |

### 📋 获取版本历史

**端点**：`GET /app/software/id/{id}/versions`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&versionType=all     # 版本类型：all|release|beta|alpha
&isStable=true       # 是否稳定版
&sortBy=releaseDate  # 排序字段
&sortOrder=desc      # 排序方向
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "software": {
      "id": 1,
      "name": "示例软件",
      "currentVersion": "1.2.0"
    },
    "versions": [
      {
        "id": 1,
        "version": "1.2.0",
        "releaseNotes": "修复了一些bug，增加了新功能",
        "releaseNotesEn": "Fixed bugs and added new features",
        "releaseDate": "2025-01-29T12:00:00.000Z",
        "downloadLinks": {
          "official": "https://download.com/v1.2.0.zip",
          "quark": "https://pan.quark.cn/file",
          "baidu": "https://pan.baidu.com/file"
        },
        "fileSize": "150MB",
        "isStable": true,
        "versionType": "release",
        "metadata": {
          "buildNumber": "1200",
          "commitHash": "abc123"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### ➕ 添加新版本

**端点**：`POST /app/software/id/{id}/versions`

**请求参数**：
```json
{
  "version": "1.3.0",                 // 版本号（必需）
  "releaseNotes": "更新内容",         // 更新说明（必需）
  "releaseNotesEn": "Release notes",  // 英文更新说明（可选）
  "releaseDate": "2025-01-30T10:00:00.000Z", // 发布时间（可选，默认当前时间）
  "downloadLinks": {                  // 下载链接（可选）
    "official": "https://download.com/v1.3.0.zip",
    "quark": "https://pan.quark.cn/file",
    "baidu": "https://pan.baidu.com/file",
    "github": "https://github.com/user/repo/releases/tag/v1.3.0"
  },
  "fileSize": "160MB",                // 文件大小（可选）
  "isStable": true,                   // 是否稳定版（默认：true）
  "versionType": "release",           // 版本类型（默认：release）
  "metadata": {                       // 元数据（可选）
    "buildNumber": "1300",
    "commitHash": "def456",
    "changelog": ["新增功能A", "修复bug B"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "version": "1.3.0",
    "releaseNotes": "更新内容",
    "releaseDate": "2025-01-30T10:00:00.000Z",
    "downloadLinks": {
      "official": "https://download.com/v1.3.0.zip"
    },
    "isStable": true,
    "versionType": "release"
  },
  "message": "版本添加成功"
}
```

## 📢 公告管理API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/app/software/id/{id}/announcements` | 获取公告列表 | API Key |
| POST | `/app/software/id/{id}/announcements` | 添加新公告 | API Key |
| GET | `/app/software/id/{id}/announcements/{announcementId}` | 获取公告详情 | API Key |
| PUT | `/app/software/id/{id}/announcements/{announcementId}` | 更新公告 | API Key |
| DELETE | `/app/software/id/{id}/announcements/{announcementId}` | 删除公告 | API Key |

### 📋 获取公告列表

**端点**：`GET /app/software/id/{id}/announcements`

**查询参数**：
```bash
?page=1              # 页码
&limit=10            # 每页数量
&type=all            # 公告类型：all|general|update|security|maintenance
&priority=all        # 优先级：all|low|normal|high|urgent
&isPublished=true    # 是否已发布
&sortBy=publishedAt  # 排序字段
&sortOrder=desc      # 排序方向
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "software": {
      "id": 1,
      "name": "示例软件"
    },
    "announcements": [
      {
        "id": 1,
        "title": "重要更新通知",
        "titleEn": "Important Update Notice",
        "content": "我们发布了新版本，包含重要的安全修复...",
        "contentEn": "We have released a new version with important security fixes...",
        "type": "update",
        "priority": "high",
        "version": "1.3.0",
        "isPublished": true,
        "publishedAt": "2025-01-29T10:00:00.000Z",
        "expiresAt": "2025-02-28T23:59:59.000Z",
        "metadata": {
          "author": "管理员",
          "tags": ["security", "update"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

### ➕ 添加新公告

**端点**：`POST /app/software/id/{id}/announcements`

**请求参数**：
```json
{
  "title": "公告标题",               // 标题（必需）
  "titleEn": "Announcement Title", // 英文标题（可选）
  "content": "公告内容详情...",      // 内容（必需）
  "contentEn": "Announcement content...", // 英文内容（可选）
  "type": "update",                // 类型（默认：general）
  "priority": "high",              // 优先级（默认：normal）
  "version": "1.3.0",              // 关联版本（可选）
  "isPublished": true,             // 是否发布（默认：true）
  "publishedAt": "2025-01-29T10:00:00.000Z", // 发布时间（可选）
  "expiresAt": "2025-02-28T23:59:59.000Z",   // 过期时间（可选）
  "metadata": {                    // 元数据（可选）
    "author": "管理员",
    "tags": ["important", "update"],
    "targetAudience": "all"
  }
}
```

**公告类型说明**：
- `general`: 一般公告
- `update`: 更新通知
- `security`: 安全公告
- `maintenance`: 维护通知
- `feature`: 功能介绍
- `bugfix`: 修复通知

**优先级说明**：
- `low`: 低优先级
- `normal`: 普通优先级
- `high`: 高优先级
- `urgent`: 紧急优先级

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": 2,
    "title": "公告标题",
    "content": "公告内容详情...",
    "type": "update",
    "priority": "high",
    "isPublished": true,
    "publishedAt": "2025-01-29T10:00:00.000Z"
  },
  "message": "公告添加成功"
}
```

## � 用户行为统计API

### 📊 API端点总览

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/api/user-behavior/stats` | 获取综合统计信息 | API Key |
| POST | `/api/user-behavior/activations` | 记录软件激活 | API Key |
| GET | `/api/user-behavior/activations` | 获取激活统计 | API Key |
| POST | `/api/user-behavior/device-connections` | 记录设备连接 | API Key |
| GET | `/api/user-behavior/device-connections` | 获取设备连接统计 | API Key |

### 📈 获取综合统计

**端点**：`GET /api/user-behavior/stats`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选，筛选特定软件）
&startDate=2025-01-01 # 开始日期（可选，YYYY-MM-DD格式）
&endDate=2025-01-31   # 结束日期（可选，YYYY-MM-DD格式）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalActivations": 1000,
      "uniqueActivatedDevices": 800,
      "totalConnections": 1500,
      "uniqueConnectedDevices": 900,
      "averageConnectionsPerDevice": "1.67"
    },
    "trends": {
      "activationTrend": [
        {"date": "2025-08-01", "count": 50},
        {"date": "2025-08-02", "count": 45}
      ],
      "connectionTrend": [
        {"date": "2025-08-01", "count": 75},
        {"date": "2025-08-02", "count": 68}
      ]
    },
    "geoDistribution": [
      {"country": "中国", "region": "北京市", "count": 100},
      {"country": "中国", "region": "上海市", "count": 85}
    ],
    "brandDistribution": [
      {"brand": "Samsung", "count": 200},
      {"brand": "Xiaomi", "count": 150}
    ],
    "metadata": {
      "queryParams": {
        "softwareId": 1,
        "startDate": "2025-01-01",
        "endDate": "2025-01-31"
      },
      "generatedAt": "2025-08-01T00:00:00.000Z"
    }
  }
}
```

### 📱 记录软件激活

**端点**：`POST /api/user-behavior/activations`

**请求参数**：
```json
{
  "softwareId": 1,                    // 软件ID（必需）
  "softwareName": "玩机管家",          // 软件名称（可选，默认：玩机管家）
  "softwareVersion": "1.0.0",         // 软件版本（可选）
  "deviceFingerprint": "device-123",  // 设备指纹（必需，用于唯一标识设备）
  "deviceOs": "Windows 11",           // 操作系统（可选）
  "deviceArch": "x64",                // 系统架构（可选）
  "activationCode": "XXXX-XXXX",      // 激活码（可选）
  "username": "用户名",                // 用户名（可选）
  "userEmail": "user@example.com",    // 用户邮箱（可选）
  "ipAddress": "192.168.1.1",         // IP地址（可选）
  "country": "中国",                   // 国家（可选）
  "region": "北京市",                  // 地区（可选）
  "city": "北京"                       // 城市（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "softwareId": 1,
    "deviceFingerprint": "device-123",
    "activatedAt": "2025-08-01T00:00:00.000Z"
  },
  "message": "激活记录成功"
}
```

### 📊 获取激活统计

**端点**：`GET /api/user-behavior/activations`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选）
&startDate=2025-01-01 # 开始日期（可选）
&endDate=2025-01-31   # 结束日期（可选）
&page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalActivations": 500,
    "uniqueDevices": 400,
    "recentActivations": [
      {
        "id": "uuid-123",
        "softwareId": 1,
        "deviceFingerprint": "device-123",
        "activatedAt": "2025-08-01T00:00:00.000Z",
        "country": "中国",
        "region": "北京市"
      }
    ],
    "summary": {
      "totalActivations": 500,
      "uniqueDevices": 400,
      "averageActivationsPerDevice": "1.25"
    }
  }
}
```

### 🔌 记录设备连接

**端点**：`POST /api/user-behavior/device-connections`

**请求参数**：
```json
{
  "deviceSerial": "device-serial-123",     // 设备序列号（必需）
  "deviceBrand": "Samsung",                // 设备品牌（可选）
  "deviceModel": "Galaxy S21",             // 设备型号（可选）
  "softwareId": 1,                         // 软件ID（必需）
  "userDeviceFingerprint": "fingerprint"   // 用户设备指纹（可选）
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "uuid-456",
    "deviceSerial": "device-serial-123",
    "softwareId": 1,
    "connectedAt": "2025-08-01T00:00:00.000Z"
  },
  "message": "设备连接记录成功"
}
```

### 📱 获取设备连接统计

**端点**：`GET /api/user-behavior/device-connections`

**查询参数**：
```bash
?softwareId=1        # 软件ID（可选）
&startDate=2025-01-01 # 开始日期（可选）
&endDate=2025-01-31   # 结束日期（可选）
&page=1              # 页码（默认：1）
&limit=10            # 每页数量（默认：10）
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "totalConnections": 800,
    "uniqueDevices": 600,
    "brandStats": [
      {"brand": "Samsung", "count": 200},
      {"brand": "Xiaomi", "count": 150}
    ],
    "deviceModelStats": [
      {"model": "Galaxy S21", "count": 100},
      {"model": "Mi 11", "count": 80}
    ],
    "recentConnections": [
      {
        "id": "uuid-456",
        "deviceSerial": "device-serial-123",
        "deviceBrand": "Samsung",
        "deviceModel": "Galaxy S21",
        "connectedAt": "2025-08-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalConnections": 800,
      "uniqueDevices": 600,
      "averageConnectionsPerDevice": "1.33"
    }
  }
}
```

## �🚨 错误处理

### 📊 HTTP状态码

| 状态码 | 含义 | 描述 | 处理建议 |
|--------|------|------|----------|
| `200` | ✅ OK | 请求成功 | 正常处理响应数据 |
| `201` | ✅ Created | 资源创建成功 | 资源已成功创建 |
| `400` | ❌ Bad Request | 请求参数错误 | 检查请求参数格式和必填字段 |
| `401` | ❌ Unauthorized | 认证失败 | 检查API Key或JWT Token |
| `403` | ❌ Forbidden | 权限不足 | 检查用户权限或API访问范围 |
| `404` | ❌ Not Found | 资源不存在 | 检查资源ID或URL路径 |
| `409` | ❌ Conflict | 资源冲突 | 检查是否存在重复资源 |
| `422` | ❌ Unprocessable Entity | 数据验证失败 | 检查数据格式和业务规则 |
| `429` | ⚠️ Too Many Requests | 请求频率超限 | 降低请求频率，实施退避策略 |
| `500` | ❌ Internal Server Error | 服务器内部错误 | 联系技术支持或稍后重试 |

### 🔍 错误响应格式

**标准错误响应**：
```json
{
  "success": false,
  "error": "错误描述信息",
  "code": "ERROR_CODE",
  "details": {
    "field": "具体错误字段",
    "message": "详细错误信息"
  },
  "timestamp": "2025-01-29T10:00:00.000Z",
  "path": "/api/activation-codes"
}
```

**防刷机制错误响应**：
```json
{
  "success": false,
  "error": "访问频率过高",
  "retryAfter": 900
}
```

**IP封禁错误响应**：
```json
{
  "success": false,
  "error": "IP被临时封禁",
  "retryAfter": 600
}
```

---

## 📚 更新日志

### v2.1.0 - 访问量统计功能 (2025-08-15)

#### 🆕 新增功能
- **访问量自动统计**：`GET /app/software/id/{id}` 接口现在会自动统计访问量
- **访问量排行榜**：新增 `GET /app/software/ranking` 接口，支持按访问量排序
- **防刷机制**：实施频率限制和异常检测，防止恶意刷访问量
- **管理员功能**：新增访问量统计查看和重置功能

#### 🔧 接口变更
- `GET /app/software/id/{id}` 响应中新增 `viewCount` 字段
- 新增 `GET /app/software/ranking` 排行榜接口
- 新增 `GET /admin/software/view-count` 管理员统计接口
- 新增 `POST /admin/software/view-count` 管理员重置接口

#### 🛡️ 安全增强
- 实施访问频率限制（1分钟内最多10次）
- 自动IP封禁机制（超限封禁15分钟）
- 异常访问模式检测和处理

#### 📊 数据格式
- 所有软件相关接口响应中现在包含 `viewCount` 字段
- 排行榜接口支持多种筛选和分页参数
- 管理员接口支持CSV格式数据导出

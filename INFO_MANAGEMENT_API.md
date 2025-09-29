# 信息管理 API 文档

本文档描述了信息管理系统的四个主要 API 端点，用于管理联系方式、群聊信息、媒体平台和项目信息。

## 📋 目录

1. [联系方式 API](#联系方式-api)
2. [群聊信息 API](#群聊信息-api)
3. [媒体平台 API](#媒体平台-api)
4. [项目信息 API](#项目信息-api)

---

## 1. 联系方式 API

### 基础路径
```
/api/info-management/contact-info
```

### 端点列表

#### GET /api/info-management/contact-info
获取所有联系方式列表

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "微信",
      "description": "远程刷机",
      "info": "LACS_Official",
      "action": "https://u.wechat.com/...",
      "analyticsEvent": "在线联系",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/info-management/contact-info
创建新的联系方式

**请求体：**
```json
{
  "title": "微信",
  "description": "远程刷机",
  "info": "LACS_Official",
  "action": "https://u.wechat.com/...",
  "analyticsEvent": "在线联系"
}
```

#### GET /api/info-management/contact-info/:id
获取特定联系方式详情

#### PUT /api/info-management/contact-info/:id
更新特定联系方式

**请求体：** 同 POST

#### DELETE /api/info-management/contact-info/:id
删除特定联系方式

---

## 2. 群聊信息 API

### 基础路径
```
/api/info-management/group-chats
```

### 端点列表

#### GET /api/info-management/group-chats
获取所有群聊信息列表

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "小米玩机交流总群",
      "limit": "QQ群-500人",
      "groupNumber": "676581092",
      "qrcode": "/images/qrcodes/qqqun-xmwjzq.webp",
      "joinLink": "https://qm.qq.com/q/rEYFmCSdIO",
      "analyticsEvent": "加入群聊1",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/info-management/group-chats
创建新的群聊信息

**请求体：**
```json
{
  "name": "小米玩机交流总群",
  "limit": "QQ群-500人",
  "groupNumber": "676581092",
  "qrcode": "/images/qrcodes/qqqun-xmwjzq.webp",
  "joinLink": "https://qm.qq.com/q/rEYFmCSdIO",
  "analyticsEvent": "加入群聊1"
}
```

#### GET /api/info-management/group-chats/:id
获取特定群聊详情

#### PUT /api/info-management/group-chats/:id
更新特定群聊信息

**请求体：** 同 POST

#### DELETE /api/info-management/group-chats/:id
删除特定群聊信息

---

## 3. 媒体平台 API

### 基础路径
```
/api/info-management/media-platforms
```

### 端点列表

#### GET /api/info-management/media-platforms
获取所有媒体平台列表

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "bilibili",
      "name": "哔哩哔哩",
      "logo": "/images/platforms/bilibili.svg",
      "account": "领创工作室",
      "accountId": "1779662818",
      "qrcode": "/images/qrcodes/qr-bilibili.webp",
      "qrcodeTitle": "哔哩哔哩 媒体平台",
      "qrcodeDesc": "扫码关注我们的哔哩哔哩账号",
      "link": "https://space.bilibili.com/1779662818",
      "analyticsEvent": "访问哔哩哔哩",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/info-management/media-platforms
创建新的媒体平台

**请求体：**
```json
{
  "id": "bilibili",
  "name": "哔哩哔哩",
  "logo": "/images/platforms/bilibili.svg",
  "account": "领创工作室",
  "accountId": "1779662818",
  "qrcode": "/images/qrcodes/qr-bilibili.webp",
  "qrcodeTitle": "哔哩哔哩 媒体平台",
  "qrcodeDesc": "扫码关注我们的哔哩哔哩账号",
  "link": "https://space.bilibili.com/1779662818",
  "analyticsEvent": "访问哔哩哔哩"
}
```

#### GET /api/info-management/media-platforms/:id
获取特定媒体平台详情

#### PUT /api/info-management/media-platforms/:id
更新特定媒体平台

**请求体：** 同 POST

#### DELETE /api/info-management/media-platforms/:id
删除特定媒体平台

---

## 4. 项目信息 API

### 基础路径
```
/api/info-management/projects
```

### 端点列表

#### GET /api/info-management/projects
获取所有项目信息列表

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "category": "project2",
      "categoryName": "面具模块",
      "title": "坤坤模块",
      "description": "自定义安卓状态栏，支持多种样式和布局调整",
      "platform": "Windows",
      "updateDate": "2025",
      "link": "https://hout.lacs.cc",
      "icon": "fa-tools",
      "pLanguage": ["python", "pyside6"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/info-management/projects
创建新的项目信息

**请求体：**
```json
{
  "id": 1,
  "category": "project2",
  "categoryName": "面具模块",
  "title": "坤坤模块",
  "description": "自定义安卓状态栏，支持多种样式和布局调整",
  "platform": "Windows",
  "updateDate": "2025",
  "link": "https://hout.lacs.cc",
  "icon": "fa-tools",
  "pLanguage": ["python", "pyside6"]
}
```

#### GET /api/info-management/projects/:id
获取特定项目详情

#### PUT /api/info-management/projects/:id
更新特定项目信息

**请求体：** 同 POST（不包含 id 字段）

#### DELETE /api/info-management/projects/:id
删除特定项目信息

---

## 📊 数据库表结构

### 联系方式表 (contact_info)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键 |
| title | text | 标题 |
| description | text | 描述 |
| info | text | 联系信息 |
| action | text | 操作链接 |
| analyticsEvent | text | 分析事件 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### 群聊信息表 (group_chats)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | serial | 主键 |
| name | text | 群名称 |
| limit | text | 群限制 |
| groupNumber | text | 群号 |
| qrcode | text | 二维码路径 |
| joinLink | text | 加入链接 |
| analyticsEvent | text | 分析事件 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### 媒体平台表 (media_platforms)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | text | 主键 |
| name | text | 平台名称 |
| logo | text | Logo路径 |
| account | text | 账号名称 |
| accountId | text | 账号ID |
| qrcode | text | 二维码路径 |
| qrcodeTitle | text | 二维码标题 |
| qrcodeDesc | text | 二维码描述 |
| link | text | 平台链接 |
| analyticsEvent | text | 分析事件 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

### 项目信息表 (projects_list)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键 |
| category | text | 分类代码 |
| categoryName | text | 分类名称 |
| title | text | 项目标题 |
| description | text | 项目描述 |
| platform | text | 平台 |
| updateDate | text | 更新日期 |
| link | text | 项目链接 |
| icon | text | 图标 |
| pLanguage | jsonb | 编程语言数组 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |

---

## 🎯 前端管理界面

访问路径：`/admin/info-management`

前端管理界面提供了以下功能：
- ✅ 四个标签页分别管理不同类型的信息
- ✅ 数据列表展示（支持排序、筛选、分页）
- ✅ 新增信息
- ✅ 编辑信息
- ✅ 删除信息（带确认提示）
- ✅ 实时数据更新

---

## 🔐 错误处理

所有 API 端点都遵循统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误信息描述"
}
```

常见错误状态码：
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误

---

## 📝 使用示例

### JavaScript/TypeScript 示例

```typescript
// 获取所有联系方式
const response = await fetch('/api/info-management/contact-info')
const result = await response.json()
if (result.success) {
  console.log(result.data)
}

// 创建新的联系方式
const newContact = {
  title: "微信",
  description: "远程刷机",
  info: "LACS_Official",
  action: "https://u.wechat.com/...",
  analyticsEvent: "在线联系"
}

const createResponse = await fetch('/api/info-management/contact-info', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newContact)
})

const createResult = await createResponse.json()
if (createResult.success) {
  console.log('创建成功:', createResult.data)
}

// 更新联系方式
const updateResponse = await fetch('/api/info-management/contact-info/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newContact)
})

// 删除联系方式
const deleteResponse = await fetch('/api/info-management/contact-info/1', {
  method: 'DELETE'
})
```

---

## 🚀 部署说明

1. 确保数据库表已创建（使用 Drizzle ORM 迁移）
2. 配置环境变量中的数据库连接
3. 启动 Next.js 应用
4. 访问 `/admin/info-management` 进行管理

---

## 📞 技术支持

如有问题，请联系开发团队或查看项目文档。

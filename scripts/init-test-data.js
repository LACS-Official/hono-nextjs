// 初始化测试数据脚本
const { neon } = require('@neondatabase/serverless')
const { drizzle } = require('drizzle-orm/neon-http')
const { pgTable, text, timestamp, boolean, jsonb, uuid, varchar, integer } = require('drizzle-orm/pg-core')
const dotenv = require('dotenv')

// 加载环境变量
dotenv.config({ path: '.env.local' })

// 定义表结构
const software = pgTable('software', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  nameEn: varchar('name_en', { length: 255 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  currentVersion: varchar('current_version', { length: 50 }).notNull(),
  latestVersion: varchar('latest_version', { length: 50 }).notNull(),
  downloadUrl: text('download_url'),
  downloadUrlBackup: text('download_url_backup'),
  officialWebsite: text('official_website'),
  category: varchar('category', { length: 100 }),
  tags: jsonb('tags'),
  systemRequirements: jsonb('system_requirements'),
  fileSize: varchar('file_size', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

const softwareAnnouncements = pgTable('software_announcements', {
  id: uuid('id').primaryKey().defaultRandom(),
  softwareId: uuid('software_id').notNull().references(() => software.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  titleEn: varchar('title_en', { length: 500 }),
  content: text('content').notNull(),
  contentEn: text('content_en'),
  type: varchar('type', { length: 50 }).default('general').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  version: varchar('version', { length: 50 }),
  isPublished: boolean('is_published').default(true).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// 创建软件管理数据库连接
const softwareSql = neon(process.env.SOFTWARE_DATABASE_URL)
const db = drizzle(softwareSql, { schema: { software, softwareAnnouncements } })

// 测试软件数据
const testSoftware = [
  {
    name: 'Visual Studio Code',
    nameEn: 'Visual Studio Code',
    description: '微软开发的免费源代码编辑器，支持多种编程语言和丰富的扩展生态系统。',
    descriptionEn: 'A free source code editor developed by Microsoft with support for multiple programming languages and rich extension ecosystem.',
    currentVersion: '1.85.0',
    latestVersion: '1.85.1',
    downloadUrl: 'https://code.visualstudio.com/download',
    downloadUrlBackup: 'https://github.com/microsoft/vscode/releases',
    officialWebsite: 'https://code.visualstudio.com',
    category: '开发工具',
    tags: ['编辑器', '开发', 'IDE', 'Microsoft'],
    systemRequirements: {
      'Windows': ['Windows 10 或更高版本', '1.6 GHz 处理器', '1 GB RAM'],
      'macOS': ['macOS 10.15 或更高版本', '1 GB RAM'],
      'Linux': ['Ubuntu 18.04+, Debian 9+, RHEL 7+', '1 GB RAM']
    },
    fileSize: '85 MB',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Google Chrome',
    nameEn: 'Google Chrome',
    description: '谷歌开发的网页浏览器，以速度快、安全性高和丰富的扩展功能著称。',
    descriptionEn: 'A web browser developed by Google, known for its speed, security, and rich extension features.',
    currentVersion: '120.0.6099.109',
    latestVersion: '120.0.6099.129',
    downloadUrl: 'https://www.google.com/chrome/',
    downloadUrlBackup: 'https://www.google.cn/chrome/',
    officialWebsite: 'https://www.google.com/chrome/',
    category: '浏览器',
    tags: ['浏览器', 'Google', '网页', '安全'],
    systemRequirements: {
      'Windows': ['Windows 10 或更高版本', '4 GB RAM'],
      'macOS': ['macOS 10.15 或更高版本', '4 GB RAM'],
      'Linux': ['Ubuntu 18.04+', '4 GB RAM']
    },
    fileSize: '95 MB',
    isActive: true,
    sortOrder: 2
  }
]

// 测试公告数据
const testAnnouncements = [
  {
    title: 'Visual Studio Code 1.85.1 版本发布',
    titleEn: 'Visual Studio Code 1.85.1 Released',
    content: '此版本修复了多个已知问题，提升了编辑器性能，并新增了对 TypeScript 5.3 的支持。建议所有用户升级到最新版本。',
    contentEn: 'This version fixes multiple known issues, improves editor performance, and adds support for TypeScript 5.3. All users are recommended to upgrade to the latest version.',
    type: 'update',
    priority: 'normal',
    version: '1.85.1',
    isPublished: true
  },
  {
    title: 'Chrome 安全更新通知',
    titleEn: 'Chrome Security Update Notice',
    content: '发现了一个高危安全漏洞，已在最新版本中修复。请立即更新到 Chrome 120.0.6099.129 或更高版本。',
    contentEn: 'A high-risk security vulnerability has been discovered and fixed in the latest version. Please update to Chrome 120.0.6099.129 or higher immediately.',
    type: 'security',
    priority: 'high',
    version: '120.0.6099.129',
    isPublished: true
  }
]

async function initTestData() {
  try {
    console.log('开始初始化测试数据...')

    // 插入软件数据
    console.log('插入软件数据...')
    const insertedSoftware = await db.insert(software).values(testSoftware).returning()
    console.log(`成功插入 ${insertedSoftware.length} 个软件条目`)

    // 为每个软件添加对应的公告
    console.log('插入公告数据...')
    const announcementsWithSoftwareId = testAnnouncements.map((announcement, index) => ({
      ...announcement,
      softwareId: insertedSoftware[index].id
    }))

    const insertedAnnouncements = await db.insert(softwareAnnouncements).values(announcementsWithSoftwareId).returning()
    console.log(`成功插入 ${insertedAnnouncements.length} 个公告`)

    console.log('测试数据初始化完成！')
    console.log('\n可以使用以下 API 端点进行测试：')
    console.log('- GET http://localhost:3000/api/app/software')
    console.log('- GET http://localhost:3000/api/app/software/Visual%20Studio%20Code')
    console.log('- GET http://localhost:3000/api/app/software/微信/announcements')
    console.log('- GET http://localhost:3000/api/app/software/Chrome/latest-announcement')

  } catch (error) {
    console.error('初始化测试数据失败:', error)
    process.exit(1)
  }
}

// 运行初始化
initTestData()
import { NextRequest, NextResponse } from 'next/server'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'
import { v4 as uuidv4 } from 'uuid'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// Hugo 文章接口
interface HugoArticle {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  author: string
  status: 'draft' | 'published' | 'archived'
  tags: string[]
  categories: string[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  featured: boolean
  viewCount: number
  metadata: {
    seo_title?: string
    seo_description?: string
    featured_image?: string
  }
}

// 模拟数据存储（实际项目中应该使用数据库）
let articles: HugoArticle[] = [
  {
    id: '1',
    title: '欢迎使用 Hugo 博客系统',
    slug: 'welcome-to-hugo',
    content: '# 欢迎使用 Hugo 博客系统\n\n这是一篇示例文章，展示了 Hugo 博客系统的基本功能。\n\n## 功能特性\n\n- Markdown 编辑器\n- 标签和分类管理\n- SEO 优化\n- 响应式设计\n\n## 开始使用\n\n点击"新建文章"按钮开始创建您的第一篇文章。',
    excerpt: '这是一篇示例文章，展示了 Hugo 博客系统的基本功能。',
    author: '管理员',
    status: 'published',
    tags: ['Hugo', '博客', '示例'],
    categories: ['技术'],
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    featured: true,
    viewCount: 128,
    metadata: {
      seo_title: '欢迎使用 Hugo 博客系统 - LACS Blog',
      seo_description: '了解 Hugo 博客系统的基本功能和使用方法',
      featured_image: 'https://via.placeholder.com/800x400'
    }
  }
]

// GET /app/hugo/articles - 获取文章列表
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    // 过滤文章
    let filteredArticles = articles

    if (search) {
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (status !== 'all') {
      filteredArticles = filteredArticles.filter(article => article.status === status)
    }

    // 分页
    const totalCount = filteredArticles.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedArticles = filteredArticles.slice(startIndex, endIndex)

    return corsResponse({
      success: true,
      data: {
        articles: paginatedArticles,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取文章列表失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// POST /app/hugo/articles - 创建新文章
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // API Key 验证（写操作需要认证）
    if (process.env.ENABLE_API_KEY_AUTH === 'true') {
      const apiKeyValidation = validateApiKeyWithExpiration(request)
      if (!apiKeyValidation.isValid) {
        return corsResponse({
          success: false,
          error: apiKeyValidation.error || 'Invalid or missing API Key'
        }, { status: 401 }, origin, userAgent)
      }
    }

    const body = await request.json()
    const {
      title,
      slug,
      content = '',
      excerpt = '',
      author = '管理员',
      status = 'draft',
      tags = [],
      categories = [],
      featured = false,
      metadata = {}
    } = body

    // 验证必填字段
    if (!title || !slug) {
      return corsResponse({
        success: false,
        error: '标题和 Slug 为必填字段'
      }, { status: 400 }, origin, userAgent)
    }

    // 检查 slug 是否已存在
    const existingArticle = articles.find(article => article.slug === slug)
    if (existingArticle) {
      return corsResponse({
        success: false,
        error: 'Slug 已存在，请使用其他 Slug'
      }, { status: 400 }, origin, userAgent)
    }

    // 创建新文章
    const newArticle: HugoArticle = {
      id: uuidv4(),
      title,
      slug,
      content,
      excerpt,
      author,
      status,
      tags,
      categories,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured,
      viewCount: 0,
      metadata
    }

    articles.push(newArticle)

    return corsResponse({
      success: true,
      data: newArticle
    }, { status: 201 }, origin, userAgent)

  } catch (error) {
    console.error('创建文章失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { corsResponse, handleOptions, validateApiKeyWithExpiration } from '@/lib/cors'

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
// 这里应该与 articles/route.ts 共享同一个数据源
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

// GET /app/hugo/articles/[id] - 获取单个文章
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { id } = params

    if (!id) {
      return corsResponse({
        success: false,
        error: '文章 ID 参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const article = articles.find(a => a.id === id)

    if (!article) {
      return corsResponse({
        success: false,
        error: '文章不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 增加浏览量
    article.viewCount += 1

    return corsResponse({
      success: true,
      data: article
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取文章详情失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// PUT /app/hugo/articles/[id] - 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const body = await request.json()

    if (!id) {
      return corsResponse({
        success: false,
        error: '文章 ID 参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const articleIndex = articles.findIndex(a => a.id === id)

    if (articleIndex === -1) {
      return corsResponse({
        success: false,
        error: '文章不存在'
      }, { status: 404 }, origin, userAgent)
    }

    const existingArticle = articles[articleIndex]
    const {
      title,
      slug,
      content,
      excerpt,
      author,
      status,
      tags,
      categories,
      featured,
      metadata
    } = body

    // 验证必填字段
    if (!title || !slug) {
      return corsResponse({
        success: false,
        error: '标题和 Slug 为必填字段'
      }, { status: 400 }, origin, userAgent)
    }

    // 检查 slug 是否与其他文章冲突
    const conflictingArticle = articles.find(article => 
      article.slug === slug && article.id !== id
    )
    if (conflictingArticle) {
      return corsResponse({
        success: false,
        error: 'Slug 已被其他文章使用，请使用其他 Slug'
      }, { status: 400 }, origin, userAgent)
    }

    // 更新文章
    const updatedArticle: HugoArticle = {
      ...existingArticle,
      title,
      slug,
      content: content || existingArticle.content,
      excerpt: excerpt || existingArticle.excerpt,
      author: author || existingArticle.author,
      status: status || existingArticle.status,
      tags: tags || existingArticle.tags,
      categories: categories || existingArticle.categories,
      featured: featured !== undefined ? featured : existingArticle.featured,
      metadata: metadata || existingArticle.metadata,
      updatedAt: new Date().toISOString(),
      // 如果状态从非发布改为发布，设置发布时间
      publishedAt: status === 'published' && existingArticle.status !== 'published' 
        ? new Date().toISOString() 
        : existingArticle.publishedAt
    }

    articles[articleIndex] = updatedArticle

    return corsResponse({
      success: true,
      data: updatedArticle
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('更新文章失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// DELETE /app/hugo/articles/[id] - 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    if (!id) {
      return corsResponse({
        success: false,
        error: '文章 ID 参数缺失'
      }, { status: 400 }, origin, userAgent)
    }

    const articleIndex = articles.findIndex(a => a.id === id)

    if (articleIndex === -1) {
      return corsResponse({
        success: false,
        error: '文章不存在'
      }, { status: 404 }, origin, userAgent)
    }

    // 删除文章
    articles.splice(articleIndex, 1)

    return corsResponse({
      success: true,
      message: '文章删除成功'
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('删除文章失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

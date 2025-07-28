import { NextRequest, NextResponse } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'

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
    content: '# 欢迎使用 Hugo 博客系统\n\n这是一篇示例文章，展示了 Hugo 博客系统的基本功能。',
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

// GET /app/hugo/articles/stats - 获取文章统计数据
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 计算统计数据
    const total = articles.length
    const published = articles.filter(article => article.status === 'published').length
    const draft = articles.filter(article => article.status === 'draft').length
    const archived = articles.filter(article => article.status === 'archived').length
    const featured = articles.filter(article => article.featured).length
    const totalViews = articles.reduce((sum, article) => sum + (article.viewCount || 0), 0)

    // 最近发布的文章
    const recentPublished = articles
      .filter(article => article.status === 'published' && article.publishedAt)
      .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime())
      .slice(0, 5)
      .map(article => ({
        id: article.id,
        title: article.title,
        publishedAt: article.publishedAt,
        viewCount: article.viewCount
      }))

    // 热门标签
    const tagCounts: { [key: string]: number } = {}
    articles.forEach(article => {
      article.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    // 分类统计
    const categoryCounts: { [key: string]: number } = {}
    articles.forEach(article => {
      article.categories?.forEach(category => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
    })
    
    const categoryStats = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }))

    // 月度发布统计（最近12个月）
    const monthlyStats: { [key: string]: number } = {}
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyStats[monthKey] = 0
    }
    
    articles
      .filter(article => article.publishedAt)
      .forEach(article => {
        const publishDate = new Date(article.publishedAt!)
        const monthKey = `${publishDate.getFullYear()}-${String(publishDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyStats.hasOwnProperty(monthKey)) {
          monthlyStats[monthKey]++
        }
      })

    const monthlyPublishStats = Object.entries(monthlyStats).map(([month, count]) => ({
      month,
      count
    }))

    return corsResponse({
      success: true,
      data: {
        total,
        published,
        draft,
        archived,
        featured,
        totalViews,
        recentPublished,
        popularTags,
        categoryStats,
        monthlyPublishStats
      }
    }, undefined, origin, userAgent)

  } catch (error) {
    console.error('获取统计数据失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Descriptions, 
  message,
  Row,
  Col,
  Divider,
  Spin,
  Alert
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TagOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
// 暂时不使用 ReactMarkdown

const { Content } = Layout
const { Title, Text, Paragraph } = Typography

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

export default function HugoArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<HugoArticle | null>(null)
  const [loading, setLoading] = useState(true)

  // API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取文章详情
  const fetchArticle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/hugo/articles/${articleId}`)
      const data = await response.json()

      if (data.success) {
        setArticle(data.data)
      } else {
        message.error(data.error || '获取文章详情失败')
      }
    } catch (error) {
      console.error('获取文章详情失败:', error)
      message.error('获取文章详情失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除文章
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hugo/articles/${articleId}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        message.success('文章删除成功')
        router.push('/admin/hugo')
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('删除文章失败:', error)
      message.error('删除失败')
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    if (articleId) {
      fetchArticle()
    }
  }, [articleId])

  // 状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green'
      case 'draft': return 'orange'
      case 'archived': return 'red'
      default: return 'default'
    }
  }

  // 状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'draft': return '草稿'
      case 'archived': return '已归档'
      default: return status
    }
  }

  if (loading) {
    return (
      <Content style={{ padding: '24px', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </Content>
    )
  }

  if (!article) {
    return (
      <Content style={{ padding: '24px', minHeight: '100vh' }}>
        <Alert
          message="文章不存在"
          description="请检查文章 ID 是否正确"
          type="error"
          showIcon
          action={
            <Button onClick={() => router.push('/admin/hugo')}>
              返回文章列表
            </Button>
          }
        />
      </Content>
    )
  }

  return (
    <Content style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ marginBottom: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/admin/hugo')}
          >
            返回列表
          </Button>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/hugo/${articleId}/edit`)}
          >
            编辑文章
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleDelete}
          >
            删除文章
          </Button>
        </Space>

        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileTextOutlined />
          {article.title}
          {article.featured && <Tag color="gold">精选</Tag>}
          <Tag color={getStatusColor(article.status)}>
            {getStatusText(article.status)}
          </Tag>
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧内容区 */}
        <Col xs={24} lg={16}>
          {/* 文章内容 */}
          <Card title="文章内容" style={{ marginBottom: '24px' }}>
            {article.metadata?.featured_image && (
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                <img 
                  src={article.metadata.featured_image} 
                  alt={article.title}
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            )}
            
            {article.excerpt && (
              <Alert
                message="文章摘要"
                description={article.excerpt}
                type="info"
                style={{ marginBottom: '16px' }}
              />
            )}

            <div style={{
              padding: '16px',
              background: '#fafafa',
              borderRadius: '8px',
              minHeight: '400px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace'
            }}>
              {article.content}
            </div>
          </Card>
        </Col>

        {/* 右侧信息区 */}
        <Col xs={24} lg={8}>
          {/* 基本信息 */}
          <Card title="基本信息" style={{ marginBottom: '16px' }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="作者">
                <Space>
                  <UserOutlined />
                  {article.author}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(article.status)}>
                  {getStatusText(article.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="浏览量">
                <Space>
                  <EyeOutlined />
                  {article.viewCount?.toLocaleString() || 0}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <Space>
                  <CalendarOutlined />
                  {new Date(article.createdAt).toLocaleString()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                <Space>
                  <CalendarOutlined />
                  {new Date(article.updatedAt).toLocaleString()}
                </Space>
              </Descriptions.Item>
              {article.publishedAt && (
                <Descriptions.Item label="发布时间">
                  <Space>
                    <CalendarOutlined />
                    {new Date(article.publishedAt).toLocaleString()}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* 标签和分类 */}
          <Card title="标签和分类" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <Text strong>标签：</Text>
              <div style={{ marginTop: '8px' }}>
                {article.tags?.length > 0 ? (
                  article.tags.map(tag => (
                    <Tag key={tag} icon={<TagOutlined />}>{tag}</Tag>
                  ))
                ) : (
                  <Text type="secondary">暂无标签</Text>
                )}
              </div>
            </div>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <div>
              <Text strong>分类：</Text>
              <div style={{ marginTop: '8px' }}>
                {article.categories?.length > 0 ? (
                  article.categories.map(category => (
                    <Tag key={category} color="blue">{category}</Tag>
                  ))
                ) : (
                  <Text type="secondary">暂无分类</Text>
                )}
              </div>
            </div>
          </Card>

          {/* SEO 信息 */}
          {(article.metadata?.seo_title || article.metadata?.seo_description) && (
            <Card title="SEO 信息">
              <Descriptions column={1} size="small">
                {article.metadata.seo_title && (
                  <Descriptions.Item label="SEO 标题">
                    {article.metadata.seo_title}
                  </Descriptions.Item>
                )}
                {article.metadata.seo_description && (
                  <Descriptions.Item label="SEO 描述">
                    {article.metadata.seo_description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </Content>
  )
}

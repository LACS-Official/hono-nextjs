'use client'

import { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Input, 
  Select, 
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TagOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import { showSuccess, showError, ApiResponseHandler } from '@/components/ResponsiveNotification'
import { ResponsiveTableLoading } from '@/components/LoadingState'

const { Content } = Layout
const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

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

// 分页接口
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function HugoArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<HugoArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    archived: 0
  })

  // API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取文章列表
  const fetchArticles = async (page = 1, limit = 10, search = '', status = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status })
      })

      const response = await fetch(`${API_BASE_URL}/hugo/articles?${params}`)
      const data = await response.json()

      if (data.success) {
        setArticles(data.data.articles || [])
        setPagination(data.data.pagination || pagination)
      } else {
        showError(data.error || '获取文章列表失败')
      }
    } catch (error) {
      ApiResponseHandler.handleError(error, '获取文章列表')
    } finally {
      setLoading(false)
    }
  }

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hugo/articles/stats`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 删除文章
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hugo/articles/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        showSuccess('文章删除成功')
        fetchArticles(pagination.page, pagination.limit, searchText, statusFilter)
        fetchStats()
      } else {
        showError(data.error || '删除失败')
      }
    } catch (error) {
      ApiResponseHandler.handleError(error, '删除文章')
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value)
    fetchArticles(1, pagination.limit, value, statusFilter)
  }

  // 状态筛选处理
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    fetchArticles(1, pagination.limit, searchText, value)
  }

  // 分页处理
  const handleTableChange = (page: number, pageSize: number) => {
    fetchArticles(page, pageSize, searchText, statusFilter)
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchArticles()
    fetchStats()
  }, [])

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

  // 表格列定义
  const columns: ColumnsType<HugoArticle> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: HugoArticle) => (
        <div>
          <Text strong style={{ color: '#1890ff', cursor: 'pointer' }}
                onClick={() => router.push(`/admin/hugo/${record.id}`)}>
            {text}
          </Text>
          {record.featured && (
            <Tag color="gold" style={{ marginLeft: 8 }}>精选</Tag>
          )}
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.slug}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 120,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <div>
          {tags?.slice(0, 3).map(tag => (
            <Tag key={tag} style={{ fontSize: '12px' }}>{tag}</Tag>
          ))}
          {tags?.length > 3 && (
            <Tag style={{ fontSize: '12px' }}>+{tags.length - 3}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
      render: (count: number) => count?.toLocaleString() || 0,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: HugoArticle) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/admin/hugo/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => router.push(`/admin/hugo/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这篇文章吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Content style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          Hugo 文章管理
        </Title>
        <Text type="secondary">管理 Hugo 博客文章内容</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总文章数"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.published}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="草稿"
              value={stats.draft}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已归档"
              value={stats.archived}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索文章标题、内容..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">全部状态</Option>
              <Option value="published">已发布</Option>
              <Option value="draft">草稿</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchArticles(pagination.page, pagination.limit, searchText, statusFilter)
                fetchStats()
              }}
              style={{ width: '100%' }}
            >
              刷新
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/admin/hugo/new')}
              style={{ width: '100%' }}
            >
              新建文章
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 文章表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={articles}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
            responsive: true,
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </Content>
  )
}

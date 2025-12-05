'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Avatar,
  Space,
  Select,
  Input,
  Button,
  Breadcrumb,
  Layout,
  message,
  Tooltip,
  Progress
} from 'antd'
import {
  TrophyOutlined,
  EyeOutlined,
  SearchOutlined,
  ReloadOutlined,
  HomeOutlined,
  AppstoreOutlined,
  CrownOutlined,
  FireOutlined,
  RiseOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { Content } = Layout
const { Search } = Input
const { Option } = Select

interface RankedSoftware {
  id: number
  name: string
  nameEn?: string
  description?: string
  currentVersion: string
  category?: string
  tags?: string[]
  viewCount: number
  rank: number
  officialWebsite?: string
  createdAt: string
  updatedAt: string
}

interface RankingData {
  data: RankedSoftware[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalSoftware: number
    totalViews: number
    averageViews: number
  }
}

export default function SoftwareRanking() {
  const [loading, setLoading] = useState(false)
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minViewCount: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // 获取排行榜数据
  const fetchRanking = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/software/ranking?${params}`)
      const data = await response.json()

      if (data.success) {
        setRankingData(data)
        setPagination({
          current: data.pagination.page,
          pageSize: data.pagination.limit
        })
      } else {
        message.error('获取排行榜失败')
      }
    } catch (error) {
      console.error('Error fetching ranking:', error)
      message.error('获取排行榜失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <CrownOutlined style={{ color: '#FFD700', fontSize: '18px' }} />
    if (rank === 2) return <TrophyOutlined style={{ color: '#C0C0C0', fontSize: '16px' }} />
    if (rank === 3) return <TrophyOutlined style={{ color: '#CD7F32', fontSize: '16px' }} />
    return <span style={{ color: '#666', fontWeight: 'bold' }}>#{rank}</span>
  }

  // 获取访问量颜色
  const getViewCountColor = (viewCount: number, maxViews: number) => {
    const ratio = viewCount / maxViews
    if (ratio > 0.8) return '#ff4d4f'
    if (ratio > 0.6) return '#fa8c16'
    if (ratio > 0.4) return '#faad14'
    if (ratio > 0.2) return '#52c41a'
    return '#1890ff'
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    fetchRanking(1, pagination.pageSize)
  }

  // 筛选处理
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchRanking(1, pagination.pageSize)
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchRanking(pagination.current, pagination.pageSize)
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  // 表格列定义
  const columns: ColumnsType<RankedSoftware> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center',
      render: (rank: number) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getRankIcon(rank)}
        </div>
      )
    },
    {
      title: '软件信息',
      key: 'software',
      width: 300,
      render: (_, record: RankedSoftware) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={48} 
            style={{ 
              backgroundColor: getViewCountColor(
                record.viewCount, 
                rankingData?.data[0]?.viewCount || 1
              ),
              marginRight: 12
            }}
          >
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: 4 }}>
              {record.name}
            </div>
            {record.nameEn && (
              <div style={{ fontSize: '12px', color: '#666', marginBottom: 4 }}>
                {record.nameEn}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#999' }}>
              版本: {record.currentVersion}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '访问量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 200,
      align: 'center',
      render: (viewCount: number) => {
        const maxViews = rankingData?.data[0]?.viewCount || 1
        const percentage = Math.round((viewCount / maxViews) * 100)
        
        return (
          <div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: getViewCountColor(viewCount, maxViews),
              marginBottom: 8
            }}>
              {viewCount.toLocaleString()}
            </div>
            <Progress 
              percent={percentage} 
              size="small" 
              strokeColor={getViewCountColor(viewCount, maxViews)}
              showInfo={false}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
              占比 {percentage}%
            </div>
          </div>
        )
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        category ? (
          <Tag color="purple">{category}</Tag>
        ) : (
          <Text type="secondary">未分类</Text>
        )
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <div>
          {tags && tags.length > 0 ? (
            tags.slice(0, 3).map(tag => (
              <Tag key={tag} style={{ marginBottom: 2, fontSize: '12px' }}>
                {tag}
              </Tag>
            ))
          ) : (
            <Text type="secondary">无标签</Text>
          )}
          {tags && tags.length > 3 && (
            <Tooltip title={tags.slice(3).join(', ')}>
              <Tag style={{ fontSize: '12px' }}>+{tags.length - 3}</Tag>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    }
  ]

  const maxViews = rankingData?.data[0]?.viewCount || 1

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />

      <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
        {/* 面包屑导航 */}
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item>
            <Link href="/admin">
              <HomeOutlined /> 管理后台
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/admin/software">
              <AppstoreOutlined /> 软件管理
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <TrophyOutlined /> 访问量排行榜
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            软件访问量排行榜
          </Title>
          <Text type="secondary">
            根据软件详情页面的访问次数进行排名，实时更新
          </Text>
        </div>

        {/* 统计卡片 */}
        {rankingData && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="软件总数"
                  value={rankingData.summary.totalSoftware}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="总访问量"
                  value={rankingData.summary.totalViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="平均访问量"
                  value={rankingData.summary.averageViews}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选栏 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Search
                placeholder="搜索软件名称"
                allowClear
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                placeholder="选择分类"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('category', value || '')}
              >
                <Option value="开发工具">开发工具</Option>
                <Option value="浏览器">浏览器</Option>
                <Option value="图像处理">图像处理</Option>
                <Option value="社交通讯">社交通讯</Option>
                <Option value="办公软件">办公软件</Option>
                <Option value="系统工具">系统工具</Option>
                <Option value="多媒体">多媒体</Option>
                <Option value="游戏">游戏</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Input
                placeholder="最小访问量"
                type="number"
                allowClear
                onChange={(e) => handleFilterChange('minViewCount', e.target.value)}
              />
            </Col>
            <Col xs={24} sm={4}>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} block>
                刷新
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 排行榜表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={rankingData?.data || []}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              total: rankingData?.pagination.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                fetchRanking(page, pageSize)
              },
              onShowSizeChange: (current, size) => {
                fetchRanking(1, size)
              }
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Content>
    </Layout>
  )
}


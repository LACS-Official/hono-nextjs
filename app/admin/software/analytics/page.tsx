'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  DatePicker,
  Button,
  Breadcrumb,
  Layout,
  message,
  Space,
  Table,
  Progress,
  Tag
} from 'antd'
import {
  BarChartOutlined,
  EyeOutlined,
  RiseOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Content } = Layout
const { Option } = Select
const { RangePicker } = DatePicker

interface ViewCountStats {
  statistics: Array<{
    id: number
    name: string
    nameEn?: string
    category?: string
    viewCount: number
    createdAt: string
    updatedAt: string
  }>
  summary: {
    totalSoftware: number
    totalViews: number
    averageViews: number
    maxViews: number
    minViews: number
  }
  metadata: {
    queryParams: any
    generatedAt: string
  }
}

export default function SoftwareAnalytics() {
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<ViewCountStats | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minViewCount: '',
    maxViewCount: ''
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29351'

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        format: 'json',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount }),
        ...(filters.maxViewCount && { maxViewCount: filters.maxViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/admin/software/view-count?${params}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      const data = await response.json()

      if (data.success) {
        setStatsData(data.data)
      } else {
        message.error('获取统计数据失败')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      message.error('获取统计数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 导出CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount }),
        ...(filters.maxViewCount && { maxViewCount: filters.maxViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/admin/software/view-count?${params}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `software-view-stats-${dayjs().format('YYYY-MM-DD')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        message.success('导出成功')
      } else {
        message.error('导出失败')
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      message.error('导出失败，请稍后重试')
    }
  }

  // 日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters({
        ...filters,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      })
    } else {
      setFilters({
        ...filters,
        startDate: '',
        endDate: ''
      })
    }
  }

  // 访问量范围变化
  const handleViewCountRangeChange = (type: 'min' | 'max', value: string) => {
    setFilters({
      ...filters,
      [type === 'min' ? 'minViewCount' : 'maxViewCount']: value
    })
  }

  // 应用筛选
  const handleApplyFilters = () => {
    fetchStats()
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minViewCount: '',
      maxViewCount: ''
    })
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 计算访问量分布
  const getViewCountDistribution = () => {
    if (!statsData) return []

    const ranges = [
      { label: '0-10', min: 0, max: 10, count: 0 },
      { label: '11-50', min: 11, max: 50, count: 0 },
      { label: '51-100', min: 51, max: 100, count: 0 },
      { label: '101-500', min: 101, max: 500, count: 0 },
      { label: '501-1000', min: 501, max: 1000, count: 0 },
      { label: '1000+', min: 1001, max: Infinity, count: 0 }
    ]

    statsData.statistics.forEach(item => {
      const range = ranges.find(r => item.viewCount >= r.min && item.viewCount <= r.max)
      if (range) range.count++
    })

    return ranges
  }

  // 表格列定义
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Tag color={index < 3 ? 'gold' : 'blue'}>#{index + 1}</Tag>
      )
    },
    {
      title: '软件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.nameEn && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        category ? <Tag color="purple">{category}</Tag> : <Text type="secondary">未分类</Text>
      )
    },
    {
      title: '访问量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      sorter: (a: any, b: any) => a.viewCount - b.viewCount,
      render: (viewCount: number) => {
        const maxViews = statsData?.summary.maxViews || 1
        const percentage = Math.round((viewCount / maxViews) * 100)
        
        return (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: 4 }}>
              {viewCount.toLocaleString()}
            </div>
            <Progress percent={percentage} size="small" showInfo={false} />
          </div>
        )
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ]

  const distribution = getViewCountDistribution()

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
            <BarChartOutlined /> 访问量分析
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            软件访问量分析
          </Title>
          <Text type="secondary">
            详细的访问量统计分析和数据导出功能
          </Text>
        </div>

        {/* 筛选器 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>日期范围</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  onChange={handleDateRangeChange}
                  placeholder={['开始日期', '结束日期']}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>访问量范围</Text>
                <Space.Compact style={{ width: '100%' }}>
                  <input
                    placeholder="最小值"
                    type="number"
                    style={{ width: '50%', padding: '4px 8px', border: '1px solid #d9d9d9' }}
                    onChange={(e) => handleViewCountRangeChange('min', e.target.value)}
                  />
                  <input
                    placeholder="最大值"
                    type="number"
                    style={{ width: '50%', padding: '4px 8px', border: '1px solid #d9d9d9' }}
                    onChange={(e) => handleViewCountRangeChange('max', e.target.value)}
                  />
                </Space.Compact>
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleResetFilters}>重置</Button>
                <Button type="primary" onClick={handleApplyFilters}>
                  应用筛选
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
                  导出CSV
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchStats}>
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 统计概览 */}
        {statsData && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="软件总数"
                  value={statsData.summary.totalSoftware}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="总访问量"
                  value={statsData.summary.totalViews}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="平均访问量"
                  value={statsData.summary.averageViews}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="最高访问量"
                  value={statsData.summary.maxViews}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 访问量分布 */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={8}>
            <Card title="访问量分布" extra={<BarChartOutlined />}>
              <div>
                {distribution.map(range => (
                  <div key={range.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text>{range.label} 次</Text>
                      <Text strong>{range.count} 个软件</Text>
                    </div>
                    <Progress 
                      percent={statsData ? Math.round((range.count / statsData.summary.totalSoftware) * 100) : 0}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card title="访问量排行" extra={<EyeOutlined />}>
              <Table
                columns={columns}
                dataSource={statsData?.statistics.slice(0, 10) || []}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* 完整数据表格 */}
        <Card title="完整统计数据">
          <Table
            columns={columns}
            dataSource={statsData?.statistics || []}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Content>
    </Layout>
  )
}
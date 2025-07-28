'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout,
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Modal, 
  message,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Badge
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  NotificationOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

const { Search } = Input
const { Option } = Select
const { Title } = Typography
const { Content } = Layout

interface Announcement {
  id: string
  softwareId: string
  title: string
  titleEn?: string
  content: string
  type: string
  priority: string
  version?: string
  isPublished: boolean
  publishedAt: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

interface Software {
  id: string
  name: string
}

export default function AnnouncementManagement() {
  const [loading, setLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [software, setSoftware] = useState<Software[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    softwareId: '',
    type: '',
    priority: '',
    isPublished: ''
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/app'

  // 获取软件列表（用于筛选）
  const fetchSoftware = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software?limit=100`)
      const data = await response.json()
      if (data.success) {
        setSoftware(data.data.software)
      }
    } catch (error) {
      console.error('Error fetching software:', error)
    }
  }

  // 获取公告列表
  const fetchAnnouncements = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      // 这里需要实现一个获取所有公告的API端点
      // 暂时使用模拟数据
      const mockData = {
        success: true,
        data: {
          announcements: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0
          }
        }
      }

      setAnnouncements(mockData.data.announcements)
      setPagination({
        current: mockData.data.pagination.page,
        pageSize: mockData.data.pagination.limit,
        total: mockData.data.pagination.total
      })
    } catch (error) {
      console.error('Error fetching announcements:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除公告
  const handleDelete = async (softwareId: string, announcementId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/${softwareId}/announcements/${announcementId}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      const data = await response.json()

      if (data.success) {
        message.success('删除成功')
        fetchAnnouncements(pagination.current, pagination.pageSize)
      } else {
        message.error(data.error?.message || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red'
      case 'high': return 'orange'
      case 'normal': return 'blue'
      case 'low': return 'green'
      default: return 'default'
    }
  }

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'red'
      case 'update': return 'blue'
      case 'maintenance': return 'orange'
      case 'general': return 'default'
      default: return 'default'
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '公告标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Announcement) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.titleEn && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.titleEn}</div>
          )}
        </div>
      )
    },
    {
      title: '所属软件',
      dataIndex: 'softwareId',
      key: 'softwareId',
      render: (softwareId: string) => {
        const soft = software.find(s => s.id === softwareId)
        return soft ? soft.name : '未知软件'
      }
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {type === 'security' ? '安全' : 
           type === 'update' ? '更新' :
           type === 'maintenance' ? '维护' : '一般'}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === 'urgent' ? '紧急' :
           priority === 'high' ? '高' :
           priority === 'normal' ? '普通' : '低'}
        </Tag>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => version || '-'
    },
    {
      title: '发布状态',
      dataIndex: 'isPublished',
      key: 'isPublished',
      render: (isPublished: boolean, record: Announcement) => {
        const isExpired = record.expiresAt && new Date(record.expiresAt) < new Date()
        
        if (isExpired) {
          return <Badge status="default" text="已过期" />
        }
        
        return (
          <Badge 
            status={isPublished ? 'success' : 'warning'} 
            text={isPublished ? '已发布' : '草稿'} 
          />
        )
      }
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Announcement) => (
        <Space size="middle">
          <Link href={`/dashboard/announcements/${record.softwareId}/${record.id}`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              编辑
            </Button>
          </Link>
          <Popconfirm
            title="确定要删除这个公告吗？"
            description="删除后将无法恢复。"
            onConfirm={() => handleDelete(record.softwareId, record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 初始化数据
  useEffect(() => {
    fetchSoftware()
    fetchAnnouncements()
  }, [])

  // 搜索和筛选
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    fetchAnnouncements(1, pagination.pageSize)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchAnnouncements(1, pagination.pageSize)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      
      <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>公告管理</Title>
          <p>管理所有软件的公告信息，包括版本更新、安全通知、维护公告等。</p>
        </div>

        {/* 操作栏 */}
        <Card style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Search
                placeholder="搜索公告标题"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Select
                placeholder="选择软件"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('softwareId', value || '')}
              >
                {software.map(soft => (
                  <Option key={soft.id} value={soft.id}>{soft.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="类型"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('type', value || '')}
              >
                <Option value="general">一般</Option>
                <Option value="update">更新</Option>
                <Option value="security">安全</Option>
                <Option value="maintenance">维护</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: '100%' }}
                onChange={(value) => handleFilterChange('priority', value || '')}
              >
                <Option value="low">低</Option>
                <Option value="normal">普通</Option>
                <Option value="high">高</Option>
                <Option value="urgent">紧急</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space>
                <Link href="/dashboard/announcements/new">
                  <Button type="primary" icon={<PlusOutlined />}>
                    发布公告
                  </Button>
                </Link>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={() => fetchAnnouncements(pagination.current, pagination.pageSize)}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 公告列表表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={announcements}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                fetchAnnouncements(page, pageSize)
              }
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Content>
    </Layout>
  )
}

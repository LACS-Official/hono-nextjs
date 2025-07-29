'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Breadcrumb,
  message,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface Announcement {
  id: number
  title: string
  type: string
  priority: string
  isPublished: boolean
  publishedAt: string
  expiresAt?: string
  createdAt: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 模拟数据
  useEffect(() => {
    const mockData: Announcement[] = [
      {
        id: 1,
        title: '系统维护通知',
        type: 'maintenance',
        priority: 'high',
        isPublished: true,
        publishedAt: '2024-01-15 10:00:00',
        expiresAt: '2024-01-20 10:00:00',
        createdAt: '2024-01-15 09:30:00'
      },
      {
        id: 2,
        title: '新功能发布',
        type: 'update',
        priority: 'normal',
        isPublished: true,
        publishedAt: '2024-01-10 14:00:00',
        createdAt: '2024-01-10 13:30:00'
      }
    ]
    
    setTimeout(() => {
      setAnnouncements(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const getTypeTag = (type: string) => {
    const typeMap = {
      general: { color: 'blue', text: '一般公告' },
      maintenance: { color: 'orange', text: '维护公告' },
      update: { color: 'green', text: '更新公告' },
      security: { color: 'red', text: '安全公告' },
      promotion: { color: 'purple', text: '推广公告' }
    }
    const config = typeMap[type as keyof typeof typeMap] || { color: 'default', text: type }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getPriorityTag = (priority: string) => {
    const priorityMap = {
      low: { color: 'default', text: '低' },
      normal: { color: 'blue', text: '普通' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' }
    }
    const config = priorityMap[priority as keyof typeof priorityMap] || { color: 'default', text: priority }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const columns: ColumnsType<Announcement> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => `#${id}`
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: getTypeTag
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: getPriorityTag
    },
    {
      title: '状态',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 100,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'default'}>
          {isPublished ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 180,
      render: (publishedAt: string) => publishedAt || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record: Announcement) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => router.push(`/dashboard/announcements/${record.id}`)}
            >
              查看
            </Button>
          </Tooltip>
          <Tooltip title="编辑公告">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => router.push(`/dashboard/announcements/${record.id}/edit`)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="删除公告">
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  const handleDelete = (id: number) => {
    message.info(`删除公告 #${id} 功能待实现`)
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <Link href="/dashboard">
            <HomeOutlined /> 控制台
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <BellOutlined /> 公告管理
        </Breadcrumb.Item>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px' 
      }}>
        <Title level={2}>
          <BellOutlined style={{ marginRight: '8px' }} />
          公告管理
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => router.push('/dashboard/announcements/new')}
        >
          新增公告
        </Button>
      </div>

      {/* 公告列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  )
}

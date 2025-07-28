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
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined
} from '@ant-design/icons'
import Link from 'next/link'

const { Search } = Input
const { Option } = Select
const { Title } = Typography
const { Content } = Layout

interface Software {
  id: string
  name: string
  nameEn?: string
  description?: string
  currentVersion: string
  latestVersion: string
  category?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  tags?: string[]
  downloadUrl?: string
}

export default function SoftwareManagement() {
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: ''
  })

  // API 基础 URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取软件列表
  const fetchSoftware = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive && { isActive: filters.isActive })
      })

      const response = await fetch(`${API_BASE_URL}/software?${params}`)
      const data = await response.json()

      if (data.success) {
        setSoftware(data.data.software)
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        })
      } else {
        message.error('获取软件列表失败')
      }
    } catch (error) {
      console.error('Error fetching software:', error)
      message.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除软件
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      const data = await response.json()

      if (data.success) {
        message.success('删除成功')
        fetchSoftware(pagination.current, pagination.pageSize)
      } else {
        message.error(data.error?.message || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting software:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '软件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Software) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.nameEn && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.nameEn}</div>
          )}
        </div>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200
    },
    {
      title: '当前版本',
      dataIndex: 'currentVersion',
      key: 'currentVersion'
    },
    {
      title: '最新版本',
      dataIndex: 'latestVersion',
      key: 'latestVersion',
      render: (text: string, record: Software) => (
        <Tag color={text !== record.currentVersion ? 'orange' : 'green'}>
          {text}
        </Tag>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => text ? <Tag>{text}</Tag> : '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Software) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Link href={`/admin/software/${record.id}`}>
              <Button type="link" icon={<EyeOutlined />} size="small">
                查看
              </Button>
            </Link>
          </Tooltip>
          <Tooltip title="编辑软件">
            <Link href={`/admin/software/${record.id}/edit`}>
              <Button type="link" icon={<EditOutlined />} size="small">
                编辑
              </Button>
            </Link>
          </Tooltip>
          <Popconfirm
            title="确定要删除这个软件吗？"
            description="删除后将无法恢复，相关公告也会被删除。"
            onConfirm={() => handleDelete(record.id)}
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
  }, [])

  // 搜索和筛选
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    fetchSoftware(1, pagination.pageSize)
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchSoftware(1, pagination.pageSize)
  }

  return (
    <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
      {/* 页面标题 */}
      <div className="responsive-card-spacing">
        <Title level={2} className="responsive-title">软件管理</Title>
        <p>管理系统中的所有软件信息，包括版本、分类、状态等。</p>
      </div>

        {/* 操作栏 */}
        <Card className="responsive-card-spacing">
          <div className="responsive-search-container">
            <div style={{ flex: 1, minWidth: '200px' }}>
              <Search
                placeholder="搜索软件名称或描述"
                allowClear
                onSearch={handleSearch}
                style={{ width: '100%', marginBottom: '12px' }}
              />
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12}>
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
                  </Select>
                </Col>
                <Col xs={24} sm={12}>
                  <Select
                    placeholder="选择状态"
                    allowClear
                    style={{ width: '100%' }}
                    onChange={(value) => handleFilterChange('isActive', value || '')}
                  >
                    <Option value="true">启用</Option>
                    <Option value="false">禁用</Option>
                  </Select>
                </Col>
              </Row>
            </div>
            <div className="responsive-button-group">
              <Link href="/admin/software/new">
                <Button type="primary" icon={<PlusOutlined />}>
                  添加软件
                </Button>
              </Link>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchSoftware(pagination.current, pagination.pageSize)}
              >
                刷新
              </Button>
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
            </div>
          </div>
        </Card>

        {/* 软件列表表格 */}
        <Card>
          <div className="responsive-table-container">
            <Table
              columns={columns}
              dataSource={software}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                onChange: (page, pageSize) => {
                  fetchSoftware(page, pageSize)
                },
                responsive: true
              }}
              scroll={{ x: 1000 }}
            />
          </div>
        </Card>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Tooltip,
  Badge,
  Statistic,
  Alert,
  Breadcrumb,
  Divider,
  Layout,
  Empty,
  Spin
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  HomeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import type { ColumnsType } from 'antd/es/table'

const { Search } = Input
const { Option } = Select
const { Title, Text } = Typography
const { Content } = Layout

interface Software {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  latestVersion?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: any
  isActive: boolean
  sortOrder: number
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface SoftwareStats {
  total: number
  active: number
  inactive: number
  categories: { [key: string]: number }
}

interface Pagination {
  current: number
  pageSize: number
  total: number
}

interface Filters {
  search: string
  category: string
  isActive: string
}

export default function SoftwareManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [stats, setStats] = useState<SoftwareStats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    isActive: ''
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取软件统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software?limit=1000`)
      const data = await response.json()

      if (data.success && data.data.software) {
        const allSoftware = data.data.software
        const stats: SoftwareStats = {
          total: allSoftware.length,
          active: allSoftware.filter((s: Software) => s.isActive).length,
          inactive: allSoftware.filter((s: Software) => !s.isActive).length,
          categories: {}
        }

        // 统计分类
        allSoftware.forEach((s: Software) => {
          if (s.category) {
            stats.categories[s.category] = (stats.categories[s.category] || 0) + 1
          }
        })

        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

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
      message.error('获取软件列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除软件
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      const data = await response.json()

      if (data.success) {
        message.success('删除成功')
        fetchSoftware(pagination.current, pagination.pageSize)
        fetchStats() // 更新统计信息
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting software:', error)
      message.error('删除失败，请稍后重试')
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的软件')
      return
    }

    try {
      const promises = selectedRowKeys.map(id => 
        fetch(`${API_BASE_URL}/software/id/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
          }
        })
      )

      await Promise.all(promises)
      message.success(`成功删除 ${selectedRowKeys.length} 个软件`)
      setSelectedRowKeys([])
      fetchSoftware(pagination.current, pagination.pageSize)
      fetchStats()
    } catch (error) {
      console.error('Error batch deleting:', error)
      message.error('批量删除失败')
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value })
    fetchSoftware(1, pagination.pageSize)
  }

  // 筛选处理
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    fetchSoftware(1, pagination.pageSize)
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchSoftware(pagination.current, pagination.pageSize)
    fetchStats()
  }

  // 导出数据
  const handleExport = () => {
    // TODO: 实现导出功能
    message.info('导出功能开发中...')
  }

  // 初始化数据
  useEffect(() => {
    fetchSoftware()
    fetchStats()
  }, [])

  // 表格列定义
  const columns: ColumnsType<Software> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <Tag color="blue">#{id}</Tag>
      )
    },
    {
      title: '软件名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Software) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{text}</div>
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
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (description: string) => (
        description ? (
          <Tooltip placement="topLeft" title={description}>
            <div style={{ 
              maxWidth: 200, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {description}
            </div>
          </Tooltip>
        ) : (
          <Text type="secondary">暂无描述</Text>
        )
      )
    },
    {
      title: '版本信息',
      key: 'version',
      width: 150,
      render: (_, record: Software) => (
        <div>
          <div>
            <Text strong>当前: </Text>
            <Tag color="green">{record.currentVersion}</Tag>
          </div>
          {record.latestVersion && record.latestVersion !== record.currentVersion && (
            <div style={{ marginTop: 4 }}>
              <Text strong>最新: </Text>
              <Tag color="blue">{record.latestVersion}</Tag>
            </div>
          )}
        </div>
      )
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
      width: 150,
      render: (tags: string[]) => (
        <div>
          {tags && tags.length > 0 ? (
            tags.slice(0, 2).map(tag => (
              <Tag key={tag} style={{ marginBottom: 2, fontSize: '12px' }}>
                {tag}
              </Tag>
            ))
          ) : (
            <Text type="secondary">无标签</Text>
          )}
          {tags && tags.length > 2 && (
            <Tooltip title={tags.slice(2).join(', ')}>
              <Tag style={{ fontSize: '12px' }}>+{tags.length - 2}</Tag>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? '启用' : '禁用'}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record: Software) => (
        <Space size="small">
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
            description="删除后将无法恢复，相关版本历史也会被删除。"
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

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as number[])
    },
    getCheckboxProps: (record: Software) => ({
      disabled: false,
      name: record.name,
    }),
  }

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
            <AppstoreOutlined /> 软件管理
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            软件管理
          </Title>
          <Text type="secondary">
            管理系统中的所有软件信息，包括版本控制和下载链接管理
          </Text>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="软件总数"
                  value={stats.total}
                  prefix={<AppstoreOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="启用软件"
                  value={stats.active}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="禁用软件"
                  value={stats.inactive}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="分类数量"
                  value={Object.keys(stats.categories).length}
                  prefix={<FilterOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 操作栏 */}
        <Card style={{ marginBottom: '24px' }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Space wrap>
                <Search
                  placeholder="搜索软件名称或描述"
                  allowClear
                  onSearch={handleSearch}
                  style={{ width: 250 }}
                  enterButton={<SearchOutlined />}
                />
                <Select
                  placeholder="选择分类"
                  allowClear
                  style={{ width: 150 }}
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
                <Select
                  placeholder="选择状态"
                  allowClear
                  style={{ width: 120 }}
                  onChange={(value) => handleFilterChange('isActive', value || '')}
                >
                  <Option value="true">启用</Option>
                  <Option value="false">禁用</Option>
                </Select>
              </Space>
            </Col>
            <Col xs={24} lg={8}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                {selectedRowKeys.length > 0 && (
                  <Popconfirm
                    title={`确定要删除选中的 ${selectedRowKeys.length} 个软件吗？`}
                    onConfirm={handleBatchDelete}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      批量删除 ({selectedRowKeys.length})
                    </Button>
                  </Popconfirm>
                )}
                <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                  刷新
                </Button>
                <Button icon={<ExportOutlined />} onClick={handleExport}>
                  导出
                </Button>
                <Link href="/admin/software/new">
                  <Button type="primary" icon={<PlusOutlined />}>
                    新增软件
                  </Button>
                </Link>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 软件列表表格 */}
        <Card>
          {selectedRowKeys.length > 0 && (
            <Alert
              message={`已选择 ${selectedRowKeys.length} 个软件`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              action={
                <Button size="small" onClick={() => setSelectedRowKeys([])}>
                  清除选择
                </Button>
              }
            />
          )}

          <Table
            columns={columns}
            dataSource={software}
            rowKey="id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              onChange: (page, pageSize) => {
                fetchSoftware(page, pageSize)
              },
              onShowSizeChange: (current, size) => {
                fetchSoftware(1, size)
              }
            }}
            scroll={{ x: 1400 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无软件数据"
                >
                  <Link href="/admin/software/new">
                    <Button type="primary" icon={<PlusOutlined />}>
                      立即添加
                    </Button>
                  </Link>
                </Empty>
              )
            }}
          />
        </Card>
      </Content>
    </Layout>
  )
}

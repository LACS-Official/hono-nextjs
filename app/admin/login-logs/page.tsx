'use client'

import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  DatePicker,
  Input,
  Select,
  Tag,
  Modal,
  message,
  Card,
  Typography,
  Row,
  Col,
  Spin
} from 'antd'
import {
  LogoutOutlined,
  SearchOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface DeviceInfo {
  device: {
    model: string
    type: string
    vendor: string
  }
  os: {
    name: string
    version: string
  }
  browser: {
    name: string
    version: string
  }
  engine: {
    name: string
    version: string
  }
}

interface NetworkInfo {
  language: string
  referer: string
  networkType: string
  carrier: string
}

interface LoginLog {
  id: string
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  deviceInfo: DeviceInfo
  networkInfo: NetworkInfo
  loginTime: string
  sessionId: string
  isActive: boolean
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LoginLogsResponse {
  success: boolean
  data: {
    logs: LoginLog[]
    pagination: Pagination
  }
}

interface FilterParams {
  email?: string
  ipAddress?: string
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null]
  isActive?: boolean
}

const LoginLogsPage: React.FC = () => {
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [filterParams, setFilterParams] = useState<FilterParams>({})
  const [selectedLog, setSelectedLog] = useState<LoginLog | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false)
  const [logoutSessionId, setLogoutSessionId] = useState<string>('')

  // 表格列定义
  const columns: ColumnsType<LoginLog> = [
    {
      title: '登录账号',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => <Text strong>{email}</Text>
    },
    {
      title: '登录IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150
    },
    {
      title: '设备类型',
      dataIndex: 'deviceInfo',
      key: 'deviceType',
      width: 120,
      render: (deviceInfo: DeviceInfo) => {
        const deviceType = deviceInfo.device.type || 'Unknown'
        return <Tag color={deviceType === 'Unknown' ? 'default' : 'blue'}>{deviceType}</Tag>
      }
    },
    {
      title: '操作系统',
      dataIndex: 'deviceInfo',
      key: 'os',
      width: 180,
      render: (deviceInfo: DeviceInfo) => {
        const { name, version } = deviceInfo.os
        return `${name} ${version}`
      }
    },
    {
      title: '浏览器',
      dataIndex: 'deviceInfo',
      key: 'browser',
      width: 180,
      render: (deviceInfo: DeviceInfo) => {
        const { name, version } = deviceInfo.browser
        return `${name} ${version}`
      }
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 200,
      sorter: (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime(),
      render: (loginTime) => dayjs(loginTime).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '会话状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '已登出'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: LoginLog) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record)
              setDetailModalVisible(true)
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            danger
            icon={<LogoutOutlined />}
            onClick={() => {
              setLogoutSessionId(record.sessionId)
              setLogoutConfirmVisible(true)
            }}
            disabled={!record.isActive}
          >
            退出登录
          </Button>
        </Space>
      )
    }
  ]

  // 获取登录日志列表
  const fetchLoginLogs = async (page: number = 1, limit: number = 20, filters?: FilterParams) => {
    setLoading(true)
    try {
      const url = new URL('/api/login-logs', window.location.origin)
      
      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', limit.toString())
      
      if (filters?.email) {
        url.searchParams.set('email', filters.email)
      }
      
      if (filters?.ipAddress) {
        url.searchParams.set('ipAddress', filters.ipAddress)
      }
      
      if (filters?.dateRange) {
        if (filters.dateRange[0]) {
          url.searchParams.set('startDate', filters.dateRange[0].startOf('day').toISOString())
        }
        if (filters.dateRange[1]) {
          url.searchParams.set('endDate', filters.dateRange[1].endOf('day').toISOString())
        }
      }
      
      if (filters?.isActive !== undefined) {
        url.searchParams.set('isActive', filters.isActive.toString())
      }
      
      const response = await fetch(url.toString())
      
      if (!response.ok) {
        console.error('响应状态码:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: LoginLogsResponse = await response.json()
      console.log('API响应数据:', data)
      
      if (data.success) {
        setLoginLogs(data.data.logs)
        setPagination(data.data.pagination)
      } else {
        console.error('API返回错误:', data.error)
        message.error(`获取登录日志失败: ${data.error || '未知错误'}`)
      }
    } catch (error) {
      console.error('获取登录日志失败:', error)
      message.error(`获取登录日志失败: ${error.message || '网络错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchLoginLogs(pagination.page, pagination.limit, filterParams)
  }, [pagination.page, pagination.limit])

  // 处理筛选条件变化
  const handleFilterChange = (newFilterParams: Partial<FilterParams>) => {
    // 处理RangePicker返回的null值
    const processedFilters = { ...newFilterParams }
    if (processedFilters.dateRange === null) {
      delete processedFilters.dateRange
    }
    
    const updatedFilters = { ...filterParams, ...processedFilters }
    setFilterParams(updatedFilters)
    fetchLoginLogs(1, pagination.limit, updatedFilters)
  }

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      page,
      limit: pageSize
    }))
  }

  // 处理强制登出
  const handleForceLogout = async () => {
    try {
      const response = await fetch(`/api/login-logs/logout/${logoutSessionId}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        message.success('强制登出成功')
        fetchLoginLogs(pagination.page, pagination.limit, filterParams)
      } else {
        message.error(data.error || '强制登出失败')
      }
    } catch (error) {
      console.error('强制登出失败:', error)
      message.error('强制登出失败')
    } finally {
      setLogoutConfirmVisible(false)
      setLogoutSessionId('')
    }
  }

  // 重置筛选条件
  const handleResetFilters = () => {
    setFilterParams({})
    fetchLoginLogs(1, pagination.limit, {})
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>登录日志管理</Title>
      
      {/* 筛选栏 */}
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilterOutlined />
            <span>筛选条件</span>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="按账号搜索"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => handleFilterChange({ email: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="按IP地址搜索"
              allowClear
              onChange={(e) => handleFilterChange({ ipAddress: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              onChange={(dateRange) => {
                if (dateRange) {
                  handleFilterChange({ dateRange })
                } else {
                  handleFilterChange({ dateRange: undefined })
                }
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="会话状态"
              allowClear
              onChange={(value) => handleFilterChange({ isActive: value })}
            >
              <Option value={true}>活跃</Option>
              <Option value={false}>已登出</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} style={{ display: 'flex', gap: 8 }}>
            <Button
              type="primary"
              onClick={() => fetchLoginLogs(pagination.page, pagination.limit, filterParams)}
              icon={<ReloadOutlined />}
            >
              刷新数据
            </Button>
            <Button
              onClick={handleResetFilters}
            >
              重置筛选
            </Button>
          </Col>
        </Row>
      </Card>
      
      {/* 登录日志表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={loginLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: handlePageChange,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
      
      {/* 登录详情模态框 */}
      <Modal
        title="登录详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {selectedLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
              <Text strong>登录账号：</Text>
              <Text>{selectedLog.email}</Text>
              
              <Text strong>用户ID：</Text>
              <Text code>{selectedLog.userId}</Text>
              
              <Text strong>登录IP：</Text>
              <Text>{selectedLog.ipAddress}</Text>
              
              <Text strong>登录时间：</Text>
              <Text>{dayjs(selectedLog.loginTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
              
              <Text strong>会话ID：</Text>
              <Text code>{selectedLog.sessionId}</Text>
              
              <Text strong>会话状态：</Text>
              <Tag color={selectedLog.isActive ? 'green' : 'red'}>
                {selectedLog.isActive ? '活跃' : '已登出'}
              </Tag>
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>设备信息：</Text>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                <Text strong>设备类型：</Text>
                <Text>{selectedLog.deviceInfo.device.type || 'Unknown'}</Text>
                <Text strong>设备型号：</Text>
                <Text>{selectedLog.deviceInfo.device.model || 'Unknown'}</Text>
                
                <Text strong>设备厂商：</Text>
                <Text>{selectedLog.deviceInfo.device.vendor || 'Unknown'}</Text>
                <Text strong>操作系统：</Text>
                <Text>{selectedLog.deviceInfo.os.name} {selectedLog.deviceInfo.os.version}</Text>
                
                <Text strong>浏览器：</Text>
                <Text>{selectedLog.deviceInfo.browser.name} {selectedLog.deviceInfo.browser.version}</Text>
                <Text strong>渲染引擎：</Text>
                <Text>{selectedLog.deviceInfo.engine.name} {selectedLog.deviceInfo.engine.version}</Text>
              </div>
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>网络信息：</Text>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                <Text strong>语言：</Text>
                <Text>{selectedLog.networkInfo.language || 'Unknown'}</Text>
                <Text strong>来源：</Text>
                <Text>{selectedLog.networkInfo.referer || 'Direct'}</Text>
                
                <Text strong>网络类型：</Text>
                <Text>{selectedLog.networkInfo.networkType || 'Unknown'}</Text>
                <Text strong>运营商：</Text>
                <Text>{selectedLog.networkInfo.carrier || 'Unknown'}</Text>
              </div>
            </div>
            
            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>原始User-Agent：</Text>
              <div style={{ padding: '12px', backgroundColor: '#fafafa', borderRadius: 6, fontFamily: 'monospace', fontSize: '12px', overflow: 'auto' }}>
                {selectedLog.userAgent}
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 强制登出确认模态框 */}
      <Modal
        title="确认强制登出"
        open={logoutConfirmVisible}
        onOk={handleForceLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
        okText="确认"
        cancelText="取消"
        okType="danger"
      >
        <p>您确定要强制登出该设备吗？该操作将立即终止此会话，用户需要重新登录。</p>
        <p style={{ color: '#ff4d4f', marginTop: 8 }}>注意：此操作不可撤销，请谨慎操作！</p>
      </Modal>
    </div>
  )
}

export default LoginLogsPage

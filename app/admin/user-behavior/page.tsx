'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Typography,
  Tabs,
  message,
  Spin,
  Tag
} from 'antd'
import {
  UserOutlined,
  MobileOutlined,
  BarChartOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

interface UsageRecord {
  id: string
  softwareName: string
  softwareVersion?: string
  deviceFingerprint: string
  used: number
  usedAt: string
}

interface DeviceConnection {
  id: string
  deviceSerial: string
  deviceBrand?: string
  deviceModel?: string
  softwareId: number
  userDeviceFingerprint?: string
  createdAt: string
}

interface UsageStats {
  totalUsage: number
  uniqueDevices: number
  recentUsage: UsageRecord[]
  summary: {
    totalUsage: number
    uniqueDevices: number
    averageUsagePerDevice: string
  }
}

interface DeviceConnectionStats {
  totalConnections: number
  uniqueDevices: number
  recentConnections: DeviceConnection[]
  summary: {
    totalConnections: number
    uniqueDevices: number
    averageConnectionsPerDevice: string
  }
}

export default function UserBehaviorPage() {
  const [loading, setLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [deviceStats, setDeviceStats] = useState<DeviceConnectionStats | null>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedSoftware, setSelectedSoftware] = useState<number | undefined>(undefined)

  // 获取使用统计数据
  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedSoftware) {
        params.append('softwareId', selectedSoftware.toString())
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
      }

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        message.error('用户未登录')
        return
      }

      const response = await fetch(`/api/user-behavior/usage?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setUsageStats(data.data)
      } else {
        message.error('获取使用统计失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      message.error('获取使用统计失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取设备连接统计数据
  const fetchDeviceStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedSoftware) {
        params.append('softwareId', selectedSoftware.toString())
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'))
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'))
      }

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        message.error('用户未登录')
        return
      }

      const response = await fetch(`/api/user-behavior/device-connections?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setDeviceStats(data.data)
      } else {
        message.error('获取设备连接统计失败: ' + data.error)
      }
    } catch (error) {
      console.error('Error fetching device stats:', error)
      message.error('获取设备连接统计失败')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchUsageStats()
    fetchDeviceStats()
  }

  // 导出数据
  const handleExport = () => {
    message.info('导出功能开发中...')
  }

  useEffect(() => {
    fetchUsageStats()
    fetchDeviceStats()
  }, [selectedSoftware, dateRange])

  // 使用记录表格列定义
  const usageColumns = [
    {
      title: '软件名称',
      dataIndex: 'softwareName',
      key: 'softwareName',
    },
    {
      title: '软件版本',
      dataIndex: 'softwareVersion',
      key: 'softwareVersion',
      render: (version: string) => version || '-',
    },
    {
      title: '设备指纹',
      dataIndex: 'deviceFingerprint',
      key: 'deviceFingerprint',
      render: (fingerprint: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {fingerprint.substring(0, 16)}...
        </span>
      ),
    },
    {
      title: '使用次数',
      dataIndex: 'used',
      key: 'used',
      render: (used: number) => (
        <Tag color="blue">{used}</Tag>
      ),
    },
    {
      title: '最后使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  // 设备连接表格列定义
  const deviceColumns = [
    {
      title: '设备序列号',
      dataIndex: 'deviceSerial',
      key: 'deviceSerial',
      render: (serial: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {serial}
        </span>
      ),
    },
    {
      title: '设备品牌',
      dataIndex: 'deviceBrand',
      key: 'deviceBrand',
      render: (brand: string) => brand || '-',
    },
    {
      title: '设备型号',
      dataIndex: 'deviceModel',
      key: 'deviceModel',
      render: (model: string) => model || '-',
    },
    {
      title: '软件ID',
      dataIndex: 'softwareId',
      key: 'softwareId',
    },
    {
      title: '用户设备指纹',
      dataIndex: 'userDeviceFingerprint',
      key: 'userDeviceFingerprint',
      render: (fingerprint: string) => fingerprint ? (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {fingerprint.substring(0, 16)}...
        </span>
      ) : '-',
    },
    {
      title: '连接时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>用户行为统计</Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
          />
          <Select
            placeholder="选择软件"
            style={{ width: 200 }}
            value={selectedSoftware}
            onChange={setSelectedSoftware}
            allowClear
          >
            <Option value={1}>玩机管家</Option>
            {/* 这里可以动态加载软件列表 */}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Tabs defaultActiveKey="usage">
          <TabPane tab="软件使用统计" key="usage">
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总使用次数"
                    value={usageStats?.totalUsage || 0}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="独立设备数"
                    value={usageStats?.uniqueDevices || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="平均使用次数/设备"
                    value={usageStats?.summary.averageUsagePerDevice || '0'}
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="最近使用记录">
              <Table
                columns={usageColumns}
                dataSource={usageStats?.recentUsage || []}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>

          <TabPane tab="设备连接统计" key="device">
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总连接次数"
                    value={deviceStats?.totalConnections || 0}
                    prefix={<MobileOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="独立设备数"
                    value={deviceStats?.uniqueDevices || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="平均连接次数/设备"
                    value={deviceStats?.summary.averageConnectionsPerDevice || '0'}
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="最近连接记录">
              <Table
                columns={deviceColumns}
                dataSource={deviceStats?.recentConnections || []}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  )
}
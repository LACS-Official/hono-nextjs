'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  List,
  Tag,
  Progress,
  Spin,
  Alert,
  Space,
  Divider,
  Tooltip,
  Badge
} from 'antd'
import {
  AppstoreOutlined,
  NotificationOutlined,
  KeyOutlined,
  UserOutlined,
  ReloadOutlined,
  PlusOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  ApiOutlined,
  RiseOutlined,
  FallOutlined,
  HeartOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

// 统计数据接口
interface DashboardStats {
  software: {
    total: number
    active: number
    inactive: number
    recentlyAdded: number
    categories: Array<{ category: string; count: number }>
  }
  activationCodes: {
    total: number
    used: number
    available: number
    expired: number
    recentlyGenerated: number
    recentlyUsed: number
    usageRate: number
  }
  userBehavior: {
    totalUsage: number
    recentUsage: number
    uniqueDevices: number
    popularSoftware: Array<{ softwareName: string; totalUsed: number }>
  }
  system: {
    status: 'healthy' | 'degraded' | 'error'
    checks: {
      database: boolean
      apiResponse: boolean
      timestamp: string
    }
    uptime: number
    memory: any
    version: string
  }
  lastUpdated: string
}

// 活动记录接口
interface Activity {
  id: string
  type: 'software_created' | 'software_updated' | 'activation_code_generated' | 'activation_code_used' | 'software_activated'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

interface ActivitiesData {
  activities: Activity[]
  total: number
  timeRange: {
    start: string
    end: string
    days: number
  }
  lastUpdated: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('用户未登录')
      }

      // 并行获取统计数据和活动记录
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }),
        fetch('/api/admin/dashboard/activities?limit=10&days=7', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      ])

      if (!statsResponse.ok) {
        throw new Error(`统计数据获取失败: ${statsResponse.status}`)
      }

      if (!activitiesResponse.ok) {
        throw new Error(`活动记录获取失败: ${activitiesResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const activitiesData = await activitiesResponse.json()

      if (statsData.success) {
        setStats(statsData.data)
      } else {
        throw new Error(statsData.error || '统计数据获取失败')
      }

      if (activitiesData.success) {
        setActivities(activitiesData.data)
      } else {
        throw new Error(activitiesData.error || '活动记录获取失败')
      }

    } catch (error) {
      console.error('获取仪表板数据失败:', error)
      setError(error instanceof Error ? error.message : '数据获取失败')
      
      // 如果是认证错误，重定向到登录页面
      if (error instanceof Error && error.message.includes('未登录')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 处理快速操作
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-software':
        router.push('/admin/software/new')
        break
      case 'create-activation-code':
        router.push('/admin/activation-codes/new')
        break
      case 'manage-software':
        router.push('/admin/software')
        break
      case 'manage-announcements':
        router.push('/admin/announcements')
        break
      case 'manage-activation-codes':
        router.push('/admin/activation-codes')
        break
      case 'manage-donors':
        router.push('/admin/donors')
        break
      default:
        break
    }
  }

  // 获取活动类型的图标和颜色
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'software_created':
        return <PlusOutlined style={{ color: '#52c41a' }} />
      case 'software_updated':
        return <AppstoreOutlined style={{ color: '#1890ff' }} />
      case 'activation_code_generated':
        return <KeyOutlined style={{ color: '#722ed1' }} />
      case 'activation_code_used':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'software_activated':
        return <UserOutlined style={{ color: '#fa8c16' }} />
      default:
        return <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return time.toLocaleDateString()
  }

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分钟`
    return `${minutes}分钟`
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">正在加载仪表板数据...</Text>
          </div>
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchDashboardData}>
              重试
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
      {/* 页面头部 */}
      <div className="responsive-card-spacing">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Title level={2} className="responsive-title" style={{ margin: 0 }}>
              API管理仪表板
            </Title>
            <Paragraph style={{ color: '#666', margin: '8px 0 0 0' }}>
              实时监控您的API系统状态和使用情况
            </Paragraph>
          </div>
          <Space>
            <Tooltip title="刷新数据">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchDashboardData}
                loading={loading}
              >
                刷新
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* 主要统计卡片 */}
      <Row gutter={[16, 16]} className="responsive-card-spacing">
        <Col xs={24} sm={12} lg={6}>
          <Card className="responsive-statistic-card" style={{ height: '100%' }}>
            <Statistic
              title="软件总数"
              value={stats?.software.total || 0}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div>活跃: {stats?.software.active || 0}</div>
                  <div>停用: {stats?.software.inactive || 0}</div>
                </div>
              }
            />
            {stats?.software.recentlyAdded ? (
              <div style={{ marginTop: '8px' }}>
                <Tag color="green" icon={<RiseOutlined />}>
                  最近7天新增 {stats.software.recentlyAdded}
                </Tag>
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="responsive-statistic-card" style={{ height: '100%' }}>
            <Statistic
              title="激活码总数"
              value={stats?.activationCodes.total || 0}
              prefix={<KeyOutlined style={{ color: '#722ed1' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div>可用: {stats?.activationCodes.available || 0}</div>
                  <div>已用: {stats?.activationCodes.used || 0}</div>
                </div>
              }
            />
            {stats?.activationCodes.usageRate !== undefined && (
              <div style={{ marginTop: '8px' }}>
                <Progress
                  percent={stats.activationCodes.usageRate}
                  size="small"
                  status={stats.activationCodes.usageRate > 80 ? 'exception' : 'active'}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  使用率 {stats.activationCodes.usageRate}%
                </Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="responsive-statistic-card" style={{ height: '100%' }}>
            <Statistic
              title="总使用次数"
              value={stats?.userBehavior.totalUsage || 0}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              suffix={
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  <div>设备: {stats?.userBehavior.uniqueDevices || 0}</div>
                  <div>最近7天: {stats?.userBehavior.recentUsage || 0}</div>
                </div>
              }
            />
            {stats?.userBehavior.recentUsage ? (
              <div style={{ marginTop: '8px' }}>
                <Tag color="orange" icon={<TrophyOutlined />}>
                  近期活跃
                </Tag>
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="responsive-statistic-card" style={{ height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#8c8c8c', marginBottom: '8px' }}>
                  系统状态
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge
                    status={stats?.system.status === 'healthy' ? 'success' : stats?.system.status === 'degraded' ? 'warning' : 'error'}
                  />
                  <Text strong style={{
                    color: stats?.system.status === 'healthy' ? '#52c41a' : stats?.system.status === 'degraded' ? '#fa8c16' : '#ff4d4f'
                  }}>
                    {stats?.system.status === 'healthy' ? '健康' : stats?.system.status === 'degraded' ? '降级' : '异常'}
                  </Text>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  运行时间
                </div>
                <Text strong>
                  {stats?.system.uptime ? formatUptime(stats.system.uptime) : '未知'}
                </Text>
              </div>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>
                <DatabaseOutlined style={{ marginRight: '4px' }} />
                数据库: {stats?.system.checks.database ? '正常' : '异常'}
              </span>
              <span>
                <ApiOutlined style={{ marginRight: '4px' }} />
                API: {stats?.system.checks.apiResponse ? '正常' : '异常'}
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快速操作和详细信息 */}
      <Row gutter={[16, 16]} className="responsive-card-spacing">
        {/* 快速操作 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <PlusOutlined />
                快速操作
              </Space>
            }
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => router.push('/admin/software')}
              >
                查看全部
              </Button>
            }
          >
            <Row gutter={[12, 12]}>
              <Col xs={24} sm={12}>
                <Button
                  type="primary"
                  block
                  icon={<AppstoreOutlined />}
                  onClick={() => handleQuickAction('create-software')}
                >
                  新增软件
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  block
                  icon={<KeyOutlined />}
                  onClick={() => handleQuickAction('create-activation-code')}
                >
                  生成激活码
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  block
                  icon={<AppstoreOutlined />}
                  onClick={() => handleQuickAction('manage-software')}
                >
                  管理软件
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  block
                  icon={<NotificationOutlined />}
                  onClick={() => handleQuickAction('manage-announcements')}
                >
                  管理公告
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  block
                  icon={<HeartOutlined />}
                  onClick={() => handleQuickAction('manage-donors')}
                >
                  捐赠人员管理
                </Button>
              </Col>
            </Row>

            {/* 热门软件 */}
            {stats?.userBehavior.popularSoftware && stats.userBehavior.popularSoftware.length > 0 && (
              <>
                <Divider />
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>
                    <TrophyOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                    热门软件
                  </Text>
                </div>
                <List
                  size="small"
                  dataSource={stats.userBehavior.popularSoftware.slice(0, 3)}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>
                          <Badge
                            count={index + 1}
                            style={{
                              backgroundColor: index === 0 ? '#fa8c16' : index === 1 ? '#8c8c8c' : '#d9d9d9',
                              color: '#fff',
                              fontSize: '10px',
                              minWidth: '16px',
                              height: '16px',
                              lineHeight: '16px',
                              marginRight: '8px'
                            }}
                          />
                          {item.softwareName}
                        </span>
                        <Text type="secondary">{item.totalUsed} 次使用</Text>
                      </div>
                    </List.Item>
                  )}
                />
              </>
            )}
          </Card>
        </Col>

        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                最近活动
              </Space>
            }
            extra={
              <Text type="secondary" style={{ fontSize: '12px' }}>
                最近7天
              </Text>
            }
          >
            {activities && activities.activities.length > 0 ? (
              <List
                size="small"
                dataSource={activities.activities.slice(0, 8)}
                renderItem={(item) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <List.Item.Meta
                      avatar={getActivityIcon(item.type)}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: '13px' }}>{item.title}</Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {formatTime(item.timestamp)}
                          </Text>
                        </div>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.description}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
                <ClockCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                <div>暂无最近活动</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 数据更新时间 */}
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          数据更新时间: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : '未知'}
        </Text>
      </div>
    </div>
  )
}
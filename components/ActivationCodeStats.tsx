'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Space,
  Typography,
  Spin,
  Alert,
  Button
} from 'antd'
import {
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import {
  activationCodeApi,
  type ActivationCodeStats as StatsType,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

const { Text } = Typography

interface ActivationCodeStatsProps {
  onRefresh?: () => void
  refreshTrigger?: number // 用于外部触发刷新
}

export default function ActivationCodeStats({ onRefresh, refreshTrigger }: ActivationCodeStatsProps) {
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const statsData = await activationCodeApi.getActivationCodeStats()
      setStats(statsData)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadStats()
  }, [])

  // 响应外部刷新触发
  useEffect(() => {
    if (refreshTrigger) {
      loadStats()
    }
  }, [refreshTrigger])

  // 手动刷新
  const handleRefresh = () => {
    loadStats()
    onRefresh?.()
  }

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>正在加载统计信息...</div>
        </div>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Card>
        <Alert
          message="加载统计信息失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <div>
      {/* 主要统计指标 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总激活码"
              value={stats.total}
              prefix={<KeyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已使用"
              value={stats.used}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="有效激活码"
              value={stats.active}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已过期"
              value={stats.expired}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 详细统计和进度条 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="使用情况分析"
            extra={
              <Button 
                type="text" 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                size="small"
              >
                刷新
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 使用率 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>使用率</Text>
                  <Text strong>{stats.usageRate.toFixed(1)}%</Text>
                </div>
                <Progress
                  percent={stats.usageRate}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  showInfo={false}
                />
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.used} / {stats.total} 个激活码已使用
                  </Text>
                </div>
              </div>

              {/* 过期率 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>过期率</Text>
                  <Text strong style={{ color: stats.expirationRate > 20 ? '#ff4d4f' : '#666' }}>
                    {stats.expirationRate.toFixed(1)}%
                  </Text>
                </div>
                <Progress
                  percent={stats.expirationRate}
                  strokeColor={stats.expirationRate > 20 ? '#ff4d4f' : '#faad14'}
                  showInfo={false}
                />
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.expired} / {stats.total} 个激活码已过期
                  </Text>
                </div>
              </div>

              {/* 有效率 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>有效率</Text>
                  <Text strong style={{ color: '#52c41a' }}>
                    {((stats.active / stats.total) * 100).toFixed(1)}%
                  </Text>
                </div>
                <Progress
                  percent={(stats.active / stats.total) * 100}
                  strokeColor="#52c41a"
                  showInfo={false}
                />
                <div style={{ marginTop: '4px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.active} / {stats.total} 个激活码有效
                  </Text>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="状态分布">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 状态分布列表 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text>已使用</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div><Text strong>{stats.used}</Text></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.total > 0 ? ((stats.used / stats.total) * 100).toFixed(1) : 0}%
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text>有效未使用</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div><Text strong>{stats.active}</Text></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  <Text>已过期</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div><Text strong>{stats.expired}</Text></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.total > 0 ? ((stats.expired / stats.total) * 100).toFixed(1) : 0}%
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <KeyOutlined style={{ color: '#666' }} />
                  <Text>未使用</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div><Text strong>{stats.unused}</Text></div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {stats.total > 0 ? ((stats.unused / stats.total) * 100).toFixed(1) : 0}%
                  </Text>
                </div>
              </div>
            </Space>

            {/* 健康度指标 */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>系统健康度</Text>
              </div>
              <div>
                {stats.expirationRate < 10 && stats.usageRate > 30 && (
                  <Text type="success">
                    ✓ 系统运行良好，激活码使用率正常，过期率较低
                  </Text>
                )}
                {stats.expirationRate >= 10 && stats.expirationRate < 30 && (
                  <Text style={{ color: '#faad14' }}>
                    ⚠ 注意：过期率偏高，建议及时清理过期激活码
                  </Text>
                )}
                {stats.expirationRate >= 30 && (
                  <Text type="danger">
                    ⚠ 警告：过期率过高，建议立即清理过期激活码
                  </Text>
                )}
                {stats.usageRate < 10 && stats.total > 50 && (
                  <Text style={{ color: '#faad14' }}>
                    ⚠ 使用率较低，可能需要检查激活码分发情况
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

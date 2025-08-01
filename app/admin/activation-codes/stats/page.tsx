'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  BarChartOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { ErrorBoundary, NetworkError } from '@/components/ErrorBoundary'
import {
  activationCodeApi,
  type ActivationCodeStats,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

const { Title, Text, Paragraph } = Typography

export default function ActivationCodeStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<ActivationCodeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载统计信息
  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await activationCodeApi.getActivationCodeStats()
      setStats(data)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      console.error('加载统计信息失败:', apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // 计算百分比
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>正在加载统计信息...</Text>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <ErrorBoundary>
        <div className="responsive-container" style={{ paddingTop: '0' }}>
          <NetworkError
            message={error}
            onRetry={loadStats}
          />
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
        {/* 页面头部 */}
        <div className="responsive-card-spacing">
          <Space align="center" style={{ marginBottom: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: '8px' }} />
              激活码统计
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStats}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
          <Paragraph style={{ color: '#666', margin: 0 }}>
            查看激活码的使用情况和统计信息
          </Paragraph>
        </div>

        {stats && (
          <>
            {/* 总体统计 */}
            <Card title="总体统计" className="responsive-card-spacing">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="总激活码数"
                    value={stats.total}
                    prefix={<KeyOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="已使用"
                    value={stats.used}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="未使用"
                    value={stats.unused}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="已过期"
                    value={stats.expired}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={6}>
                  <Statistic
                    title="有效激活码"
                    value={stats.active}
                    prefix={<KeyOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* 使用率分析 */}
            <Card title="使用率分析" className="responsive-card-spacing">
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>激活码使用率</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Progress
                        percent={getPercentage(stats.used, stats.total)}
                        status="active"
                        strokeColor="#52c41a"
                        format={(percent) => `${percent}% (${stats.used}/${stats.total})`}
                      />
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>激活码过期率</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Progress
                        percent={getPercentage(stats.expired, stats.total)}
                        status={getPercentage(stats.expired, stats.total) > 30 ? "exception" : "normal"}
                        strokeColor="#ff4d4f"
                        format={(percent) => `${percent}% (${stats.expired}/${stats.total})`}
                      />
                    </div>
                  </div>
                </Col>
              </Row>

              {/* 统计说明 */}
              <Alert
                message="统计说明"
                description={
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li><strong>总激活码数</strong>：系统中所有激活码的总数量</li>
                    <li><strong>已使用</strong>：已经被激活使用的激活码数量</li>
                    <li><strong>未使用</strong>：尚未被使用且仍在有效期内的激活码数量</li>
                    <li><strong>已过期</strong>：超过有效期的激活码数量</li>
                    <li><strong>有效激活码</strong>：未使用且未过期的激活码数量</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            </Card>

            {/* 健康度评估 */}
            <Card title="健康度评估" className="responsive-card-spacing">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  {stats.total === 0 ? (
                    <Alert
                      message="暂无数据"
                      description="系统中还没有激活码，建议创建一些激活码来开始使用。"
                      type="warning"
                      showIcon
                    />
                  ) : (
                    <>
                      {getPercentage(stats.expired, stats.total) > 50 && (
                        <Alert
                          message="过期率过高"
                          description={`当前过期率为 ${getPercentage(stats.expired, stats.total)}%，建议清理过期激活码或调整有效期策略。`}
                          type="warning"
                          showIcon
                          style={{ marginBottom: '16px' }}
                        />
                      )}
                      
                      {getPercentage(stats.used, stats.total) > 80 && (
                        <Alert
                          message="使用率良好"
                          description={`当前使用率为 ${getPercentage(stats.used, stats.total)}%，激活码使用情况良好。`}
                          type="success"
                          showIcon
                          style={{ marginBottom: '16px' }}
                        />
                      )}
                      
                      {stats.active === 0 && stats.total > 0 && (
                        <Alert
                          message="无可用激活码"
                          description="当前没有有效的激活码，建议创建新的激活码。"
                          type="error"
                          showIcon
                          style={{ marginBottom: '16px' }}
                        />
                      )}
                      
                      {stats.active > 0 && getPercentage(stats.expired, stats.total) <= 30 && (
                        <Alert
                          message="系统状态良好"
                          description={`当前有 ${stats.active} 个有效激活码，过期率控制在合理范围内。`}
                          type="success"
                          showIcon
                        />
                      )}
                    </>
                  )}
                </Col>
              </Row>
            </Card>

            {/* 快捷操作 */}
            <Card title="快捷操作" className="responsive-card-spacing">
              <Space wrap>
                <Button
                  type="primary"
                  icon={<KeyOutlined />}
                  onClick={() => router.push('/admin/activation-codes/new')}
                >
                  创建激活码
                </Button>
                <Button
                  onClick={() => router.push('/admin/activation-codes')}
                >
                  查看激活码列表
                </Button>
              </Space>
            </Card>
          </>
        )}
      </div>
    </ErrorBoundary>
  )
}

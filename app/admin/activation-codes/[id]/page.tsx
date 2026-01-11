'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Descriptions,
  Alert,
  message,
  Modal,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'
import { EmptyState, NetworkError } from '@/components/ErrorComponents'
import {
  activationCodeApi,
  type ActivationCode,
  type ActivationCodeApiError,
  getActivationCodeStatusText,
  getActivationCodeStatusColor
} from '@/utils/activation-codes-api'

const { Title, Text, Paragraph } = Typography
const { confirm } = Modal

export default function ActivationCodeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [code, setCode] = useState<ActivationCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载激活码详情
  const loadActivationCode = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const data = await activationCodeApi.getActivationCodeById(id)
      setCode(data)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      console.error('加载激活码详情失败:', apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivationCode()
  }, [id])

  // 复制激活码
  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code.code)
      message.success('激活码已复制到剪贴板')
    }
  }

  // 删除激活码
  const handleDelete = () => {
    if (!code) return

    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您确定要删除激活码 <Text code>{code.code}</Text> 吗？</p>
          <Alert
            message="此操作无法撤销"
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await activationCodeApi.deleteActivationCode(code.id)
          message.success('激活码删除成功')
          router.push('/admin/activation-codes')
        } catch (error) {
          const apiError = error as ActivationCodeApiError
          message.error(apiError.message)
        }
      },
    })
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 获取状态图标
  const getStatusIcon = (code: ActivationCode) => {
    if (code.isUsed) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />
    }

    const now = new Date()
    const expiresAt = new Date(code.expiresAt)

    if (expiresAt < now) {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    }

    return <ClockCircleOutlined style={{ color: '#1890ff' }} />
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>正在加载激活码详情...</Text>
        </div>
      </div>
    )
  }

  if (error && !code) {
    return (
      <ErrorBoundaryWrapper>
        <div className="responsive-container" style={{ paddingTop: '0' }}>
          <NetworkError
            title="网络错误"
            subTitle={error}
            onRetry={loadActivationCode}
          />
        </div>
      </ErrorBoundaryWrapper>
    )
  }

  if (!code) {
    return (
      <ErrorBoundaryWrapper>
        <div className="responsive-container" style={{ paddingTop: '0' }}>
          <EmptyState
            title="激活码不存在"
            subTitle="未找到指定的激活码，可能已被删除或ID不正确"
            onAction={() => router.push('/admin/activation-codes')}
            actionText="返回列表"
          />
        </div>
      </ErrorBoundaryWrapper>
    )
  }

  return (
    <ErrorBoundaryWrapper>
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
              <KeyOutlined style={{ marginRight: '8px' }} />
              激活码详情
            </Title>
            {getStatusIcon(code)}
            <Tag color={getActivationCodeStatusColor(code)}>
              {getActivationCodeStatusText(code)}
            </Tag>
          </Space>
        </div>

        {/* 激活码信息 */}
        <Card
          title="基础信息"
          extra={
            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyCode}
              >
                复制激活码
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          }
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
            <Descriptions.Item label="激活码">
              <Text code copyable style={{ fontSize: '14px' }}>
                {code.code}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Space>
                {getStatusIcon(code)}
                <Tag color={getActivationCodeStatusColor(code)}>
                  {getActivationCodeStatusText(code)}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDate(code.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="过期时间">
              {formatDate(code.expiresAt)}
            </Descriptions.Item>
            {code.isUsed && code.usedAt && (
              <Descriptions.Item label="使用时间">
                {formatDate(code.usedAt)}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 产品信息 */}
        {code.productInfo && (
          <Card title="产品信息" style={{ marginTop: '16px' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
              <Descriptions.Item label="产品名称">
                {code.productInfo.name}
              </Descriptions.Item>
              <Descriptions.Item label="产品版本">
                {code.productInfo.version}
              </Descriptions.Item>
              <Descriptions.Item label="包含功能" span={2}>
                <Space wrap>
                  {code.productInfo.features?.map((feature, index) => (
                    <Tag key={index} color="blue">
                      {feature}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* 元数据信息 */}
        {code.metadata && Object.keys(code.metadata).length > 0 && (
          <Card title="元数据信息" style={{ marginTop: '16px' }}>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered>
              {code.metadata.customerEmail && (
                <Descriptions.Item label="客户邮箱">
                  {String(code.metadata.customerEmail)}
                </Descriptions.Item>
              )}
              {code.metadata.licenseType && (
                <Descriptions.Item label="许可证类型">
                  <Tag color="green">{String(code.metadata.licenseType)}</Tag>
                </Descriptions.Item>
              )}
              {code.metadata.purchaseId && (
                <Descriptions.Item label="订单ID">
                  {String(code.metadata.purchaseId)}
                </Descriptions.Item>
              )}
              {code.metadata.customerId && (
                <Descriptions.Item label="客户ID">
                  {String(code.metadata.customerId)}
                </Descriptions.Item>
              )}
              {code.metadata.notes ? (
                <Descriptions.Item label="备注" span={2}>
                  {String(code.metadata.notes)}
                </Descriptions.Item>
              ) : null}
            </Descriptions>
          </Card>
        )}
      </div>
    </ErrorBoundaryWrapper>
  )
}

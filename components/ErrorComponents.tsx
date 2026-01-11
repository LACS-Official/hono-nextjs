'use client'

import { Result, Button, Typography, Space } from 'antd'
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  HomeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'

const { Paragraph, Text } = Typography

interface EmptyStateProps {
  title?: string
  subTitle?: string
  onAction?: () => void
  actionText?: string
  image?: string
}

export function EmptyState({
  title = '暂无数据',
  subTitle = '当前没有可显示的内容',
  onAction,
  actionText = '创建',
  image
}: EmptyStateProps) {
  return (
    <Result
      status="404"
      title={title}
      subTitle={subTitle}
      extra={
        onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )
      }
    />
  )
}

interface NetworkErrorProps {
  title?: string
  subTitle?: string
  onRetry?: () => void
  onGoHome?: () => void
  onGoBack?: () => void
  error?: Error | string
  showDetails?: boolean
}

export function NetworkError({
  title = '网络错误',
  subTitle = '无法连接到服务器，请检查网络连接',
  onRetry,
  onGoHome,
  onGoBack,
  error,
  showDetails = false
}: NetworkErrorProps) {
  const getErrorDetails = () => {
    if (!error) return null
    
    const errorMessage = typeof error === 'string' ? error : error.message
    
    return (
      <div style={{ 
        marginTop: 16, 
        padding: 16, 
        background: '#f5f5f5', 
        borderRadius: 6,
        maxHeight: 200,
        overflow: 'auto'
      }}>
        <Text strong>错误详情：</Text>
        <Paragraph code style={{ marginTop: 8 }}>
          {errorMessage}
        </Paragraph>
      </div>
    )
  }

  const defaultActions = (
    <Space direction="vertical" size="middle">
      <Space>
        {onRetry && (
          <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
            重试
          </Button>
        )}
        {onGoBack && (
          <Button icon={<ArrowLeftOutlined />} onClick={onGoBack}>
            返回
          </Button>
        )}
        {onGoHome && (
          <Button icon={<HomeOutlined />} onClick={onGoHome}>
            回到首页
          </Button>
        )}
      </Space>
    </Space>
  )

  return (
    <Result
      status="warning"
      icon={<ExclamationCircleOutlined />}
      title={title}
      subTitle={subTitle}
      extra={defaultActions}
    >
      {error && getErrorDetails()}
    </Result>
  )
}
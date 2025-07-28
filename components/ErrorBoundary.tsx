'use client'

import React from 'react'
import { Alert, Button, Card, Space, Typography } from 'antd'
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onReset?: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="responsive-container" style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card style={{
            maxWidth: '500px',
            width: '100%',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} type="danger" className="responsive-title">
                页面出现错误
              </Title>
              <Paragraph type="secondary">
                抱歉，页面遇到了一个错误。请尝试刷新页面或返回首页。
              </Paragraph>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert
                  message="错误详情（开发模式）"
                  description={this.state.error.message}
                  type="error"
                  style={{ marginBottom: '16px', textAlign: 'left' }}
                />
              )}

              <Space>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReset}
                >
                  重新加载
                </Button>
                <Button 
                  icon={<HomeOutlined />}
                  onClick={() => window.location.href = '/dashboard'}
                >
                  返回首页
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// 函数式组件版本的错误边界（用于特定场景）
interface ErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Alert
      message="加载失败"
      description={error.message}
      type="error"
      showIcon
      action={
        <Space>
          <Button size="small" onClick={resetError}>
            重试
          </Button>
        </Space>
      }
    />
  )
}

// 网络错误处理组件
interface NetworkErrorProps {
  onRetry: () => void
  message?: string
}

export function NetworkError({ onRetry, message = '网络连接失败，请检查网络设置' }: NetworkErrorProps) {
  return (
    <Alert
      message="网络错误"
      description={message}
      type="error"
      showIcon
      action={
        <Button size="small" onClick={onRetry}>
          重试
        </Button>
      }
    />
  )
}

// 空状态组件
interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  image?: React.ReactNode
}

export function EmptyState({ 
  title = '暂无数据', 
  description = '当前没有可显示的内容',
  action,
  image
}: EmptyStateProps) {
  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '48px 24px',
      color: '#999'
    }}>
      {image && <div style={{ marginBottom: '16px' }}>{image}</div>}
      <Title level={4} type="secondary" style={{ marginBottom: '8px' }}>
        {title}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: action ? '24px' : 0 }}>
        {description}
      </Paragraph>
      {action && action}
    </div>
  )
}

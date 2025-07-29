'use client'

import { Spin, Card, Skeleton, Space, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const { Text } = Typography

interface LoadingStateProps {
  loading?: boolean
  children: React.ReactNode
  tip?: string
  size?: 'small' | 'default' | 'large'
  style?: React.CSSProperties
}

// 通用加载状态组件
export function LoadingState({
  loading = false,
  children,
  tip = '加载中...',
  size = 'default',
  style
}: LoadingStateProps) {
  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          ...style
        }}
        role="status"
        aria-live="polite"
        aria-label={tip}
      >
        <Spin size={size} />
        <div style={{ marginTop: '16px', color: '#666' }}>
          {tip}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 页面级加载状态
export function PageLoading({ tip = '页面加载中...' }: { tip?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column'
      }}
      role="status"
      aria-live="polite"
      aria-label={tip}
    >
      <Spin
        size="large"
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
      />
      <Text type="secondary" style={{ marginTop: '16px' }}>
        {tip}
      </Text>
    </div>
  )
}

// 卡片加载状态
export function CardLoading({ 
  title, 
  tip = '加载中...',
  rows = 4 
}: { 
  title?: string
  tip?: string
  rows?: number 
}) {
  return (
    <Card title={title}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Skeleton active paragraph={{ rows }} />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Spin size="small" />
          <Text type="secondary" style={{ marginLeft: '8px' }}>
            {tip}
          </Text>
        </div>
      </Space>
    </Card>
  )
}

// 表格加载状态
export function TableLoading({ tip = '正在加载数据...' }: { tip?: string }) {
  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <Skeleton active paragraph={{ rows: 6 }} />
      <div style={{ marginTop: '16px' }}>
        <Spin />
        <Text type="secondary" style={{ marginLeft: '8px' }}>
          {tip}
        </Text>
      </div>
    </div>
  )
}

// 按钮加载状态（内联）
interface ButtonLoadingProps {
  loading: boolean
  children: React.ReactNode
}

export function ButtonLoading({ loading, children }: ButtonLoadingProps) {
  return (
    <Space>
      {loading && <Spin size="small" />}
      {children}
    </Space>
  )
}

// 内容加载骨架屏
export function ContentSkeleton({ 
  rows = 3,
  avatar = false,
  title = true 
}: { 
  rows?: number
  avatar?: boolean
  title?: boolean 
}) {
  return (
    <Skeleton 
      active 
      avatar={avatar}
      title={title}
      paragraph={{ rows }}
    />
  )
}

// 统计卡片加载状态
export function StatisticLoading() {
  return (
    <Card>
      <Skeleton.Input style={{ width: '100%', height: '60px' }} active />
    </Card>
  )
}

// 移动端友好的加载状态
export function MobileLoading({ tip = '加载中...' }: { tip?: string }) {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Spin size="large" />
      <Text type="secondary" style={{ marginTop: '16px', fontSize: '14px' }}>
        {tip}
      </Text>
    </div>
  )
}

// 响应式表格加载状态
export function ResponsiveTableLoading() {
  return (
    <div style={{ padding: '16px' }}>
      {/* 移动端显示卡片式骨架屏 */}
      <div className="block md:hidden">
        {[1, 2, 3].map(i => (
          <Card key={i} style={{ marginBottom: '12px' }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>

      {/* 桌面端显示表格式骨架屏 */}
      <div className="hidden md:block">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    </div>
  )
}

// 列表项加载状态
export function ListItemLoading({ count = 5 }: { count?: number }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} size="small">
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </Space>
  )
}

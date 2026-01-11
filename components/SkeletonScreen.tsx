import React from 'react'
import { Skeleton } from 'antd'
import { Card } from 'antd'

// 表格骨架屏
export const TableSkeleton = ({ rows = 5, columns = 6 }: { rows?: number, columns?: number }) => {
  return (
    <div style={{ padding: '16px' }}>
      <Skeleton active paragraph={{ rows: 0 }} style={{ marginBottom: '16px' }} />
      <div style={{ background: '#fff', borderRadius: '8px', padding: '16px' }}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} style={{ display: 'flex', marginBottom: '16px', alignItems: 'center' }}>
            <Skeleton.Input style={{ width: 50, marginRight: '16px' }} active />
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton.Input
                key={colIndex}
                style={{ 
                  width: colIndex === 0 ? 120 : colIndex === 1 ? 180 : 100,
                  marginRight: '16px',
                  flex: colIndex === columns - 1 ? 'none' : 1
                }}
                active
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// 卡片骨架屏
export const CardSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div style={{ padding: '16px' }}>
      <Skeleton active paragraph={{ rows: 0 }} style={{ marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} style={{ marginBottom: 0 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}

// 统计卡片骨架屏
export const StatsCardSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    </div>
  )
}

// 表单骨架屏
export const FormSkeleton = () => {
  return (
    <Card style={{ margin: '16px' }}>
      <Skeleton active paragraph={{ rows: 8 }} />
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Skeleton.Button style={{ width: 80 }} active />
        <Skeleton.Button style={{ width: 100 }} active />
      </div>
    </Card>
  )
}

// 详情页骨架屏
export const DetailSkeleton = () => {
  return (
    <div style={{ padding: '16px' }}>
      <Skeleton active paragraph={{ rows: 2 }} style={{ marginBottom: '24px' }} />
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    </div>
  )
}

// 列表骨架屏
export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div style={{ padding: '16px' }}>
      <Skeleton active paragraph={{ rows: 0 }} style={{ marginBottom: '16px' }} />
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} style={{ marginBottom: '16px' }}>
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </Card>
      ))}
    </div>
  )
}

// 页面加载骨架屏
export const PageSkeleton = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div style={{ padding: '24px' }}>
      <Skeleton active paragraph={{ rows: 4 }} />
      {children}
    </div>
  )
}

// 响应式骨架屏 - 根据屏幕宽度自动选择表格或卡片骨架屏
export const ResponsiveSkeleton = ({ 
  isTable = true, 
  rows = 5, 
  columns = 6, 
  cardCount = 8 
}: { 
  isTable?: boolean
  rows?: number
  columns?: number
  cardCount?: number 
}) => {
  if (isTable) {
    return <TableSkeleton rows={rows} columns={columns} />
  }
  return <CardSkeleton count={cardCount} />
}

// 软件管理页面专用骨架屏
export const SoftwareManagementSkeleton = ({ viewMode = 'table' }: { viewMode?: 'table' | 'card' }) => {
  return (
    <>
      <StatsCardSkeleton />
      <ResponsiveSkeleton 
        isTable={viewMode === 'table'} 
        rows={5} 
        columns={6} 
        cardCount={8} 
      />
    </>
  )
}

// 激活码页面专用骨架屏
export const ActivationCodeSkeleton = ({ viewMode = 'table' }: { viewMode?: 'table' | 'card' }) => {
  return (
    <>
      <ResponsiveSkeleton 
        isTable={viewMode === 'table'} 
        rows={5} 
        columns={5} 
        cardCount={6} 
      />
    </>
  )
}
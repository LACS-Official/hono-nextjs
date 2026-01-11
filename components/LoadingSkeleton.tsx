'use client'

import React from 'react'
import { Skeleton } from 'antd'

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'stats' | 'form'
  rows?: number
  columns?: number
  count?: number
  active?: boolean
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'table',
  rows,
  columns,
  count,
  active = true
}) => {
  // 动态导入骨架屏组件，避免不必要的加载
  const [TableSkeleton, setTableSkeleton] = React.useState<any>(null)
  const [CardSkeleton, setCardSkeleton] = React.useState<any>(null)
  const [StatsCardSkeleton, setStatsCardSkeleton] = React.useState<any>(null)

  React.useEffect(() => {
    const loadComponents = async () => {
      try {
        if (type === 'table') {
          const module = await import('./TableSkeleton')
          setTableSkeleton(() => module.default)
        }
        if (type === 'card') {
          const module = await import('./CardSkeleton')
          setCardSkeleton(() => module.default)
        }
        if (type === 'stats') {
          const module = await import('./StatsCardSkeleton')
          setStatsCardSkeleton(() => module.default)
        }
      } catch (error) {
        console.error('Error loading skeleton components:', error)
      }
    }

    loadComponents()
  }, [type])

  if (type === 'table' && TableSkeleton) {
    return <TableSkeleton rows={rows} columns={columns} active={active} />
  }

  if (type === 'card' && CardSkeleton) {
    return <CardSkeleton count={count} active={active} />
  }

  if (type === 'stats' && StatsCardSkeleton) {
    return <StatsCardSkeleton count={count} active={active} />
  }

  if (type === 'form') {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton active={active} paragraph={{ rows: 8 }} />
      </div>
    )
  }

  // 默认骨架屏
  return <Skeleton active={active} paragraph={{ rows: 5 }} />
}

export default LoadingSkeleton
'use client'

import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import TableSkeleton from './TableSkeleton'
import CardSkeleton from './CardSkeleton'
import StatsCardSkeleton from './StatsCardSkeleton'

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
}) => {
  if (type === 'table') {
    return <TableSkeleton rows={rows} columns={columns} />
  }

  if (type === 'card') {
    return <CardSkeleton count={count} />
  }

  if (type === 'stats') {
    return <StatsCardSkeleton count={count} />
  }

  if (type === 'form') {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }

  // 默认骨架屏
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[80%]" />
      <Skeleton className="h-4 w-[70%]" />
    </div>
  )
}

export default LoadingSkeleton
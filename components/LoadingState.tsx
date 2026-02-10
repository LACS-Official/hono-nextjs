'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  loading?: boolean
  children: React.ReactNode
  tip?: string
  size?: 'small' | 'default' | 'large'
  style?: React.CSSProperties
  className?: string
}

// 通用加载状态组件
export function LoadingState({
  loading = false,
  children,
  tip = '加载中...',
  className,
  style
}: LoadingStateProps) {
  if (loading) {
    return (
      <div
        className={cn("flex flex-col items-center justify-center py-12 px-6", className)}
        style={style}
        role="status"
        aria-live="polite"
        aria-label={tip}
      >
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div className="mt-4 text-slate-500 font-medium">
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
      className="flex flex-col items-center justify-center min-h-[400px] w-full"
      role="status"
      aria-live="polite"
      aria-label={tip}
    >
      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      <p className="mt-4 text-slate-500 font-medium">
        {tip}
      </p>
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
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <div className="flex items-center justify-center pt-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2 text-slate-400" />
          <span className="text-sm text-slate-500">{tip}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 表格加载状态
export function TableLoading({ tip = '正在加载数据...' }: { tip?: string }) {
  return (
    <div className="p-6 space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
      <div className="flex items-center justify-center pt-2">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-slate-400" />
        <span className="text-sm text-slate-500">{tip}</span>
      </div>
    </div>
  )
}

// 按钮加载状态（内联）
export function ButtonLoading({ loading, children }: { loading: boolean, children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
      {children}
    </div>
  )
}

// 内容加载骨架屏
export function ContentSkeleton({ 
  rows = 3,
}: { 
  rows?: number
  avatar?: boolean
  title?: boolean 
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

// 统计卡片加载状态
export function StatisticLoading() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-12 w-full" />
      </CardContent>
    </Card>
  )
}

// 移动端友好的加载状态
export function MobileLoading({ tip = '加载中...' }: { tip?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-10 min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-4 text-slate-500 text-sm">
        {tip}
      </p>
    </div>
  )
}

// 响应式表格加载状态
export function ResponsiveTableLoading() {
  return (
    <div className="p-4 space-y-4">
      <div className="grid md:hidden gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="py-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="hidden md:block space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

// 列表项加载状态
export function ListItemLoading({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4 w-full">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="shadow-none">
          <CardContent className="py-3 px-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

'use client'

import React from 'react'
import { 
  AlertTriangle, 
  RotateCcw, 
  Home, 
  ArrowLeft,
  FileQuestion,
  SearchX
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
      <div className="bg-slate-50 p-6 rounded-full border border-dashed border-slate-200">
        <SearchX className="h-12 w-12 text-slate-300" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
        <p className="text-slate-500 max-w-sm">{subTitle}</p>
      </div>
      {onAction && (
        <Button onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  )
}

interface NetworkErrorProps {
  title?: string
  subTitle?: string
  onRetry?: () => void
  onGoHome?: () => void
  onGoBack?: () => void
  error?: Error | string
}

export function NetworkError({
  title = '网络错误',
  subTitle = '无法连接到服务器，请检查网络连接',
  onRetry,
  onGoHome,
  onGoBack,
  error,
}: NetworkErrorProps) {
  const errorMessage = error ? (typeof error === 'string' ? error : error.message) : null

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
      <div className="bg-red-50 p-4 rounded-full">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-slate-500">{subTitle}</p>
      </div>

      {errorMessage && (
        <div className="w-full max-w-lg p-4 bg-muted rounded-md text-left overflow-auto max-h-40">
          <p className="text-xs font-mono text-slate-600 break-all">{errorMessage}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重试
          </Button>
        )}
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            <Home className="mr-2 h-4 w-4" />
            回到首页
          </Button>
        )}
      </div>
    </div>
  )
}
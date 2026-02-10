'use client'

import React from 'react'
import { 
  AlertCircle, 
  RotateCw, 
  Home,
  ArrowLeft
} from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  title?: string
  subTitle?: string
  onRetry?: () => void
  onGoHome?: () => void
  onGoBack?: () => void
  extra?: React.ReactNode
  error?: Error | string
  showDetails?: boolean
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  title = '出错了',
  subTitle = '抱歉，页面遇到了一些问题',
  onRetry,
  onGoHome,
  onGoBack,
  extra,
  error,
  showDetails = false
}) => {
  const getErrorDetails = () => {
    if (!error) return null
    
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'object' && error.stack ? error.stack : null
    
    return (
      <div className="mt-4 p-4 bg-muted rounded-md max-h-[200px] overflow-auto text-left w-full max-w-2xl mx-auto">
        <p className="font-semibold text-sm">错误详情：</p>
        <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono">
          {errorMessage}
        </pre>
        {errorStack && showDetails && (
           <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-mono border-t pt-2">
            {errorStack}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-6">
      <div className="rounded-full bg-destructive/10 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{subTitle}</p>
      </div>

      <div className="flex flex-col gap-4 items-center">
         <div className="flex gap-2">
            {onRetry && (
            <Button variant="default" onClick={onRetry}>
                <RotateCw className="mr-2 h-4 w-4" />
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
         {extra && <div>{extra}</div>}
      </div>

      {error && getErrorDetails()}
    </div>
  )
}

export default ErrorBoundary
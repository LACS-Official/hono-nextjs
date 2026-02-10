'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface RetryableFetchProps {
  url: string
  options?: RequestInit
  retryCount?: number
  retryDelay?: number
  children: (data: any, loading: boolean, error: Error | null, retry: () => void) => React.ReactNode
  onError?: (error: Error) => void
  onSuccess?: (data: any) => void
}

const RetryableFetch: React.FC<RetryableFetchProps> = ({
  url,
  options = {},
  retryCount = 3,
  retryDelay = 1000,
  children,
  onError,
  onSuccess
}) => {
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentRetry, setCurrentRetry] = useState<number>(0)

  const fetchData = async (isRetry = false) => {
    if (!isRetry) {
      setLoading(true)
      setError(null)
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result)
      setError(null)
      setCurrentRetry(0)
      
      if (onSuccess) onSuccess(result)
      
      if (isRetry) {
        toast({ title: "重试成功！" })
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      if (onError) onError(error)
      
      if (isRetry) {
        toast({ 
          variant: "destructive",
          title: "重试失败",
          description: error.message 
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const retry = () => {
    if (currentRetry < retryCount) {
      setCurrentRetry(prev => prev + 1)
      setTimeout(() => {
        fetchData(true)
      }, retryDelay * currentRetry)
    } else {
      toast({ 
        variant: "destructive",
        title: "错误",
        description: `已达到最大重试次数 (${retryCount})` 
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [url])

  return (
    <>
      {children(data, loading, error, retry)}
      
      {error && !loading && (
        <div className="flex justify-center p-8">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>数据加载失败</AlertTitle>
            <AlertDescription className="space-y-4 pt-2">
              <p>{error.message}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retry}
                disabled={currentRetry >= retryCount}
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                重试 {currentRetry > 0 && `(${currentRetry}/${retryCount})`}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}

export default RetryableFetch
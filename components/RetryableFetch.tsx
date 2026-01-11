'use client'

import React, { useState, useEffect } from 'react'
import { Button, message, Result, Spin } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

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
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (isRetry) {
        message.success('重试成功！')
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      
      if (onError) {
        onError(error)
      }
      
      if (isRetry) {
        message.error(`重试失败: ${error.message}`)
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
      message.error(`已达到最大重试次数 (${retryCount})`)
    }
  }

  useEffect(() => {
    fetchData()
  }, [url])

  return (
    <>
      {children(data, loading, error, retry)}
      
      {error && !loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Result
            status="warning"
            title="数据加载失败"
            subTitle={error.message}
            extra={
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={retry}
                disabled={currentRetry >= retryCount}
              >
                重试 {currentRetry > 0 && `(${currentRetry}/${retryCount})`}
              </Button>
            }
          />
        </div>
      )}
    </>
  )
}

export default RetryableFetch
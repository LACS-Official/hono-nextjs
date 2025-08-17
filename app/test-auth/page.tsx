'use client'

import { useState } from 'react'
import { Button, Card, Space, Typography, Alert, Spin, message } from 'antd'
import { activationCodeApi } from '@/utils/activation-codes-api'
import type { CreateActivationCodeRequest } from '@/utils/activation-codes-api'

const { Title, Text, Paragraph } = Typography

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // 测试激活码生成
  const testCreateActivationCode = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const request: CreateActivationCodeRequest = {
        expirationDays: 30,
        metadata: {
          customerEmail: 'test@example.com',
          licenseType: 'standard',
          notes: 'OAuth认证测试'
        },
        productInfo: {
          name: 'OAuth测试产品',
          version: '1.0.0',
          features: ['basic', 'oauth-test']
        }
      }

      const activationCode = await activationCodeApi.createActivationCode(request)
      setResult(activationCode)
      message.success('激活码创建成功！')
    } catch (err: any) {
      const errorMessage = err.message || '创建激活码失败'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 测试激活码列表获取
  const testGetActivationCodes = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const codes = await activationCodeApi.getActivationCodes({
        page: 1,
        limit: 5,
        status: 'all'
      })
      setResult(codes)
      message.success('激活码列表获取成功！')
    } catch (err: any) {
      const errorMessage = err.message || '获取激活码列表失败'
      setError(errorMessage)
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 检查认证状态
  const checkAuthStatus = () => {
    const cookies = document.cookie.split(';')
    const authToken = cookies.find(cookie => cookie.trim().startsWith('auth-token='))
    
    if (authToken) {
      const token = authToken.split('=')[1]
      message.info(`找到认证Token: ${token.substring(0, 20)}...`)
    } else {
      message.warning('未找到认证Token，请先登录')
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>GitHub OAuth 激活码认证测试</Title>
      
      <Alert
        message="测试说明"
        description="此页面用于测试GitHub OAuth登录后的激活码生成功能。请确保已通过GitHub OAuth成功登录。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="认证状态检查" style={{ marginBottom: '24px' }}>
        <Paragraph>
          点击下面的按钮检查当前的认证状态：
        </Paragraph>
        <Button onClick={checkAuthStatus}>
          检查认证Token
        </Button>
      </Card>

      <Card title="激活码功能测试" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            测试GitHub OAuth认证后的激活码相关功能：
          </Paragraph>
          
          <Space>
            <Button 
              type="primary" 
              onClick={testCreateActivationCode}
              loading={loading}
            >
              测试创建激活码
            </Button>
            
            <Button 
              onClick={testGetActivationCodes}
              loading={loading}
            >
              测试获取激活码列表
            </Button>
          </Space>
        </Space>
      </Card>

      {loading && (
        <Card style={{ marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>正在处理请求...</Text>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {result && (
        <Card title="测试结果" style={{ marginBottom: '24px' }}>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '16px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}

      <Card title="故障排除" type="inner">
        <Paragraph>
          如果测试失败，请检查以下项目：
        </Paragraph>
        <ul>
          <li>确保已通过GitHub OAuth成功登录</li>
          <li>检查浏览器Cookie中是否存在 <code>auth-token</code></li>
          <li>确认当前用户有管理员权限</li>
          <li>检查开发者控制台是否有错误信息</li>
          <li>确认API服务器正在运行</li>
        </ul>
        
        <Paragraph style={{ marginTop: '16px' }}>
          <Text strong>如果仍然遇到401错误：</Text>
        </Paragraph>
        <ul>
          <li>尝试重新登录</li>
          <li>清除浏览器Cookie后重新登录</li>
          <li>检查环境变量配置</li>
        </ul>
      </Card>
    </div>
  )
}

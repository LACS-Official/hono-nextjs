'use client'

// import { useEffect } from 'react' // 暂时不使用
// import { useRouter } from 'next/navigation' // 暂时不使用
import { Layout, Spin, Result, Button } from 'antd'
import { LoginOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'

const { Content } = Layout

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps): JSX.Element {
  const { user, loading, login } = useAuth()

  // 移除自动重定向逻辑，只在组件内部处理认证状态

  // 加载状态
  if (loading) {
    return (fallback || (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="正在验证身份..." />
        </Content>
      </Layout>
    )) as JSX.Element
  }

  // 未登录状态
  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Result
            status="403"
            title="需要登录"
            subTitle="您需要登录才能访问此页面"
            extra={
              <Button type="primary" icon={<LoginOutlined />} onClick={login}>
                立即登录
              </Button>
            }
          />
        </Content>
      </Layout>
    ) as JSX.Element
  }

  // 已登录，渲染子组件
  return <>{children}</> as JSX.Element
}

'use client'

import { useState, useEffect } from 'react'
import { Layout, ConfigProvider } from 'antd'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import zhCN from 'antd/locale/zh_CN'

const { Content } = Layout

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        components: {
          Layout: {
            bodyBg: '#f5f5f5',
          },
          Card: {
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 6,
          },
        },
      }}
    >
      <AuthGuard>
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          <Navigation />
          <Content
            style={{
              marginTop: '64px',
              padding: isMobile ? '16px' : '24px',
              background: '#f5f5f5'
            }}
          >
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              width: '100%'
            }}>
              {children}
            </div>
          </Content>
        </Layout>
      </AuthGuard>
    </ConfigProvider>
  )
}

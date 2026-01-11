'use client'

import { ConfigProvider, theme } from 'antd'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import zhCN from 'antd/locale/zh_CN'
import { useTheme } from '@/contexts/ThemeContext'
import { useState, useEffect } from 'react'

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { theme: currentTheme } = useTheme()
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
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          // 响应式断点
          screenXS: 480,
          screenSM: 576,
          screenMD: 768,
          screenLG: 992,
          screenXL: 1200,
          screenXXL: 1600,
        },
        components: {
          Layout: {
            bodyBg: currentTheme === 'dark' ? '#141414' : '#f5f5f5',
          },
          Card: {
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 6,
          },
          Table: {
            // 优化表格在移动端的显示
            cellPaddingBlock: 8,
            cellPaddingInline: 8,
          },
          Modal: {
            // 优化模态框在移动端的显示
            contentBg: currentTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            headerBg: currentTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
    >
      <AuthGuard>
        <div style={{ 
          minHeight: '100vh', 
          background: currentTheme === 'dark' ? '#000000' : '#f5f5f5', 
          display: 'flex' 
        }}>
          <Navigation />
          <main
            className="responsive-container"
            style={{
              flex: 1,
              marginLeft: isMobile ? '0' : '240px', // 桌面端为侧边栏留出空间
              marginTop: isMobile ? '64px' : '0', // 移动端为顶部栏留出空间
              paddingTop: '16px',
              paddingBottom: '24px',
              background: currentTheme === 'dark' ? '#000000' : '#f5f5f5',
              minHeight: '100vh',
              transition: 'margin-left 0.2s ease-in-out',
            }}
          >
            {children}
          </main>
        </div>
      </AuthGuard>
    </ConfigProvider>
  )
}

export default function AdminLayout(props: Parameters<typeof AdminLayoutContent>[0]) {
  return <AdminLayoutContent {...props} />
}
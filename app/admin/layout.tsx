'use client'

import { ConfigProvider } from 'antd'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'
import zhCN from 'antd/locale/zh_CN'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
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
            bodyBg: '#f5f5f5',
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
            contentBg: '#ffffff',
            headerBg: '#ffffff',
          },
        },
      }}
    >
      <AuthGuard>
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
          <Navigation />
          <main
            className="responsive-container"
            style={{
              marginTop: '64px',
              paddingTop: '16px',
              paddingBottom: '24px',
              background: '#f5f5f5',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            {children}
          </main>
        </div>
      </AuthGuard>
    </ConfigProvider>
  )
}

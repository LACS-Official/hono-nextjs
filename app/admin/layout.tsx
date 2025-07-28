'use client'

import { Layout } from 'antd'
import Navigation from '@/components/Navigation'
import AuthGuard from '@/components/AuthGuard'

const { Content } = Layout

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Content style={{ marginTop: '64px' }}>
          {children}
        </Content>
      </Layout>
    </AuthGuard>
  )
}

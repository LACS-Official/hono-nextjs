'use client'

// import { useEffect } from 'react' // 暂时不
import { useRouter } from 'next/navigation'
import { Layout, Card, Button, Typography, Space, Spin } from 'antd'
import { GithubOutlined, LoginOutlined, CheckCircleOutlined, RocketOutlined } from '@ant-design/icons'
import { useAuth } from '@/contexts/AuthContext'

const { Content } = Layout
const { Title, Paragraph } = Typography

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const router = useRouter()

  // 如果已经登录，显示已登录状态和跳转选项
  if (!loading && user) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <Card
            style={{
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
                <Title level={2} style={{ margin: '16px 0 8px 0', color: '#52c41a' }}>
                  已登录
                </Title>
                <Paragraph>
                  欢迎回来，{user.name || user.login}！
                </Paragraph>
              </div>

              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => router.push('/admin')}
                  style={{ width: '100%' }}
                >
                  进入管理控制台
                </Button>
                <Button
                  size="large"
                  onClick={() => router.push('/')}
                  style={{ width: '100%' }}
                >
                  返回首页
                </Button>
              </Space>
            </Space>
          </Card>
        </Content>
      </Layout>
    )
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="正在验证身份..." />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Logo 区域 */}
            <div>
              <GithubOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
              <Title level={2} style={{ margin: '16px 0 8px 0', color: '#1890ff' }}>
                LACS Admin
              </Title>
              <Paragraph type="secondary">
                管理员控制台
              </Paragraph>
            </div>

            {/* 登录说明 */}
            <div>
              <Paragraph>
                请使用您的 GitHub 账户登录以访问管理员系统
              </Paragraph>
              <Paragraph type="secondary" style={{ fontSize: '12px' }}>
                只有授权的管理员账户才能访问此系统
              </Paragraph>
            </div>

            {/* 登录按钮 */}
            <Button
              type="primary"
              size="large"
              icon={<LoginOutlined />}
              onClick={login}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '16px',
                background: '#24292e',
                borderColor: '#24292e'
              }}
            >
              使用 GitHub 登录
            </Button>

            {/* 安全提示 */}
            <div style={{ marginTop: '24px' }}>
              <Paragraph type="secondary" style={{ fontSize: '11px' }}>
                🔒 您的登录信息将通过 GitHub OAuth 安全验证
              </Paragraph>
            </div>
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}

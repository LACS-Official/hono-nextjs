'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Card, Row, Col, Statistic, Typography, Space, Button, message } from 'antd'
import {
  HomeOutlined,
  GithubOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  KeyOutlined
} from '@ant-design/icons'

const { Sider, Content } = Layout
const { Title, Paragraph } = Typography

export default function AdminDashboard() {
  const [selectedMenuKey, setSelectedMenuKey] = useState('overview')

  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    setSelectedMenuKey(key)
    switch (key) {
      case 'software':
        window.location.href = '/admin/software'
        break
      case 'announcements':
        window.location.href = '/admin/announcements'
        break
      case 'activation-codes':
        window.location.href = '/admin/activation-codes'
        break
      case 'hugo':
        window.location.href = '/admin/hugo'
        break
      default:
        break
    }
  }

  return (
    <Layout>
      {/* 侧边栏 - 仅在桌面端显示 */}
      <Sider
        width={250}
        style={{
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          height: 'calc(100vh - 64px)',
          position: 'fixed',
          left: 0,
          top: 64,
          zIndex: 100,
          display: window.innerWidth < 768 ? 'none' : 'block'
        }}
        breakpoint="md"
        collapsedWidth="0"
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          style={{ height: '100%', borderRight: 0, paddingTop: '16px' }}
          onClick={({ key }) => handleMenuClick(key)}
          items={[
            {
              key: 'overview',
              icon: <HomeOutlined />,
              label: '概览',
            },
            {
              key: 'repos',
              icon: <GithubOutlined />,
              label: '所有仓库',
            },
            {
              key: 'hugo',
              icon: <FileTextOutlined />,
              label: 'Hugo文章',
            },
            {
              key: 'software',
              icon: <AppstoreOutlined />,
              label: '软件管理',
            },
            {
              key: 'announcements',
              icon: <NotificationOutlined />,
              label: '公告管理',
            },
            {
              key: 'activation-codes',
              icon: <KeyOutlined />,
              label: '激活码管理',
            },
          ]}
        />
      </Sider>

      {/* 主内容区域 */}
      <Content
        style={{
          marginLeft: window.innerWidth < 768 ? '0' : '250px',
          padding: window.innerWidth < 768 ? '16px' : '24px',
          background: '#f5f5f5'
        }}
      >
        {/* 页面头部 */}
        <div style={{ marginBottom: '24px' }}>
          <Title level={2}>管理控制台</Title>
          <Paragraph style={{ color: '#666' }}>
            欢迎使用LACS管理系统，您可以在这里管理软件信息、公告、激活码等。
          </Paragraph>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="软件总数"
                value={0}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="公告总数"
                value={0}
                prefix={<NotificationOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="激活码总数"
                value={0}
                prefix={<KeyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="仓库总数"
                value={0}
                prefix={<GithubOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* 快速操作 */}
        <Card title="快速操作" style={{ marginBottom: '24px' }}>
          <Space wrap>
            <Button type="primary" icon={<AppstoreOutlined />} onClick={() => handleMenuClick('software')}>
              管理软件
            </Button>
            <Button icon={<NotificationOutlined />} onClick={() => handleMenuClick('announcements')}>
              管理公告
            </Button>
            <Button icon={<KeyOutlined />} onClick={() => handleMenuClick('activation-codes')}>
              管理激活码
            </Button>
            <Button icon={<FileTextOutlined />} onClick={() => handleMenuClick('hugo')}>
              管理文章
            </Button>
          </Space>
        </Card>
      </Content>
    </Layout>
  )
}

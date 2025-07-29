'use client'

import { useState } from 'react'
import { Card, Row, Col, Statistic, Typography, Button } from 'antd'
import {
  GithubOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  NotificationOutlined,
  KeyOutlined
} from '@ant-design/icons'

// const { Sider, Content } = Layout // 暂时不使用
const { Title, Paragraph } = Typography

export default function AdminDashboard() {
  const [, setSelectedMenuKey] = useState('overview')

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
    <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
      {/* 页面头部 */}
      <div className="responsive-card-spacing">
        <Title level={2} className="responsive-title">管理控制台</Title>
        <Paragraph style={{ color: '#666' }}>
          欢迎使用LACS管理系统，您可以在这里管理软件信息、公告、激活码等。
        </Paragraph>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="responsive-card-spacing">
        <Col xs={24} sm={12} md={6}>
          <Card className="responsive-statistic-card">
            <Statistic
              title="软件总数"
              value={0}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="responsive-statistic-card">
            <Statistic
              title="公告总数"
              value={0}
              prefix={<NotificationOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="responsive-statistic-card">
            <Statistic
              title="激活码总数"
              value={0}
              prefix={<KeyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="responsive-statistic-card">
            <Statistic
              title="仓库总数"
              value={0}
              prefix={<GithubOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" className="responsive-card-spacing">
        <div className="responsive-button-group">
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
        </div>
      </Card>
    </div>
  )
}

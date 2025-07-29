'use client'

import { useState, useEffect } from 'react'
import { Layout, Card, Row, Col, Typography, Button, Statistic, Tag, Alert } from 'antd'
import {
  GithubOutlined,
  ApiOutlined,
  DatabaseOutlined,
  SafetyOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import Link from 'next/link'

const { Content } = Layout
const { Title, Paragraph } = Typography

export default function HomePage() {
  const [stats, setStats] = useState({
    totalSoftware: 0,
    totalActivationCodes: 0,
    totalAnnouncements: 0,
    systemStatus: 'healthy'
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载统计数据
    const loadStats = async () => {
      try {
        // 这里可以调用实际的 API 获取统计数据
        setStats({
          totalSoftware: 12,
          totalActivationCodes: 156,
          totalAnnouncements: 8,
          systemStatus: 'healthy'
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '50px' }}>
        {/* 页面头部 */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <GithubOutlined style={{ fontSize: '72px', color: '#1890ff', marginBottom: '20px' }} />
          <Title level={1} style={{ color: '#1890ff', marginBottom: '10px' }}>
            LACS API Server
          </Title>
          <Paragraph style={{ fontSize: '18px', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
            基于 Next.js + Hono 构建的现代化 API 服务器，提供软件管理、激活码系统和公告管理功能
          </Paragraph>
        </div>

        {/* 系统状态 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          <Col span={24}>
            <Alert
              message="系统运行正常"
              description="所有服务正常运行，API 响应正常"
              type="success"
              icon={<CheckCircleOutlined />}
              showIcon
              style={{ textAlign: 'center' }}
            />
          </Col>
        </Row>

        {/* 统计数据 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="软件总数"
                value={stats.totalSoftware}
                prefix={<ApiOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="激活码总数"
                value={stats.totalActivationCodes}
                prefix={<SafetyOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="公告总数"
                value={stats.totalAnnouncements}
                prefix={<WarningOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="数据库状态"
                value="正常"
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 功能特性 */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          <Col xs={24} md={8}>
            <Card title="软件管理" extra={<ApiOutlined />}>
              <Paragraph>
                完整的软件信息管理系统，支持版本控制、下载链接管理和分类标签
              </Paragraph>
              <ul>
                <li>软件信息 CRUD 操作</li>
                <li>版本历史记录</li>
                <li>多语言支持</li>
                <li>文件上传管理</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="激活码系统" extra={<SafetyOutlined />}>
              <Paragraph>
                安全的激活码生成、验证和管理系统，支持过期时间和使用统计
              </Paragraph>
              <ul>
                <li>批量生成激活码</li>
                <li>过期时间管理</li>
                <li>使用状态追踪</li>
                <li>统计分析功能</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="公告管理" extra={<WarningOutlined />}>
              <Paragraph>
                灵活的公告发布和管理系统，支持多种公告类型和优先级设置
              </Paragraph>
              <ul>
                <li>多类型公告支持</li>
                <li>优先级管理</li>
                <li>发布时间控制</li>
                <li>过期自动处理</li>
              </ul>
            </Card>
          </Col>
        </Row>

        {/* 技术栈 */}
        <Card title="技术栈" style={{ marginBottom: '40px' }}>
          <Row gutter={[16, 16]}>
            <Col>
              <Tag color="blue">Next.js 14</Tag>
            </Col>
            <Col>
              <Tag color="green">Hono</Tag>
            </Col>
            <Col>
              <Tag color="purple">TypeScript</Tag>
            </Col>
            <Col>
              <Tag color="orange">Ant Design</Tag>
            </Col>
            <Col>
              <Tag color="red">Drizzle ORM</Tag>
            </Col>
            <Col>
              <Tag color="cyan">Neon Postgres</Tag>
            </Col>
            <Col>
              <Tag color="geekblue">Vercel</Tag>
            </Col>
          </Row>
        </Card>

        {/* 快速开始 */}
        <Card title="快速开始">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Title level={4}>管理员入口</Title>
              <Paragraph>
                访问管理员控制台来管理软件信息、激活码和公告
              </Paragraph>
              <Link href="/admin">
                <Button type="primary" size="large" icon={<RocketOutlined />}>
                  进入管理控制台
                </Button>
              </Link>
            </Col>
            <Col xs={24} md={12}>
              <Title level={4}>API 文档</Title>
              <Paragraph>
                查看完整的 API 文档和使用示例
              </Paragraph>
              <Link href="/api-docs">
                <Button size="large" icon={<ApiOutlined />}>
                  查看 API 文档
                </Button>
              </Link>
            </Col>
          </Row>
        </Card>
      </Content>
    </Layout>
  )
}

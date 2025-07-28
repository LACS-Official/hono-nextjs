'use client'

import React from 'react'
import { Button, Card, Table, Input, Select, Row, Col, Statistic, Space } from 'antd'
import { PlusOutlined, SearchOutlined, ReloadOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import PageContainer, { SearchAndActionBar, ResponsiveTableContainer, StatisticGrid } from '@/components/PageContainer'
import { showSuccess, showError, showInfo } from '@/components/ResponsiveNotification'

const { Search } = Input
const { Option } = Select

export default function TestResponsivePage() {
  // 测试数据
  const testData = [
    {
      id: '1',
      name: '测试软件 1',
      version: '1.0.0',
      status: '启用',
      description: '这是一个测试软件的描述信息'
    },
    {
      id: '2',
      name: '测试软件 2',
      version: '2.1.0',
      status: '禁用',
      description: '另一个测试软件的描述信息'
    }
  ]

  // 表格列定义
  const columns = [
    {
      title: '软件名称',
      dataIndex: 'name',
      key: 'name',
      responsive: ['md'] as const,
    },
    {
      title: '软件信息',
      key: 'info',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>v{record.version}</div>
          <div style={{ fontSize: '11px', color: '#999' }}>{record.description}</div>
        </div>
      ),
      responsive: ['xs', 'sm'] as const,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      responsive: ['md'] as const,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      responsive: ['md'] as const,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      responsive: ['lg'] as const,
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ]

  // 统计数据
  const statistics = [
    {
      title: '总数量',
      value: 42,
      prefix: <KeyOutlined />,
      valueStyle: { color: '#1890ff' }
    },
    {
      title: '已启用',
      value: 38,
      prefix: <CheckCircleOutlined />,
      valueStyle: { color: '#52c41a' }
    },
    {
      title: '使用率',
      value: 90.5,
      suffix: '%',
      precision: 1,
      valueStyle: { color: '#faad14' }
    },
    {
      title: '本月新增',
      value: 12,
      valueStyle: { color: '#722ed1' }
    }
  ]

  const handleTestNotifications = () => {
    showSuccess('操作成功！')
    setTimeout(() => showInfo('这是一条信息提示'), 1000)
    setTimeout(() => showError('这是一条错误提示'), 2000)
  }

  return (
    <PageContainer
      title="响应式测试页面"
      description="测试各种组件在不同屏幕尺寸下的显示效果"
      breadcrumb={[
        { title: '测试页面' }
      ]}
    >
      {/* 统计卡片 */}
      <StatisticGrid statistics={statistics} />

      {/* 搜索和操作栏 */}
      <Card className="responsive-card-spacing">
        <SearchAndActionBar
          searchPlaceholder="搜索软件名称或描述..."
          filters={
            <>
              <Select placeholder="选择状态" style={{ width: '120px' }}>
                <Option value="enabled">启用</Option>
                <Option value="disabled">禁用</Option>
              </Select>
              <Select placeholder="选择分类" style={{ width: '120px' }}>
                <Option value="tool">工具</Option>
                <Option value="game">游戏</Option>
              </Select>
            </>
          }
          actions={
            <>
              <Button icon={<PlusOutlined />} type="primary">
                新增
              </Button>
              <Button icon={<ReloadOutlined />}>
                刷新
              </Button>
              <Button icon={<SearchOutlined />}>
                高级搜索
              </Button>
              <Button onClick={handleTestNotifications}>
                测试通知
              </Button>
            </>
          }
        />
      </Card>

      {/* 响应式表格 */}
      <Card title="数据列表">
        <ResponsiveTableContainer>
          <Table
            columns={columns}
            dataSource={testData}
            rowKey="id"
            pagination={{
              total: 50,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              responsive: true
            }}
            scroll={{ x: 800 }}
          />
        </ResponsiveTableContainer>
      </Card>

      {/* 响应式按钮组测试 */}
      <Card title="按钮组测试" className="responsive-card-spacing">
        <div className="responsive-button-group">
          <Button type="primary">主要按钮</Button>
          <Button>普通按钮</Button>
          <Button type="dashed">虚线按钮</Button>
          <Button type="link">链接按钮</Button>
          <Button danger>危险按钮</Button>
        </div>
      </Card>

      {/* 响应式网格测试 */}
      <Card title="网格布局测试">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ background: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
              xs=24 sm=12 md=8 lg=6
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ background: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
              xs=24 sm=12 md=8 lg=6
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ background: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
              xs=24 sm=12 md=8 lg=6
            </div>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <div style={{ background: '#f0f0f0', padding: '20px', textAlign: 'center' }}>
              xs=24 sm=12 md=8 lg=6
            </div>
          </Col>
        </Row>
      </Card>

      {/* 显示/隐藏测试 */}
      <Card title="显示/隐藏测试">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="desktop-only" style={{ background: '#e6f7ff', padding: '16px', borderRadius: '4px' }}>
            这个内容只在桌面端显示 (≥768px)
          </div>
          <div className="mobile-only" style={{ background: '#fff2e8', padding: '16px', borderRadius: '4px' }}>
            这个内容只在移动端显示 (&lt;768px)
          </div>
        </Space>
      </Card>
    </PageContainer>
  )
}

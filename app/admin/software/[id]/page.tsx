'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout, 
  Card, 
  Descriptions, 
  Tag, 
  Button, 
  Space, 
  message, 
  Typography, 
  Tabs,
  Spin,
  Alert,
  Breadcrumb,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
  Modal,
  Badge
} from 'antd'
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  InfoCircleOutlined, 
  HistoryOutlined,
  HomeOutlined,
  AppstoreOutlined,
  LinkOutlined,
  TagOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import EnhancedVersionManager from '@/components/EnhancedVersionManager'
import AnnouncementManager from '@/components/AnnouncementManager'

const { Title, Text, Paragraph } = Typography
const { Content } = Layout

interface Software {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersionId?: number | null
  currentVersion: string
  latestVersion?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: {
    os?: string[]
    memory?: string
    storage?: string
    processor?: string
    graphics?: string
    other?: string
  }
  openname?: string
  filetype?: string
  isActive: boolean
  sortOrder: number
  metadata?: any
  createdAt: string
  updatedAt: string
}

export default function SoftwareDetail() {
  const params = useParams()
  const router = useRouter()
  const [software, setSoftware] = useState<Software | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取软件详情
  const fetchSoftwareDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
      const data = await response.json()

      if (data.success) {
        setSoftware(data.data)
      } else {
        message.error('获取软件详情失败')
      }
    } catch (error) {
      console.error('Error fetching software detail:', error)
      message.error('获取软件详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 删除软件
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除软件',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>确定要删除软件 <strong>{software?.name}</strong> 吗？</p>
          <p style={{ color: '#ff4d4f' }}>
            删除后将无法恢复，相关的版本历史和公告也会被删除。
          </p>
        </div>
      ),
      okText: '确定删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeleteLoading(true)
        try {
          const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
            }
          })

          const data = await response.json()

          if (data.success) {
            message.success('软件删除成功')
            router.push('/admin/software')
          } else {
            message.error(data.error || '删除失败')
          }
        } catch (error) {
          console.error('Error deleting software:', error)
          message.error('删除失败，请稍后重试')
        } finally {
          setDeleteLoading(false)
        }
      }
    })
  }

  useEffect(() => {
    if (softwareId) {
      fetchSoftwareDetail()
    }
  }, [softwareId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>正在加载软件详情...</Text>
        </div>
      </div>
    )
  }

  if (!software) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty
          description="未找到软件信息"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Link href="/admin/software">
            <Button type="primary">返回软件列表</Button>
          </Link>
        </Empty>
      </div>
    )
  }

  return (
    <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
        {/* 面包屑导航 */}
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item>
            <Link href="/admin">
              <HomeOutlined /> 管理后台
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/admin/software">
              <AppstoreOutlined /> 软件管理
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <InfoCircleOutlined /> {software.name}
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* 页面头部 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Link href="/admin/software">
              <Button icon={<ArrowLeftOutlined />}>返回</Button>
            </Link>
            <Title level={2} style={{ margin: 0 }}>
              {software.name}
            </Title>
            <Badge 
              status={software.isActive ? 'success' : 'error'} 
              text={software.isActive ? '启用' : '禁用'}
            />
          </Space>
          <div style={{ marginTop: '8px' }}>
            <Space>
              <Link href={`/admin/software/${software.id}/edit`}>
                <Button type="primary" icon={<EditOutlined />}>
                  编辑软件
                </Button>
              </Link>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                loading={deleteLoading}
                onClick={handleDelete}
              >
                删除软件
              </Button>
            </Space>
          </div>
        </div>

        {/* 软件状态提示 */}
        {!software.isActive && (
          <Alert
            message="软件已禁用"
            description="此软件当前处于禁用状态，用户无法在前端看到此软件。"
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* 主要内容区域 */}
        <Tabs
          defaultActiveKey="info"
          items={[
            {
              key: 'info',
              label: (
                <span>
                  <InfoCircleOutlined />
                  软件信息
                </span>
              ),
              children: (
                <Row gutter={24}>
                  <Col xs={24} md={16} lg={16}>
                    {/* 基本信息 */}
                    <Card title="基本信息" style={{ marginBottom: '24px' }}>
                      <Descriptions column={2} bordered>
                        <Descriptions.Item label="软件ID" span={1}>
                          <Tag color="blue">#{software.id}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="状态" span={1}>
                          <Badge 
                            status={software.isActive ? 'success' : 'error'} 
                            text={software.isActive ? '启用' : '禁用'}
                          />
                        </Descriptions.Item>
                        <Descriptions.Item label="中文名称" span={1}>
                          {software.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="英文名称" span={1}>
                          {software.nameEn || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="当前版本" span={1}>
                          <Tag color="green">{software.currentVersion}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="启动文件" span={1}>
                          {software.openname ? (
                            <Tag color="blue">{software.openname}</Tag>
                          ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="文件类型" span={1}>
                          {software.filetype ? (
                            <Tag color="orange">{software.filetype}</Tag>
                          ) : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="最新版本" span={1}>
                          {software.latestVersion ? (
                            <Tag color="blue">{software.latestVersion}</Tag>
                          ) : (
                            <Text type="secondary">自动计算</Text>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="软件分类" span={1}>
                          {software.category ? (
                            <Tag color="purple">{software.category}</Tag>
                          ) : (
                            <Text type="secondary">未分类</Text>
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="排序顺序" span={1}>
                          {software.sortOrder}
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间" span={1}>
                          <Space>
                            <CalendarOutlined />
                            {new Date(software.createdAt).toLocaleString('zh-CN')}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="更新时间" span={1}>
                          <Space>
                            <CalendarOutlined />
                            {new Date(software.updatedAt).toLocaleString('zh-CN')}
                          </Space>
                        </Descriptions.Item>
                        {software.officialWebsite && (
                          <Descriptions.Item label="官方网站" span={2}>
                            <a href={software.officialWebsite} target="_blank" rel="noopener noreferrer">
                              <Space>
                                <LinkOutlined />
                                {software.officialWebsite}
                              </Space>
                            </a>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="中文描述" span={2}>
                          {software.description ? (
                            <Paragraph>{software.description}</Paragraph>
                          ) : (
                            <Text type="secondary">暂无描述</Text>
                          )}
                        </Descriptions.Item>
                        {software.descriptionEn && (
                          <Descriptions.Item label="英文描述" span={2}>
                            <Paragraph>{software.descriptionEn}</Paragraph>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item label="软件标签" span={2}>
                          {software.tags && software.tags.length > 0 ? (
                            <Space wrap>
                              {software.tags.map(tag => (
                                <Tag key={tag} icon={<TagOutlined />}>
                                  {tag}
                                </Tag>
                              ))}
                            </Space>
                          ) : (
                            <Text type="secondary">无标签</Text>
                          )}
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>

                  <Col xs={24} md={8} lg={8}>
                    {/* 快速统计 */}
                    <Card title="快速统计" size="small" style={{ marginBottom: '24px' }}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="软件ID"
                            value={software.id}
                            prefix="#"
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="排序"
                            value={software.sortOrder}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* 快速操作 */}
                    <Card title="快速操作" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Link href={`/admin/software/${software.id}/edit`}>
                          <Button block icon={<EditOutlined />}>
                            编辑软件信息
                          </Button>
                        </Link>
                        <Button 
                          block 
                          danger 
                          icon={<DeleteOutlined />}
                          onClick={handleDelete}
                        >
                          删除软件
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'versions',
              label: (
                <span>
                  <HistoryOutlined />
                  版本管理
                </span>
              ),
              children: (
                <EnhancedVersionManager
                  softwareId={software.id}
                  softwareName={software.name}
                  onVersionAdded={() => {
                    // 版本添加后可以刷新软件信息
                    fetchSoftwareDetail()
                  }}
                />
              )
            },
            {
              key: 'announcements',
              label: (
                <span>
                  <BellOutlined />
                  公告管理
                </span>
              ),
              children: (
                <AnnouncementManager
                  softwareId={software.id}
                  softwareName={software.name}
                  onAnnouncementAdded={() => {
                    // 公告添加后可以刷新软件信息
                    fetchSoftwareDetail()
                  }}
                />
              )
            }
          ]}
        />
    </div>
  )
}

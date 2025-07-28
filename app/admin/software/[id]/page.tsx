'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout,
  Card, 
  Typography,
  Space,
  Tag,
  Button,
  Descriptions,
  Table,
  message,
  Spin
} from 'antd'
import { 
  ArrowLeftOutlined,
  EditOutlined,
  NotificationOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

const { Content } = Layout
const { Title, Text } = Typography

interface Software {
  id: string
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  latestVersion: string
  downloadUrl?: string
  downloadUrlBackup?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  fileSize?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  priority: string
  publishedAt: string
  isPublished: boolean
}

interface VersionHistory {
  id: string
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadUrl?: string
  fileSize?: string
  isStable: boolean
  isBeta: boolean
}

export default function SoftwareDetail() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [software, setSoftware] = useState<Software | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [activeTab, setActiveTab] = useState('info')

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取软件详情
  const fetchSoftwareDetail = async () => {
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
      message.error('网络错误，请稍后重试')
    }
  }

  // 获取软件公告
  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements`)
      const data = await response.json()

      if (data.success) {
        setAnnouncements(data.data.announcements)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    }
  }

  // 获取版本历史
  const fetchVersionHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/${softwareId}/versions`)
      const data = await response.json()

      if (data.success) {
        setVersions(data.data.versions)
      }
    } catch (error) {
      console.error('Error fetching version history:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchSoftwareDetail(),
        fetchAnnouncements(),
        fetchVersionHistory()
      ])
      setLoading(false)
    }

    if (softwareId) {
      loadData()
    }
  }, [softwareId])

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>加载中...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    )
  }

  if (!software) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Title level={3}>软件不存在</Title>
            <Link href="/admin/software">
              <Button type="primary">返回软件列表</Button>
            </Link>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      
      <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
        {/* 页面头部 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Link href="/admin/software">
              <Button icon={<ArrowLeftOutlined />}>返回</Button>
            </Link>
            <Title level={2} style={{ margin: 0 }}>
              {software.name}
            </Title>
            <Tag color={software.isActive ? 'green' : 'red'}>
              {software.isActive ? '启用' : '禁用'}
            </Tag>
          </Space>
          <div style={{ marginTop: '8px' }}>
            <Space>
              <Link href={`/admin/software/${software.id}/edit`}>
                <Button type="primary" icon={<EditOutlined />}>
                  编辑软件
                </Button>
              </Link>
            </Space>
          </div>
        </div>

        {/* 软件详情 */}
        <Card title="软件信息" style={{ marginBottom: '24px' }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="软件名称">{software.name}</Descriptions.Item>
            <Descriptions.Item label="英文名称">{software.nameEn || '-'}</Descriptions.Item>
            <Descriptions.Item label="当前版本">{software.currentVersion}</Descriptions.Item>
            <Descriptions.Item label="最新版本">{software.latestVersion}</Descriptions.Item>
            <Descriptions.Item label="分类">{software.category || '-'}</Descriptions.Item>
            <Descriptions.Item label="文件大小">{software.fileSize || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={software.isActive ? 'green' : 'red'}>
                {software.isActive ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="排序">{software.sortOrder}</Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {new Date(software.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间" span={2}>
              {new Date(software.updatedAt).toLocaleString()}
            </Descriptions.Item>
            {software.description && (
              <Descriptions.Item label="描述" span={2}>
                {software.description}
              </Descriptions.Item>
            )}
            {software.descriptionEn && (
              <Descriptions.Item label="英文描述" span={2}>
                {software.descriptionEn}
              </Descriptions.Item>
            )}
            {software.downloadUrl && (
              <Descriptions.Item label="下载链接" span={2}>
                <a href={software.downloadUrl} target="_blank" rel="noopener noreferrer">
                  {software.downloadUrl}
                </a>
              </Descriptions.Item>
            )}
            {software.officialWebsite && (
              <Descriptions.Item label="官方网站" span={2}>
                <a href={software.officialWebsite} target="_blank" rel="noopener noreferrer">
                  {software.officialWebsite}
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      </Content>
    </Layout>
  )
}

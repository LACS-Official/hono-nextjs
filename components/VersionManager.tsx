'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Switch, 
  Select, 
  message,
  Tooltip,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  RocketOutlined,
  BugOutlined,
  SafetyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input
const { Option } = Select

interface DownloadLinks {
  official?: string
  quark?: string
  pan123?: string
  baidu?: string
  thunder?: string
  backup?: string[]
}

interface VersionHistory {
  id: number
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: DownloadLinks
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: 'release' | 'beta' | 'alpha' | 'rc'
  changelogCategory?: string[]
  createdAt: string
  updatedAt: string
}

interface VersionManagerProps {
  softwareId: number
  softwareName: string
  onVersionAdded?: () => void
}

export default function VersionManager({ softwareId, softwareName, onVersionAdded }: VersionManagerProps) {
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingVersion, setEditingVersion] = useState<VersionHistory | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<any>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取版本历史
  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`)
      const data = await response.json()
      
      if (data.success) {
        setVersions(data.data.versions || [])
      } else {
        message.error('获取版本历史失败')
      }
    } catch (error) {
      console.error('获取版本历史失败:', error)
      message.error('获取版本历史失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取版本统计
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management?action=stats&softwareId=${softwareId}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取版本统计失败:', error)
    }
  }

  // 建议下一个版本号
  const suggestVersion = async (changeType: 'major' | 'minor' | 'patch' = 'patch') => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management?action=suggest&softwareId=${softwareId}&changeType=${changeType}`)
      const data = await response.json()
      
      if (data.success) {
        form.setFieldsValue({ version: data.data.suggestedVersion })
        message.success(`建议版本号: ${data.data.suggestedVersion}`)
      }
    } catch (error) {
      console.error('建议版本号失败:', error)
    }
  }

  useEffect(() => {
    fetchVersions()
    fetchStats()
  }, [softwareId])

  // 表格列定义
  const columns: ColumnsType<VersionHistory> = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (version: string, record: VersionHistory) => (
        <div>
          <Tag color={record.versionType === 'release' ? 'green' : 'orange'}>
            {version}
          </Tag>
          {record.isStable && <Tag color="blue">稳定版</Tag>}
          {record.isBeta && <Tag color="orange">测试版</Tag>}
          {record.isPrerelease && <Tag color="red">预发布</Tag>}
        </div>
      )
    },
    {
      title: '发布日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '更新类型',
      dataIndex: 'changelogCategory',
      key: 'changelogCategory',
      render: (categories: string[]) => (
        <div>
          {categories?.map(cat => {
            const icons = {
              feature: <RocketOutlined />,
              bugfix: <BugOutlined />,
              security: <SafetyOutlined />,
              performance: <ThunderboltOutlined />
            }
            const colors = {
              feature: 'blue',
              bugfix: 'orange',
              security: 'red',
              performance: 'green'
            }
            return (
              <Tag key={cat} color={colors[cat as keyof typeof colors]} icon={icons[cat as keyof typeof icons]}>
                {cat}
              </Tag>
            )
          })}
        </div>
      )
    },
    {
      title: '下载链接',
      dataIndex: 'downloadLinks',
      key: 'downloadLinks',
      render: (links: DownloadLinks) => (
        <Space direction="vertical" size="small">
          {links?.official && (
            <Button size="small" icon={<DownloadOutlined />} href={links.official} target="_blank">
              官方下载
            </Button>
          )}
          {links?.quark && (
            <Button size="small" href={links.quark} target="_blank">
              夸克网盘
            </Button>
          )}
          {links?.pan123 && (
            <Button size="small" href={links.pan123} target="_blank">
              123网盘
            </Button>
          )}
          {links?.baidu && (
            <Button size="small" href={links.baidu} target="_blank">
              百度网盘
            </Button>
          )}
          {links?.thunder && (
            <Button size="small" href={links.thunder} target="_blank">
              迅雷下载
            </Button>
          )}
        </Space>
      )
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: VersionHistory) => (
        <Space size="middle">
          <Tooltip title="编辑版本">
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="删除版本">
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  const handleEdit = (version: VersionHistory) => {
    setEditingVersion(version)
    form.setFieldsValue({
      ...version,
      releaseDate: version.releaseDate,
      downloadLinks: version.downloadLinks || {}
    })
    setModalVisible(true)
  }

  const handleDelete = async (versionId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个版本吗？此操作不可撤销。',
      onOk: async () => {
        try {
          // 这里需要实现删除API
          message.success('版本删除成功')
          fetchVersions()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async (values: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()
      
      if (data.success) {
        message.success('版本添加成功')
        setModalVisible(false)
        form.resetFields()
        fetchVersions()
        fetchStats()
        onVersionAdded?.()
      } else {
        message.error(data.error || '添加失败')
      }
    } catch (error) {
      message.error('添加失败')
    }
  }

  return (
    <div>
      {/* 版本统计 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总版本数" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="稳定版本" value={stats.stable} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="测试版本" value={stats.beta} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="发布频率" 
                value={stats.releaseFrequency} 
                suffix="天/版本"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingVersion(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            添加新版本
          </Button>
          <Button onClick={() => suggestVersion('patch')}>
            建议补丁版本
          </Button>
          <Button onClick={() => suggestVersion('minor')}>
            建议次要版本
          </Button>
          <Button onClick={() => suggestVersion('major')}>
            建议主要版本
          </Button>
        </Space>
      </Card>

      {/* 版本列表 */}
      <Card title={`${softwareName} - 版本历史`}>
        <Table
          columns={columns}
          dataSource={versions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* 添加/编辑版本模态框 */}
      <Modal
        title={editingVersion ? '编辑版本' : '添加新版本'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="版本号"
                rules={[
                  { required: true, message: '请输入版本号' },
                  { pattern: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, message: '请输入有效的语义化版本号 (如: 1.0.0)' }
                ]}
              >
                <Input placeholder="1.0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="releaseDate"
                label="发布日期"
                rules={[{ required: true, message: '请选择发布日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fileSize" label="文件大小">
                <Input placeholder="如: 125.6 MB" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileSizeBytes" label="文件大小(字节)">
                <Input type="number" placeholder="131681280" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="fileHash" label="文件哈希值">
            <Input placeholder="SHA256 或 MD5 哈希值" />
          </Form.Item>

          <Divider>下载链接</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['downloadLinks', 'official']} label="官方下载链接">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['downloadLinks', 'quark']} label="夸克网盘链接">
                <Input placeholder="https://pan.quark.cn/..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name={['downloadLinks', 'pan123']} label="123网盘链接">
                <Input placeholder="https://www.123pan.com/..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['downloadLinks', 'baidu']} label="百度网盘链接">
                <Input placeholder="https://pan.baidu.com/..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name={['downloadLinks', 'thunder']} label="迅雷下载链接">
            <Input placeholder="thunder://..." />
          </Form.Item>

          <Divider>版本信息</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="isStable" label="稳定版本" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isBeta" label="测试版本" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isPrerelease" label="预发布版本" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="changelogCategory" label="更新类型">
            <Select mode="multiple" placeholder="选择更新类型">
              <Option value="feature">新功能</Option>
              <Option value="bugfix">错误修复</Option>
              <Option value="security">安全更新</Option>
              <Option value="performance">性能优化</Option>
            </Select>
          </Form.Item>

          <Form.Item name="releaseNotes" label="更新日志 (中文)">
            <TextArea rows={4} placeholder="描述此版本的更新内容..." />
          </Form.Item>

          <Form.Item name="releaseNotesEn" label="更新日志 (英文)">
            <TextArea rows={4} placeholder="Describe the changes in this version..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

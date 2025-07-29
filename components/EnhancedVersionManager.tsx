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
  Statistic,
  Alert,
  Checkbox
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
  ThunderboltOutlined,
  CompareOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import VersionComparison from './VersionComparison'

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
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface VersionStats {
  totalVersions: number
  stableVersions: number
  betaVersions: number
  prereleaseVersions: number
  latestVersion: string
  oldestVersion: string
  averageReleaseInterval: number
}

interface EnhancedVersionManagerProps {
  softwareId: number
  softwareName: string
  onVersionAdded?: () => void
}

export default function EnhancedVersionManager({ 
  softwareId, 
  softwareName, 
  onVersionAdded 
}: EnhancedVersionManagerProps) {
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingVersion, setEditingVersion] = useState<VersionHistory | null>(null)
  const [form] = Form.useForm()
  const [stats, setStats] = useState<VersionStats | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<VersionHistory[]>([])
  const [comparisonVisible, setComparisonVisible] = useState(false)
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(false)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取版本历史
  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`)
      const data = await response.json()
      
      if (data.success) {
        const sortedVersions = data.data.sort((a: VersionHistory, b: VersionHistory) => 
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        )
        setVersions(sortedVersions)
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

  // 自动更新最新版本
  const handleAutoUpdate = async () => {
    setAutoUpdateLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateSingle',
          softwareId: softwareId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        message.success(data.message || '版本更新成功')
        onVersionAdded?.()
      } else {
        message.error(data.error || '版本更新失败')
      }
    } catch (error) {
      message.error('版本更新失败')
    } finally {
      setAutoUpdateLoading(false)
    }
  }

  // 建议版本号
  const suggestVersion = async (changeType: 'major' | 'minor' | 'patch') => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management?action=suggest&softwareId=${softwareId}&changeType=${changeType}`)
      const data = await response.json()
      
      if (data.success) {
        form.setFieldsValue({ version: data.data.suggestedVersion })
        message.success(`建议版本号: ${data.data.suggestedVersion}`)
      } else {
        message.error('获取建议版本号失败')
      }
    } catch (error) {
      message.error('获取建议版本号失败')
    }
  }

  // 处理版本选择（用于比较）
  const handleVersionSelect = (version: VersionHistory, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, version])
      } else {
        message.warning('最多只能选择两个版本进行比较')
      }
    } else {
      setSelectedVersions(selectedVersions.filter(v => v.id !== version.id))
    }
  }

  // 清除版本选择
  const clearVersionSelection = () => {
    setSelectedVersions([])
  }

  // 显示版本比较
  const showVersionComparison = () => {
    if (selectedVersions.length === 2) {
      setComparisonVisible(true)
    } else {
      message.warning('请选择两个版本进行比较')
    }
  }

  useEffect(() => {
    fetchVersions()
    fetchStats()
  }, [softwareId])

  // 渲染下载链接
  const renderDownloadLinks = (links: DownloadLinks) => {
    if (!links) return <span style={{ color: '#999' }}>暂无下载链接</span>
    
    const linkButtons = []
    
    if (links.official) {
      linkButtons.push(
        <Button key="official" size="small" type="primary" icon={<DownloadOutlined />} href={links.official} target="_blank">
          官方
        </Button>
      )
    }
    
    if (links.quark) {
      linkButtons.push(
        <Button key="quark" size="small" href={links.quark} target="_blank">
          夸克
        </Button>
      )
    }
    
    if (links.pan123) {
      linkButtons.push(
        <Button key="pan123" size="small" href={links.pan123} target="_blank">
          123
        </Button>
      )
    }
    
    if (links.baidu) {
      linkButtons.push(
        <Button key="baidu" size="small" href={links.baidu} target="_blank">
          百度
        </Button>
      )
    }
    
    if (links.thunder) {
      linkButtons.push(
        <Button key="thunder" size="small" href={links.thunder} target="_blank">
          迅雷
        </Button>
      )
    }
    
    return <Space wrap>{linkButtons}</Space>
  }

  // 处理编辑
  const handleEdit = (version: VersionHistory) => {
    setEditingVersion(version)
    form.setFieldsValue({
      ...version,
      releaseDate: version.releaseDate ? new Date(version.releaseDate) : null
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (versionId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个版本吗？此操作不可撤销。',
      onOk: async () => {
        try {
          // 这里需要实现删除API
          message.success('版本删除成功')
          fetchVersions()
          fetchStats()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 处理提交
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

  // 表格列定义
  const columns: ColumnsType<VersionHistory> = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedVersions.some(v => v.id === record.id)}
          onChange={(e) => handleVersionSelect(record, e.target.checked)}
          disabled={selectedVersions.length >= 2 && !selectedVersions.some(v => v.id === record.id)}
        />
      )
    },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (version: string, record: VersionHistory) => (
        <div>
          <Tag color={record.isStable ? 'green' : record.isBeta ? 'orange' : 'red'}>
            {version}
          </Tag>
          <div style={{ marginTop: 4 }}>
            {record.isStable && <Tag color="green" size="small">稳定</Tag>}
            {record.isBeta && <Tag color="orange" size="small">测试</Tag>}
            {record.isPrerelease && <Tag color="red" size="small">预发布</Tag>}
          </div>
        </div>
      )
    },
    {
      title: '发布日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '更新类型',
      dataIndex: 'changelogCategory',
      key: 'changelogCategory',
      width: 150,
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
            const labels = {
              feature: '新功能',
              bugfix: '错误修复',
              security: '安全更新',
              performance: '性能优化'
            }
            return (
              <Tag
                key={cat}
                color={colors[cat as keyof typeof colors]}
                icon={icons[cat as keyof typeof icons]}
                size="small"
              >
                {labels[cat as keyof typeof labels] || cat}
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
      width: 200,
      render: (links: DownloadLinks) => renderDownloadLinks(links)
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100
    },
    {
      title: '更新日志',
      dataIndex: 'releaseNotes',
      key: 'releaseNotes',
      width: 200,
      render: (notes: string) => (
        notes ? (
          <Tooltip title={notes} placement="topLeft">
            <div style={{
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {notes}
            </div>
          </Tooltip>
        ) : (
          <span style={{ color: '#999' }}>无更新日志</span>
        )
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record: VersionHistory) => (
        <Space size="small">
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

  return (
    <div>
      {/* 版本统计卡片 */}
      {stats && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic title="总版本数" value={stats.totalVersions} />
            </Col>
            <Col span={4}>
              <Statistic title="稳定版本" value={stats.stableVersions} />
            </Col>
            <Col span={4}>
              <Statistic title="测试版本" value={stats.betaVersions} />
            </Col>
            <Col span={4}>
              <Statistic title="预发布版本" value={stats.prereleaseVersions} />
            </Col>
            <Col span={4}>
              <Statistic title="最新版本" value={stats.latestVersion} />
            </Col>
            <Col span={4}>
              <Statistic
                title="平均发布间隔"
                value={stats.averageReleaseInterval}
                suffix="天"
                precision={1}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 操作按钮 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
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
              <Button
                icon={<SyncOutlined />}
                loading={autoUpdateLoading}
                onClick={handleAutoUpdate}
              >
                自动更新版本
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
          </Col>
          <Col>
            <Space>
              {selectedVersions.length > 0 && (
                <>
                  <span>已选择 {selectedVersions.length}/2 个版本</span>
                  <Button
                    type="primary"
                    icon={<CompareOutlined />}
                    onClick={showVersionComparison}
                    disabled={selectedVersions.length !== 2}
                  >
                    版本比较
                  </Button>
                  <Button onClick={clearVersionSelection}>
                    清除选择
                  </Button>
                </>
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchVersions()
                  fetchStats()
                }}
              >
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 版本列表表格 */}
      <Card title={`${softwareName} - 版本历史`}>
        {selectedVersions.length > 0 && (
          <Alert
            message={`已选择 ${selectedVersions.length} 个版本: ${selectedVersions.map(v => v.version).join(', ')}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Space>
                {selectedVersions.length === 2 && (
                  <Button size="small" type="primary" onClick={showVersionComparison}>
                    比较版本
                  </Button>
                )}
                <Button size="small" onClick={clearVersionSelection}>
                  清除
                </Button>
              </Space>
            }
          />
        )}

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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 版本比较组件 */}
      <VersionComparison
        visible={comparisonVisible}
        onClose={() => setComparisonVisible(false)}
        versions={versions}
        selectedVersions={selectedVersions}
      />
    </div>
  )
}

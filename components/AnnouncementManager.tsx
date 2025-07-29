'use client'

import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
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
  Popconfirm,
  Typography,
  Alert
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

interface Announcement {
  id: number
  softwareId: number
  title: string
  titleEn?: string
  content: string
  contentEn?: string
  type: string
  priority: string
  version?: string
  isPublished: boolean
  publishedAt: string
  expiresAt?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface AnnouncementManagerProps {
  softwareId: number
  softwareName: string
  onAnnouncementAdded?: () => void
}

export default function AnnouncementManager({ 
  softwareId, 
  softwareName, 
  onAnnouncementAdded 
}: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [form] = Form.useForm()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements`)
      const data = await response.json()
      
      if (data.success) {
        setAnnouncements(data.data.announcements || [])
      } else {
        message.error('获取公告列表失败')
      }
    } catch (error) {
      console.error('获取公告列表失败:', error)
      message.error('获取公告列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [softwareId])

  // 渲染公告类型标签
  const renderTypeTag = (type: string) => {
    const typeConfig = {
      general: { color: 'blue', text: '一般' },
      update: { color: 'green', text: '更新' },
      security: { color: 'red', text: '安全' },
      maintenance: { color: 'orange', text: '维护' },
      feature: { color: 'purple', text: '功能' },
      bugfix: { color: 'cyan', text: '修复' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'default', text: type }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 渲染优先级标签
  const renderPriorityTag = (priority: string) => {
    const priorityConfig = {
      low: { color: 'default', text: '低', icon: <InfoCircleOutlined /> },
      normal: { color: 'blue', text: '普通', icon: <BellOutlined /> },
      high: { color: 'orange', text: '高', icon: <WarningOutlined /> },
      urgent: { color: 'red', text: '紧急', icon: <ExclamationCircleOutlined /> }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || { color: 'default', text: priority, icon: null }
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // 渲染发布状态
  const renderPublishStatus = (isPublished: boolean, expiresAt?: string) => {
    if (!isPublished) {
      return <Tag color="default">未发布</Tag>
    }
    
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return <Tag color="red">已过期</Tag>
    }
    
    return <Tag color="green" icon={<CheckCircleOutlined />}>已发布</Tag>
  }

  // 处理编辑
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    form.setFieldsValue({
      ...announcement,
      publishedAt: announcement.publishedAt ? dayjs(announcement.publishedAt) : null,
      expiresAt: announcement.expiresAt ? dayjs(announcement.expiresAt) : null
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        message.success('公告删除成功')
        fetchAnnouncements()
      } else {
        message.error(data.error || '删除失败')
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 处理提交
  const handleSubmit = async (values: any) => {
    try {
      // 处理日期格式
      const submitData = {
        ...values,
        softwareId,
        publishedAt: values.publishedAt ? values.publishedAt.toISOString() : new Date().toISOString(),
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null
      }

      let response
      if (editingAnnouncement) {
        // 编辑模式
        response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      } else {
        // 新增模式
        response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        message.success(editingAnnouncement ? '公告更新成功' : '公告添加成功')
        setModalVisible(false)
        setEditingAnnouncement(null)
        form.resetFields()
        fetchAnnouncements()
        onAnnouncementAdded?.()
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<Announcement> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          {record.titleEn && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.titleEn}</div>
          )}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: renderTypeTag
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: renderPriorityTag
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (text) => text ? <Tag>{text}</Tag> : '-'
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => renderPublishStatus(record.isPublished, record.expiresAt)
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 120,
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: record.title,
                  width: 600,
                  content: (
                    <div>
                      <p><strong>内容：</strong></p>
                      <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                        {record.content}
                      </div>
                      {record.contentEn && (
                        <>
                          <p><strong>英文内容：</strong></p>
                          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
                            {record.contentEn}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个公告吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                type="text" 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        title={
          <Space>
            <BellOutlined />
            公告管理
            <Text type="secondary">({softwareName})</Text>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingAnnouncement(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            添加公告
          </Button>
        }
      >
        <Alert
          message="公告管理说明"
          description="在这里可以为软件添加、编辑和删除公告。公告可以用于通知用户软件更新、安全提醒、维护通知等重要信息。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          locale={{
            emptyText: '暂无公告数据'
          }}
        />
      </Card>

      {/* 添加/编辑公告模态框 */}
      <Modal
        title={editingAnnouncement ? '编辑公告' : '添加公告'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingAnnouncement(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'general',
            priority: 'normal',
            isPublished: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="公告标题"
                name="title"
                rules={[{ required: true, message: '请输入公告标题' }]}
              >
                <Input placeholder="请输入公告标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="英文标题"
                name="titleEn"
              >
                <Input placeholder="请输入英文标题（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="公告内容"
            name="content"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入公告内容"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            label="英文内容"
            name="contentEn"
          >
            <TextArea 
              rows={4} 
              placeholder="请输入英文内容（可选）"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="公告类型"
                name="type"
              >
                <Select>
                  <Option value="general">一般</Option>
                  <Option value="update">更新</Option>
                  <Option value="security">安全</Option>
                  <Option value="maintenance">维护</Option>
                  <Option value="feature">功能</Option>
                  <Option value="bugfix">修复</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="优先级"
                name="priority"
              >
                <Select>
                  <Option value="low">低</Option>
                  <Option value="normal">普通</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="相关版本"
                name="version"
              >
                <Input placeholder="如：v1.0.0（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="发布时间"
                name="publishedAt"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择发布时间"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="过期时间"
                name="expiresAt"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }}
                  placeholder="选择过期时间（可选）"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="发布状态"
            name="isPublished"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="已发布" 
              unCheckedChildren="未发布" 
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false)
                setEditingAnnouncement(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingAnnouncement ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

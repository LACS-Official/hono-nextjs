'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Input,
  Switch,
  Tooltip,
  Popconfirm,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Breadcrumb
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  NotificationOutlined,
  HomeOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import PageContainer from '@/components/PageContainer'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface Announcement {
  id: number
  websiteId: number
  title: string
  content: string
  type: string
  isSticky: boolean
  sortOrder: number
  startDate?: string
  endDate?: string
  isActive: boolean
  isPublished: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface Website {
  id: number
  name: string
  domain: string
}

export default function AnnouncementsPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<Website | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [form] = Form.useForm()

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/websites/${websiteId}/announcements`)
      const data = await response.json()

      if (data.success) {
        setWebsite(data.data.website)
        setAnnouncements(data.data.announcements)
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
    if (websiteId) {
      fetchAnnouncements()
    }
  }, [websiteId])

  // 处理编辑
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    form.setFieldsValue({
      ...announcement,
      dateRange: announcement.startDate && announcement.endDate 
        ? [dayjs(announcement.startDate), dayjs(announcement.endDate)]
        : null
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/announcements/${id}`, {
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
      const submitData = {
        title: values.title,
        content: values.content,
        type: values.type,
        isSticky: values.isSticky,
        sortOrder: values.sortOrder,
        startDate: values.dateRange?.[0]?.toISOString(),
        endDate: values.dateRange?.[1]?.toISOString(),
        isActive: values.isActive,
        isPublished: values.isPublished,
      }

      let response
      if (editingAnnouncement) {
        response = await fetch(`/api/websites/${websiteId}/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch(`/api/websites/${websiteId}/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      }

      const data = await response.json()

      if (data.success) {
        message.success(editingAnnouncement ? '公告更新成功' : '公告创建成功')
        setModalVisible(false)
        setEditingAnnouncement(null)
        form.resetFields()
        fetchAnnouncements()
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 渲染类型标签
  const renderTypeTag = (type: string) => {
    const typeConfig = {
      info: { color: 'blue', text: '信息' },
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '错误' },
      success: { color: 'green', text: '成功' },
    }
    const config = typeConfig[type as keyof typeof typeConfig] || { color: 'default', text: type }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<Announcement> = [
    {
      title: '公告信息',
      key: 'info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {record.isSticky && <Tag color="red" style={{ marginRight: 8 }}>置顶</Tag>}
            {record.title}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
            {record.content.length > 50 ? record.content.substring(0, 50) + '...' : record.content}
          </div>
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
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 60,
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
          <Tag color={record.isPublished ? 'blue' : 'orange'}>
            {record.isPublished ? '已发布' : '草稿'}
          </Tag>
        </Space>
      )
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
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
    <PageContainer title="公告管理">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <GlobalOutlined />
          <span onClick={() => router.push('/admin/websites')} style={{ cursor: 'pointer', marginLeft: 8 }}>
            网站管理
          </span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <NotificationOutlined />
          公告管理
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card
        title={
          <Space>
            <NotificationOutlined />
            公告管理
            {website && (
              <Text type="secondary">({website.name})</Text>
            )}
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
        <Table
          columns={columns}
          dataSource={announcements}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个公告`
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
            type: 'info',
            isSticky: false,
            sortOrder: 0,
            isActive: true,
            isPublished: true
          }}
        >
          <Form.Item
            label="公告标题"
            name="title"
            rules={[{ required: true, message: '请输入公告标题' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            label="公告内容"
            name="content"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入公告内容"
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="公告类型"
                name="type"
              >
                <Select>
                  <Option value="info">信息</Option>
                  <Option value="warning">警告</Option>
                  <Option value="error">错误</Option>
                  <Option value="success">成功</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="排序"
                name="sortOrder"
              >
                <Input type="number" placeholder="数字越小越靠前" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="置顶"
                name="isSticky"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="置顶"
                  unCheckedChildren="普通"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="显示时间"
            name="dateRange"
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="启用状态"
                name="isActive"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="发布状态"
                name="isPublished"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="已发布"
                  unCheckedChildren="草稿"
                />
              </Form.Item>
            </Col>
          </Row>

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
                {editingAnnouncement ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

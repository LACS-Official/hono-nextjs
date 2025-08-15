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
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  GlobalOutlined,
  SettingOutlined,
  PictureOutlined,
  UserOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import PageContainer from '@/components/PageContainer'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface Website {
  id: number
  name: string
  domain: string
  title?: string
  description?: string
  logo?: string
  favicon?: string
  config?: any
  isActive: boolean
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

interface WebsiteStats {
  bannersCount: number
  pagesCount: number
  menusCount: number
  usersCount: number
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 获取网站列表
  const fetchWebsites = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/websites?${params}`)
      const data = await response.json()

      if (data.success) {
        setWebsites(data.data.websites)
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        })
      } else {
        message.error('获取网站列表失败')
      }
    } catch (error) {
      console.error('获取网站列表失败:', error)
      message.error('获取网站列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebsites()
  }, [])

  // 处理编辑
  const handleEdit = (website: Website) => {
    setEditingWebsite(website)
    form.setFieldsValue({
      ...website,
      themeColor: website.config?.theme?.primaryColor || '#1890ff',
      seoKeywords: website.config?.seo?.keywords?.join(', ') || '',
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/websites/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        message.success('网站删除成功')
        fetchWebsites(pagination.current, pagination.pageSize)
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
        ...values,
        config: {
          theme: {
            primaryColor: values.themeColor
          },
          seo: {
            keywords: values.seoKeywords ? values.seoKeywords.split(',').map((k: string) => k.trim()) : []
          }
        }
      }

      let response
      if (editingWebsite) {
        response = await fetch(`/api/websites/${editingWebsite.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch('/api/websites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      }

      const data = await response.json()

      if (data.success) {
        message.success(editingWebsite ? '网站更新成功' : '网站创建成功')
        setModalVisible(false)
        setEditingWebsite(null)
        form.resetFields()
        fetchWebsites(pagination.current, pagination.pageSize)
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<Website> = [
    {
      title: '网站信息',
      key: 'info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {record.name}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.domain}
          </div>
          {record.title && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: 2 }}>
              {record.title}
            </div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? '启用' : '禁用'}
          </Tag>
          <Tag color={record.isPublic ? 'blue' : 'orange'}>
            {record.isPublic ? '公开' : '私有'}
          </Tag>
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text) => new Date(text).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // 这里可以跳转到网站详情页面
                window.open(`/admin/websites/${record.id}`, '_blank')
              }}
            />
          </Tooltip>
          <Tooltip title="轮播图管理">
            <Button
              type="text"
              size="small"
              icon={<PictureOutlined />}
              onClick={() => {
                // 跳转到轮播图管理页面
                window.open(`/admin/websites/${record.id}/banners`, '_blank')
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
              title="确定要删除这个网站吗？"
              description="删除后将无法恢复，相关的轮播图、页面等数据也会被删除。"
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
    <PageContainer>
      <Card
        title={
          <Space>
            <GlobalOutlined />
            网站管理
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingWebsite(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            添加网站
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={websites}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个网站`,
            onChange: (page, pageSize) => {
              fetchWebsites(page, pageSize)
            }
          }}
          locale={{
            emptyText: '暂无网站数据'
          }}
        />
      </Card>

      {/* 添加/编辑网站模态框 */}
      <Modal
        title={editingWebsite ? '编辑网站' : '添加网站'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingWebsite(null)
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
            isActive: true,
            isPublic: true,
            themeColor: '#1890ff'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="网站名称"
                name="name"
                rules={[{ required: true, message: '请输入网站名称' }]}
              >
                <Input placeholder="请输入网站名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="域名"
                name="domain"
                rules={[{ required: true, message: '请输入域名' }]}
              >
                <Input placeholder="example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="网站标题"
            name="title"
          >
            <Input placeholder="网站标题（用于SEO）" />
          </Form.Item>

          <Form.Item
            label="网站描述"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="网站描述（用于SEO）"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Logo URL"
                name="logo"
              >
                <Input placeholder="https://example.com/logo.png" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Favicon URL"
                name="favicon"
              >
                <Input placeholder="https://example.com/favicon.ico" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="主题色"
                name="themeColor"
              >
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="SEO关键词"
                name="seoKeywords"
              >
                <Input placeholder="关键词1, 关键词2, 关键词3" />
              </Form.Item>
            </Col>
          </Row>

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
                label="公开状态"
                name="isPublic"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="公开"
                  unCheckedChildren="私有"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false)
                setEditingWebsite(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingWebsite ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

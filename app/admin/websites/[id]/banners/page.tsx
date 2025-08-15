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
  InputNumber,
  Image,
  Breadcrumb
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PictureOutlined,
  HomeOutlined,
  GlobalOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import { useParams, useRouter } from 'next/navigation'
import type { ColumnsType } from 'antd/es/table'
import PageContainer from '@/components/PageContainer'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

interface Banner {
  id: number
  websiteId: number
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  imageAlt?: string
  linkUrl?: string
  linkTarget: string
  position: string
  sortOrder: number
  style?: any
  displayConditions?: any
  isActive: boolean
  isPublished: boolean
  viewCount: number
  clickCount: number
  createdAt: string
  updatedAt: string
}

interface Website {
  id: number
  name: string
  domain: string
}

export default function BannersPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<Website | null>(null)
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [form] = Form.useForm()

  // 获取轮播图列表
  const fetchBanners = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/websites/${websiteId}/banners`)
      const data = await response.json()

      if (data.success) {
        setWebsite(data.data.website)
        setBanners(data.data.banners)
      } else {
        message.error('获取轮播图列表失败')
      }
    } catch (error) {
      console.error('获取轮播图列表失败:', error)
      message.error('获取轮播图列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (websiteId) {
      fetchBanners()
    }
  }, [websiteId])

  // 处理编辑
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    form.setFieldsValue({
      ...banner,
      devices: banner.displayConditions?.devices || [],
      pages: banner.displayConditions?.pages?.join(', ') || '',
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/websites/${websiteId}/banners/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        message.success('轮播图删除成功')
        fetchBanners()
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
        displayConditions: {
          devices: values.devices || [],
          pages: values.pages ? values.pages.split(',').map((p: string) => p.trim()) : [],
        }
      }

      let response
      if (editingBanner) {
        response = await fetch(`/api/websites/${websiteId}/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch(`/api/websites/${websiteId}/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      }

      const data = await response.json()

      if (data.success) {
        message.success(editingBanner ? '轮播图更新成功' : '轮播图创建成功')
        setModalVisible(false)
        setEditingBanner(null)
        form.resetFields()
        fetchBanners()
      } else {
        message.error(data.error || '操作失败')
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  // 渲染位置标签
  const renderPositionTag = (position: string) => {
    const positionConfig = {
      main: { color: 'blue', text: '主要' },
      sidebar: { color: 'green', text: '侧边栏' },
      footer: { color: 'orange', text: '页脚' },
    }
    const config = positionConfig[position as keyof typeof positionConfig] || { color: 'default', text: position }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  // 表格列定义
  const columns: ColumnsType<Banner> = [
    {
      title: '轮播图',
      key: 'image',
      width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src={record.imageUrl}
            alt={record.imageAlt || record.title}
            width={60}
            height={40}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
          />
        </div>
      )
    },
    {
      title: '标题信息',
      key: 'info',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {record.title}
          </div>
          {record.subtitle && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 2 }}>
              {record.subtitle}
            </div>
          )}
          {record.linkUrl && (
            <div style={{ fontSize: '12px', color: '#1890ff' }}>
              链接: {record.linkUrl}
            </div>
          )}
        </div>
      )
    },
    {
      title: '位置',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      render: renderPositionTag
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
      title: '统计',
      key: 'stats',
      width: 80,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div>浏览: {record.viewCount}</div>
          <div>点击: {record.clickCount}</div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="预览">
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
                      <Image
                        src={record.imageUrl}
                        alt={record.imageAlt || record.title}
                        style={{ width: '100%', marginBottom: 16 }}
                      />
                      {record.description && (
                        <p><strong>描述：</strong>{record.description}</p>
                      )}
                      {record.linkUrl && (
                        <p><strong>链接：</strong><a href={record.linkUrl} target={record.linkTarget}>{record.linkUrl}</a></p>
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
              title="确定要删除这个轮播图吗？"
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
          <PictureOutlined />
          轮播图管理
        </Breadcrumb.Item>
      </Breadcrumb>

      <Card
        title={
          <Space>
            <PictureOutlined />
            轮播图管理
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
              setEditingBanner(null)
              form.resetFields()
              setModalVisible(true)
            }}
          >
            添加轮播图
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={banners}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个轮播图`
          }}
          locale={{
            emptyText: '暂无轮播图数据'
          }}
        />
      </Card>

      {/* 添加/编辑轮播图模态框 */}
      <Modal
        title={editingBanner ? '编辑轮播图' : '添加轮播图'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingBanner(null)
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
            position: 'main',
            linkTarget: '_self',
            sortOrder: 0,
            isActive: true,
            isPublished: true
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="标题"
                name="title"
                rules={[{ required: true, message: '请输入标题' }]}
              >
                <Input placeholder="请输入轮播图标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="副标题"
                name="subtitle"
              >
                <Input placeholder="请输入副标题（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="图片URL"
            name="imageUrl"
            rules={[{ required: true, message: '请输入图片URL' }]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item
            label="图片描述"
            name="imageAlt"
          >
            <Input placeholder="图片alt文本（用于SEO和无障碍访问）" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea
              rows={3}
              placeholder="轮播图描述"
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="链接URL"
                name="linkUrl"
              >
                <Input placeholder="点击跳转链接（可选）" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="链接打开方式"
                name="linkTarget"
              >
                <Select>
                  <Option value="_self">当前窗口</Option>
                  <Option value="_blank">新窗口</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="显示位置"
                name="position"
              >
                <Select>
                  <Option value="main">主要位置</Option>
                  <Option value="sidebar">侧边栏</Option>
                  <Option value="footer">页脚</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="排序"
                name="sortOrder"
              >
                <InputNumber
                  min={0}
                  max={999}
                  style={{ width: '100%' }}
                  placeholder="数字越小越靠前"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="显示设备"
                name="devices"
              >
                <Select
                  mode="multiple"
                  placeholder="选择显示设备"
                  allowClear
                >
                  <Option value="desktop">桌面端</Option>
                  <Option value="mobile">移动端</Option>
                  <Option value="tablet">平板端</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="显示页面"
            name="pages"
          >
            <Input placeholder="指定显示页面，多个页面用逗号分隔（留空表示所有页面）" />
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
                setEditingBanner(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingBanner ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

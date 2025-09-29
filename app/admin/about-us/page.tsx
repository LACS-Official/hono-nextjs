'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Space,
  Popconfirm,
  Tag,
  Typography,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

interface AboutUsInfo {
  id: number
  title: string
  content: string
  category: string
  displayOrder: number
  isPublished: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export default function AboutUsManagementPage() {
  const [data, setData] = useState<AboutUsInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AboutUsInfo | null>(null)
  const [form] = Form.useForm()

  // 分类选项
  const categoryOptions = [
    { label: '公司介绍', value: '公司介绍' },
    { label: '团队成员', value: '团队成员' },
    { label: '发展历史', value: '发展历史' },
    { label: '企业愿景', value: '企业愿景' },
    { label: '核心价值观', value: '核心价值观' },
    { label: '联系方式', value: '联系方式' },
    { label: '其他', value: '其他' }
  ]

  // 获取数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/info-management/about-us')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        message.error(result.error || '获取数据失败')
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 打开新增/编辑模态框
  const handleOpenModal = (record?: AboutUsInfo) => {
    if (record) {
      setEditingRecord(record)
      form.setFieldsValue({
        ...record,
        isPublished: record.isPublished === 1
      })
    } else {
      setEditingRecord(null)
      form.resetFields()
      form.setFieldsValue({
        displayOrder: 0,
        isPublished: true
      })
    }
    setModalVisible(true)
  }

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingRecord(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        isPublished: values.isPublished ? 1 : 0
      }

      const url = editingRecord
        ? `/api/info-management/about-us/${editingRecord.id}`
        : '/api/info-management/about-us'
      
      const method = editingRecord ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        message.success(editingRecord ? '更新成功' : '创建成功')
        handleCloseModal()
        fetchData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  // 删除记录
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/info-management/about-us/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<AboutUsInfo> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
        </Tooltip>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      filters: categoryOptions.map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.category === value,
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '显示顺序',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 100,
      sorter: (a, b) => a.displayOrder - b.displayOrder
    },
    {
      title: '发布状态',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 100,
      filters: [
        { text: '已发布', value: 1 },
        { text: '未发布', value: 0 }
      ],
      onFilter: (value, record) => record.isPublished === value,
      render: (isPublished: number) => (
        isPublished === 1 ? (
          <Tag icon={<CheckCircleOutlined />} color="success">已发布</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">未发布</Tag>
        )
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条信息吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '0 24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            关于我们信息管理
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            新增信息
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            defaultPageSize: 10,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑关于我们信息' : '新增关于我们信息'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        width={700}
        okText="提交"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea
              placeholder="请输入内容"
              rows={6}
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select
              placeholder="请选择分类"
              options={categoryOptions}
              showSearch
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="显示顺序"
            tooltip="数字越大，显示越靠前"
            rules={[{ required: true, message: '请输入显示顺序' }]}
          >
            <InputNumber
              placeholder="请输入显示顺序"
              min={0}
              max={9999}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isPublished"
            label="发布状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="已发布"
              unCheckedChildren="未发布"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

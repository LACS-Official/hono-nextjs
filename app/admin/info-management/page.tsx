'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Tabs,
  Tag,
  Typography,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ContactsOutlined,
  ProjectOutlined,
  TeamOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { TextArea } = Input

// 类型定义
interface ContactInfo {
  id: number
  title: string
  description: string
  info: string
  action: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface GroupChat {
  id: number
  name: string
  limit: string
  groupNumber: string
  qrcode: string
  joinLink: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface MediaPlatform {
  id: string
  name: string
  logo: string
  account: string
  accountId: string
  qrcode: string
  qrcodeTitle: string
  qrcodeDesc: string
  link: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: number
  category: string
  categoryName: string
  title: string
  description: string
  platform: string
  updateDate: string
  link: string
  icon: string
  pLanguage: string[]
  createdAt: string
  updatedAt: string
}

export default function InfoManagementPage() {
  const [activeTab, setActiveTab] = useState('contact')
  
  // 联系方式状态
  const [contactData, setContactData] = useState<ContactInfo[]>([])
  const [contactLoading, setContactLoading] = useState(false)
  const [contactModalVisible, setContactModalVisible] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null)
  const [contactForm] = Form.useForm()

  // 群聊信息状态
  const [groupChatData, setGroupChatData] = useState<GroupChat[]>([])
  const [groupChatLoading, setGroupChatLoading] = useState(false)
  const [groupChatModalVisible, setGroupChatModalVisible] = useState(false)
  const [editingGroupChat, setEditingGroupChat] = useState<GroupChat | null>(null)
  const [groupChatForm] = Form.useForm()

  // 媒体平台状态
  const [mediaPlatformData, setMediaPlatformData] = useState<MediaPlatform[]>([])
  const [mediaPlatformLoading, setMediaPlatformLoading] = useState(false)
  const [mediaPlatformModalVisible, setMediaPlatformModalVisible] = useState(false)
  const [editingMediaPlatform, setEditingMediaPlatform] = useState<MediaPlatform | null>(null)
  const [mediaPlatformForm] = Form.useForm()

  // 项目信息状态
  const [projectData, setProjectData] = useState<Project[]>([])
  const [projectLoading, setProjectLoading] = useState(false)
  const [projectModalVisible, setProjectModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [projectForm] = Form.useForm()

  // ==================== 联系方式管理 ====================
  const fetchContactData = async () => {
    setContactLoading(true)
    try {
      const response = await fetch('/api/info-management/contact-info')
      const result = await response.json()
      if (result.success) {
        setContactData(result.data)
      } else {
        message.error(result.error || '获取联系方式失败')
      }
    } catch (error) {
      console.error('获取联系方式失败:', error)
      message.error('获取联系方式失败')
    } finally {
      setContactLoading(false)
    }
  }

  const handleOpenContactModal = (record?: ContactInfo) => {
    if (record) {
      setEditingContact(record)
      contactForm.setFieldsValue(record)
    } else {
      setEditingContact(null)
      contactForm.resetFields()
    }
    setContactModalVisible(true)
  }

  const handleCloseContactModal = () => {
    setContactModalVisible(false)
    setEditingContact(null)
    contactForm.resetFields()
  }

  const handleSubmitContact = async () => {
    try {
      const values = await contactForm.validateFields()
      const url = editingContact
        ? `/api/info-management/contact-info/${editingContact.id}`
        : '/api/info-management/contact-info'
      const method = editingContact ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingContact ? '更新成功' : '创建成功')
        handleCloseContactModal()
        fetchContactData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleDeleteContact = async (id: number) => {
    try {
      const response = await fetch(`/api/info-management/contact-info/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        fetchContactData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const contactColumns: ColumnsType<ContactInfo> = [
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
      width: 120
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '联系信息',
      dataIndex: 'info',
      key: 'info',
      width: 150
    },
    {
      title: '操作链接',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
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
            onClick={() => handleOpenContactModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条联系方式吗？"
            onConfirm={() => handleDeleteContact(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // ==================== 群聊信息管理 ====================
  const fetchGroupChatData = async () => {
    setGroupChatLoading(true)
    try {
      const response = await fetch('/api/info-management/group-chats')
      const result = await response.json()
      if (result.success) {
        setGroupChatData(result.data)
      } else {
        message.error(result.error || '获取群聊信息失败')
      }
    } catch (error) {
      console.error('获取群聊信息失败:', error)
      message.error('获取群聊信息失败')
    } finally {
      setGroupChatLoading(false)
    }
  }

  const handleOpenGroupChatModal = (record?: GroupChat) => {
    if (record) {
      setEditingGroupChat(record)
      groupChatForm.setFieldsValue(record)
    } else {
      setEditingGroupChat(null)
      groupChatForm.resetFields()
    }
    setGroupChatModalVisible(true)
  }

  const handleCloseGroupChatModal = () => {
    setGroupChatModalVisible(false)
    setEditingGroupChat(null)
    groupChatForm.resetFields()
  }

  const handleSubmitGroupChat = async () => {
    try {
      const values = await groupChatForm.validateFields()
      const url = editingGroupChat
        ? `/api/info-management/group-chats/${editingGroupChat.id}`
        : '/api/info-management/group-chats'
      const method = editingGroupChat ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingGroupChat ? '更新成功' : '创建成功')
        handleCloseGroupChatModal()
        fetchGroupChatData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleDeleteGroupChat = async (id: number) => {
    try {
      const response = await fetch(`/api/info-management/group-chats/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        fetchGroupChatData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const groupChatColumns: ColumnsType<GroupChat> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: '群名称',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: '群限制',
      dataIndex: 'limit',
      key: 'limit',
      width: 150
    },
    {
      title: '群号',
      dataIndex: 'groupNumber',
      key: 'groupNumber',
      width: 150
    },
    {
      title: '二维码',
      dataIndex: 'qrcode',
      key: 'qrcode',
      width: 200,
      ellipsis: true
    },
    {
      title: '加入链接',
      dataIndex: 'joinLink',
      key: 'joinLink',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
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
            onClick={() => handleOpenGroupChatModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个群聊吗？"
            onConfirm={() => handleDeleteGroupChat(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // ==================== 媒体平台管理 ====================
  const fetchMediaPlatformData = async () => {
    setMediaPlatformLoading(true)
    try {
      const response = await fetch('/api/info-management/media-platforms')
      const result = await response.json()
      if (result.success) {
        setMediaPlatformData(result.data)
      } else {
        message.error(result.error || '获取媒体平台失败')
      }
    } catch (error) {
      console.error('获取媒体平台失败:', error)
      message.error('获取媒体平台失败')
    } finally {
      setMediaPlatformLoading(false)
    }
  }

  const handleOpenMediaPlatformModal = (record?: MediaPlatform) => {
    if (record) {
      setEditingMediaPlatform(record)
      mediaPlatformForm.setFieldsValue(record)
    } else {
      setEditingMediaPlatform(null)
      mediaPlatformForm.resetFields()
    }
    setMediaPlatformModalVisible(true)
  }

  const handleCloseMediaPlatformModal = () => {
    setMediaPlatformModalVisible(false)
    setEditingMediaPlatform(null)
    mediaPlatformForm.resetFields()
  }

  const handleSubmitMediaPlatform = async () => {
    try {
      const values = await mediaPlatformForm.validateFields()
      const url = editingMediaPlatform
        ? `/api/info-management/media-platforms/${editingMediaPlatform.id}`
        : '/api/info-management/media-platforms'
      const method = editingMediaPlatform ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingMediaPlatform ? '更新成功' : '创建成功')
        handleCloseMediaPlatformModal()
        fetchMediaPlatformData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleDeleteMediaPlatform = async (id: string) => {
    try {
      const response = await fetch(`/api/info-management/media-platforms/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        fetchMediaPlatformData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const mediaPlatformColumns: ColumnsType<MediaPlatform> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: '平台名称',
      dataIndex: 'name',
      key: 'name',
      width: 120
    },
    {
      title: 'Logo',
      dataIndex: 'logo',
      key: 'logo',
      width: 150,
      ellipsis: true
    },
    {
      title: '账号名称',
      dataIndex: 'account',
      key: 'account',
      width: 150
    },
    {
      title: '账号ID',
      dataIndex: 'accountId',
      key: 'accountId',
      width: 150
    },
    {
      title: '二维码标题',
      dataIndex: 'qrcodeTitle',
      key: 'qrcodeTitle',
      width: 150
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
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
            onClick={() => handleOpenMediaPlatformModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个媒体平台吗？"
            onConfirm={() => handleDeleteMediaPlatform(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // ==================== 项目信息管理 ====================
  const fetchProjectData = async () => {
    setProjectLoading(true)
    try {
      const response = await fetch('/api/info-management/projects')
      const result = await response.json()
      if (result.success) {
        setProjectData(result.data)
      } else {
        message.error(result.error || '获取项目信息失败')
      }
    } catch (error) {
      console.error('获取项目信息失败:', error)
      message.error('获取项目信息失败')
    } finally {
      setProjectLoading(false)
    }
  }

  const handleOpenProjectModal = (record?: Project) => {
    if (record) {
      setEditingProject(record)
      projectForm.setFieldsValue({
        ...record,
        pLanguage: record.pLanguage.join(', ')
      })
    } else {
      setEditingProject(null)
      projectForm.resetFields()
    }
    setProjectModalVisible(true)
  }

  const handleCloseProjectModal = () => {
    setProjectModalVisible(false)
    setEditingProject(null)
    projectForm.resetFields()
  }

  const handleSubmitProject = async () => {
    try {
      const values = await projectForm.validateFields()
      const submitData = {
        ...values,
        pLanguage: values.pLanguage.split(',').map((lang: string) => lang.trim())
      }

      const url = editingProject
        ? `/api/info-management/projects/${editingProject.id}`
        : '/api/info-management/projects'
      const method = editingProject ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()
      if (result.success) {
        message.success(editingProject ? '更新成功' : '创建成功')
        handleCloseProjectModal()
        fetchProjectData()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败')
    }
  }

  const handleDeleteProject = async (id: number) => {
    try {
      const response = await fetch(`/api/info-management/projects/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        message.success('删除成功')
        fetchProjectData()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const projectColumns: ColumnsType<Project> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id
    },
    {
      title: '项目标题',
      dataIndex: 'title',
      key: 'title',
      width: 150
    },
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 120
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      width: 100
    },
    {
      title: '编程语言',
      dataIndex: 'pLanguage',
      key: 'pLanguage',
      width: 150,
      render: (languages: string[]) => (
        <>
          {languages.map((lang, index) => (
            <Tag key={index} color="blue">
              {lang}
            </Tag>
          ))}
        </>
      )
    },
    {
      title: '更新日期',
      dataIndex: 'updateDate',
      key: 'updateDate',
      width: 100
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      )
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
            onClick={() => handleOpenProjectModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个项目吗？"
            onConfirm={() => handleDeleteProject(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 初始化数据
  useEffect(() => {
    fetchContactData()
    fetchGroupChatData()
    fetchMediaPlatformData()
    fetchProjectData()
  }, [])

  // 标签页配置
  const tabItems = [
    {
      key: 'contact',
      label: (
        <span>
          <ContactsOutlined />
          联系方式
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>联系方式管理</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenContactModal()}
            >
              新增联系方式
            </Button>
          </div>
          <Table
            columns={contactColumns}
            dataSource={contactData}
            rowKey="id"
            loading={contactLoading}
            scroll={{ x: 1200 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 10
            }}
          />
        </div>
      )
    },
    {
      key: 'groupchat',
      label: (
        <span>
          <TeamOutlined />
          群聊信息
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>群聊信息管理</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenGroupChatModal()}
            >
              新增群聊
            </Button>
          </div>
          <Table
            columns={groupChatColumns}
            dataSource={groupChatData}
            rowKey="id"
            loading={groupChatLoading}
            scroll={{ x: 1400 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 10
            }}
          />
        </div>
      )
    },
    {
      key: 'media',
      label: (
        <span>
          <GlobalOutlined />
          媒体平台
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>媒体平台管理</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenMediaPlatformModal()}
            >
              新增媒体平台
            </Button>
          </div>
          <Table
            columns={mediaPlatformColumns}
            dataSource={mediaPlatformData}
            rowKey="id"
            loading={mediaPlatformLoading}
            scroll={{ x: 1600 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 10
            }}
          />
        </div>
      )
    },
    {
      key: 'project',
      label: (
        <span>
          <ProjectOutlined />
          项目信息
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Title level={5} style={{ margin: 0 }}>项目信息管理</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenProjectModal()}
            >
              新增项目
            </Button>
          </div>
          <Table
            columns={projectColumns}
            dataSource={projectData}
            rowKey="id"
            loading={projectLoading}
            scroll={{ x: 1600 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              defaultPageSize: 10
            }}
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ padding: '0 24px' }}>
      <Card>
        <Title level={4} style={{ marginBottom: 24 }}>
          信息管理中心
        </Title>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* 联系方式模态框 */}
      <Modal
        title={editingContact ? '编辑联系方式' : '新增联系方式'}
        open={contactModalVisible}
        onOk={handleSubmitContact}
        onCancel={handleCloseContactModal}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={contactForm} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="例如：微信" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input placeholder="例如：远程刷机" />
          </Form.Item>
          <Form.Item
            name="info"
            label="联系信息"
            rules={[{ required: true, message: '请输入联系信息' }]}
          >
            <Input placeholder="例如：微信号或QQ号" />
          </Form.Item>
          <Form.Item
            name="action"
            label="操作链接"
            rules={[{ required: true, message: '请输入操作链接' }]}
          >
            <Input placeholder="例如：https://..." />
          </Form.Item>
          <Form.Item
            name="analyticsEvent"
            label="分析事件"
            rules={[{ required: true, message: '请输入分析事件' }]}
          >
            <Input placeholder="例如：在线联系" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 群聊信息模态框 */}
      <Modal
        title={editingGroupChat ? '编辑群聊' : '新增群聊'}
        open={groupChatModalVisible}
        onOk={handleSubmitGroupChat}
        onCancel={handleCloseGroupChatModal}
        width={600}
        okText="提交"
        cancelText="取消"
      >
        <Form form={groupChatForm} layout="vertical">
          <Form.Item
            name="name"
            label="群名称"
            rules={[{ required: true, message: '请输入群名称' }]}
          >
            <Input placeholder="例如：小米玩机交流总群" />
          </Form.Item>
          <Form.Item
            name="limit"
            label="群限制"
            rules={[{ required: true, message: '请输入群限制' }]}
          >
            <Input placeholder="例如：QQ群-500人" />
          </Form.Item>
          <Form.Item
            name="groupNumber"
            label="群号"
            rules={[{ required: true, message: '请输入群号' }]}
          >
            <Input placeholder="例如：676581092" />
          </Form.Item>
          <Form.Item
            name="qrcode"
            label="二维码路径"
            rules={[{ required: true, message: '请输入二维码路径' }]}
          >
            <Input placeholder="例如：/images/qrcodes/qqqun.webp" />
          </Form.Item>
          <Form.Item
            name="joinLink"
            label="加入链接"
            rules={[{ required: true, message: '请输入加入链接' }]}
          >
            <Input placeholder="例如：https://qm.qq.com/..." />
          </Form.Item>
          <Form.Item
            name="analyticsEvent"
            label="分析事件"
            rules={[{ required: true, message: '请输入分析事件' }]}
          >
            <Input placeholder="例如：加入群聊1" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 媒体平台模态框 */}
      <Modal
        title={editingMediaPlatform ? '编辑媒体平台' : '新增媒体平台'}
        open={mediaPlatformModalVisible}
        onOk={handleSubmitMediaPlatform}
        onCancel={handleCloseMediaPlatformModal}
        width={700}
        okText="提交"
        cancelText="取消"
      >
        <Form form={mediaPlatformForm} layout="vertical">
          <Form.Item
            name="id"
            label="平台ID"
            rules={[{ required: true, message: '请输入平台ID' }]}
          >
            <Input placeholder="例如：bilibili" disabled={!!editingMediaPlatform} />
          </Form.Item>
          <Form.Item
            name="name"
            label="平台名称"
            rules={[{ required: true, message: '请输入平台名称' }]}
          >
            <Input placeholder="例如：哔哩哔哩" />
          </Form.Item>
          <Form.Item
            name="logo"
            label="Logo路径"
            rules={[{ required: true, message: '请输入Logo路径' }]}
          >
            <Input placeholder="例如：/images/platforms/bilibili.svg" />
          </Form.Item>
          <Form.Item
            name="account"
            label="账号名称"
            rules={[{ required: true, message: '请输入账号名称' }]}
          >
            <Input placeholder="例如：领创工作室" />
          </Form.Item>
          <Form.Item
            name="accountId"
            label="账号ID"
            rules={[{ required: true, message: '请输入账号ID' }]}
          >
            <Input placeholder="例如：1779662818" />
          </Form.Item>
          <Form.Item
            name="qrcode"
            label="二维码路径"
            rules={[{ required: true, message: '请输入二维码路径' }]}
          >
            <Input placeholder="例如：/images/qrcodes/qr-bilibili.webp" />
          </Form.Item>
          <Form.Item
            name="qrcodeTitle"
            label="二维码标题"
            rules={[{ required: true, message: '请输入二维码标题' }]}
          >
            <Input placeholder="例如：哔哩哔哩 媒体平台" />
          </Form.Item>
          <Form.Item
            name="qrcodeDesc"
            label="二维码描述"
            rules={[{ required: true, message: '请输入二维码描述' }]}
          >
            <TextArea rows={2} placeholder="例如：扫码关注我们的哔哩哔哩账号" />
          </Form.Item>
          <Form.Item
            name="link"
            label="平台链接"
            rules={[{ required: true, message: '请输入平台链接' }]}
          >
            <Input placeholder="例如：https://space.bilibili.com/..." />
          </Form.Item>
          <Form.Item
            name="analyticsEvent"
            label="分析事件"
            rules={[{ required: true, message: '请输入分析事件' }]}
          >
            <Input placeholder="例如：访问哔哩哔哩" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目信息模态框 */}
      <Modal
        title={editingProject ? '编辑项目' : '新增项目'}
        open={projectModalVisible}
        onOk={handleSubmitProject}
        onCancel={handleCloseProjectModal}
        width={700}
        okText="提交"
        cancelText="取消"
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item
            name="id"
            label="项目ID"
            rules={[{ required: true, message: '请输入项目ID' }]}
            tooltip={editingProject ? "修改ID后将创建新记录并删除旧记录" : undefined}
          >
            <Input type="number" placeholder="例如：1" />
          </Form.Item>
          <Form.Item
            name="title"
            label="项目标题"
            rules={[{ required: true, message: '请输入项目标题' }]}
          >
            <Input placeholder="例如：坤坤模块" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类代码"
            rules={[{ required: true, message: '请输入分类代码' }]}
          >
            <Input placeholder="例如：project1" />
          </Form.Item>
          <Form.Item
            name="categoryName"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="例如：玩机工具" />
          </Form.Item>
          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true, message: '请输入平台' }]}
          >
            <Input placeholder="例如：Windows" />
          </Form.Item>
          <Form.Item
            name="updateDate"
            label="更新日期"
            rules={[{ required: true, message: '请输入更新日期' }]}
          >
            <Input placeholder="例如：2025" />
          </Form.Item>
          <Form.Item
            name="link"
            label="项目链接"
            rules={[{ required: true, message: '请输入项目链接' }]}
          >
            <Input placeholder="例如：https://..." />
          </Form.Item>
          <Form.Item
            name="icon"
            label="图标"
            rules={[{ required: true, message: '请输入图标' }]}
          >
            <Input placeholder="例如：fa-tools" />
          </Form.Item>
          <Form.Item
            name="pLanguage"
            label="编程语言"
            rules={[{ required: true, message: '请输入编程语言' }]}
            tooltip="多个语言用逗号分隔，例如：python, pyside6"
          >
            <Input placeholder="例如：python, pyside6" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

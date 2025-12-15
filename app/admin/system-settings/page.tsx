'use client'

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Popconfirm,
  Tag,
  Tabs,
  Typography,
  Row,
  Col,
  Upload,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  HistoryOutlined,
  SettingOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  BellOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  description: string
  type: string
  isSecret: boolean
  isRequired: boolean
  validationRules: any
  createdAt: string
  updatedAt: string
  updatedBy: string
}

interface AuditLog {
  id: string
  settingId: string
  action: string
  oldValue: string
  newValue: string
  reason: string
  userId: string
  timestamp: string
  settingKey: string
  settingCategory: string
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<string[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLogsVisible, setAuditLogsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')

  // 获取系统设置列表
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/system-settings')
      const result = await response.json()
      
      if (result.success) {
        setSettings(result.data.settings)
        
        // 提取分类
        const uniqueCategories = Array.from(new Set(result.data.settings.map((s: SystemSetting) => s.category)))
        setCategories(uniqueCategories)
      } else {
        message.error('获取系统设置失败')
      }
    } catch (error) {
      console.error('获取系统设置失败:', error)
      message.error('获取系统设置失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取审计日志
  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/system-settings/audit-log')
      const result = await response.json()
      
      if (result.success) {
        setAuditLogs(result.data.auditLogs)
      } else {
        message.error('获取审计日志失败')
      }
    } catch (error) {
      console.error('获取审计日志失败:', error)
      message.error('获取审计日志失败')
    }
  }

  useEffect(() => {
    fetchSettings()
    if (activeTab === 'audit') {
      fetchAuditLogs()
    }
  }, [activeTab])

  // 创建或更新设置
  const handleSaveSetting = async (values: any) => {
    try {
      const url = editingSetting 
        ? `/api/system-settings/${editingSetting.id}`
        : '/api/system-settings'
      
      const method = editingSetting ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      const result = await response.json()
      
      if (result.success) {
        message.success(editingSetting ? '更新成功' : '创建成功')
        setModalVisible(false)
        setEditingSetting(null)
        form.resetFields()
        fetchSettings()
      } else {
        message.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      message.error('保存设置失败')
    }
  }

  // 删除设置
  const handleDeleteSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        message.success('删除成功')
        fetchSettings()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除设置失败:', error)
      message.error('删除设置失败')
    }
  }

  // 打开编辑模态框
  const handleEditSetting = (setting: SystemSetting) => {
    setEditingSetting(setting)
    form.setFieldsValue(setting)
    setModalVisible(true)
  }

  // 打开新建模态框
  const handleNewSetting = () => {
    setEditingSetting(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 导出设置
  const handleExportSettings = async () => {
    try {
      const response = await fetch('/api/system-settings/utils?action=export')
      const result = await response.json()
      
      if (result.success) {
        // 创建下载链接
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
        
        const exportFileDefaultName = `system-settings-${new Date().toISOString().split('T')[0]}.json`
        
        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()
        
        message.success('导出成功')
      } else {
        message.error('导出失败')
      }
    } catch (error) {
      console.error('导出设置失败:', error)
      message.error('导出设置失败')
    }
  }

  // 设置表格列定义
  const settingColumns: ColumnsType<SystemSetting> = [
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '键名',
      dataIndex: 'key',
      key: 'key',
      render: (key) => <Text code>{key}</Text>,
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => (
        <Text>
          {record.isSecret ? '***' : (value || '-')}
        </Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: '敏感',
      dataIndex: 'isSecret',
      key: 'isSecret',
      render: (isSecret) => <Tag color={isSecret ? 'red' : 'green'}>{isSecret ? '是' : '否'}</Tag>,
    },
    {
      title: '必需',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired) => <Tag color={isRequired ? 'orange' : 'default'}>{isRequired ? '是' : '否'}</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditSetting(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个设置吗？"
            onConfirm={() => handleDeleteSetting(record.id)}
            disabled={record.isRequired}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              disabled={record.isRequired}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  // 审计日志表格列定义
  const auditLogColumns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: '设置',
      key: 'setting',
      render: (_, record) => (
        <div>
          <Tag color="blue">{record.settingCategory}</Tag>
          <Text code>{record.settingKey}</Text>
        </div>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const colors = {
          create: 'green',
          update: 'blue',
          delete: 'red'
        }
        return <Tag color={colors[action as keyof typeof colors]}>{action}</Tag>
      },
    },
    {
      title: '旧值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (value) => value ? <Text code>{value}</Text> : '-',
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (value) => value ? <Text code>{value}</Text> : '-',
    },
    {
      title: '操作人',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => <Text>{userId}</Text>,
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>系统设置</Title>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <SettingOutlined />
              环境变量管理
            </span>
          } 
          key="settings"
        >
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleNewSetting}
                >
                  新建设置
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={handleExportSettings}
                >
                  导出设置
                </Button>
              </Space>
            </div>
            
            <Table 
              columns={settingColumns} 
              dataSource={settings} 
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <HistoryOutlined />
              审计日志
            </span>
          } 
          key="audit"
        >
          <Card>
            <Table 
              columns={auditLogColumns} 
              dataSource={auditLogs} 
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingSetting ? '编辑设置' : '新建设置'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingSetting(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSetting}
        >
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Select placeholder="选择或输入分类">
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="key"
            label="键名"
            rules={[{ required: true, message: '请输入键名' }]}
          >
            <Input placeholder="请输入键名" />
          </Form.Item>
          
          <Form.Item
            name="value"
            label="值"
          >
            <TextArea rows={4} placeholder="请输入值" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="数据类型"
            initialValue="string"
          >
            <Select>
              <Option value="string">字符串</Option>
              <Option value="number">数字</Option>
              <Option value="boolean">布尔值</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="isSecret"
            label="敏感信息"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="isRequired"
            label="必需项"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button 
                onClick={() => {
                  setModalVisible(false)
                  setEditingSetting(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
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
  Divider,
  Pagination,
  InputNumber,
  DatePicker,
  Spin
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
  BellOutlined,
  CloseOutlined,
  RestOutlined,
  CheckOutlined,
  LogoutOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

// 分类配置，用于定义分类的显示名称、图标和顺序
const categoryConfig: { [key: string]: { name: string; icon: React.ReactNode; order: number } } = {
  'database': { name: '数据库配置', icon: <DatabaseOutlined />, order: 1 },
  'security': { name: '安全配置', icon: <SecurityScanOutlined />, order: 2 },
  'api': { name: 'API配置', icon: <SettingOutlined />, order: 3 },
  'system': { name: '系统配置', icon: <SettingOutlined />, order: 4 },
  'logging': { name: '日志配置', icon: <FileTextOutlined />, order: 5 },
  'notification': { name: '通知配置', icon: <BellOutlined />, order: 6 },
  'other': { name: '其他配置', icon: <SettingOutlined />, order: 7 }
}

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

interface DeviceInfo {
  device: {
    model: string
    type: string
    vendor: string
  }
  os: {
    name: string
    version: string
  }
  browser: {
    name: string
    version: string
  }
  engine: {
    name: string
    version: string
  }
}

interface NetworkInfo {
  language: string
  referer: string
  networkType: string
  carrier: string
}

interface LoginLog {
  id: string
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  deviceInfo: DeviceInfo
  networkInfo: NetworkInfo
  loginTime: string
  sessionId: string
  isActive: boolean
  createdAt: string
}

interface LoginLogPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LoginLogFilterParams {
  email?: string
  ipAddress?: string
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  isActive?: boolean
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
  // 实时编辑状态管理
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<any>(null)
  const [editForm] = Form.useForm()
  // 确认对话框状态
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [changeReason, setChangeReason] = useState('')
  const [settingToUpdate, setSettingToUpdate] = useState<SystemSetting | null>(null)
  const [newValueToSave, setNewValueToSave] = useState<any>(null)
  // 重启提示状态
  const [restartRequired, setRestartRequired] = useState(false)
  const [restartRequiredSettings, setRestartRequiredSettings] = useState<SystemSetting[]>([])
  // 查看历史记录对话框
  const [historyModalVisible, setHistoryModalVisible] = useState(false)
  const [selectedSettingId, setSelectedSettingId] = useState<string | null>(null)
  // 搜索和筛选
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  // 分页
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  // 错误状态
  const [error, setError] = useState<string | null>(null)

  // 登录日志相关状态
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loginLogLoading, setLoginLogLoading] = useState(false)
  const [loginLogPagination, setLoginLogPagination] = useState<LoginLogPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [loginLogFilterParams, setLoginLogFilterParams] = useState<LoginLogFilterParams>({})
  const [selectedLoginLog, setSelectedLoginLog] = useState<LoginLog | null>(null)
  const [loginLogDetailModalVisible, setLoginLogDetailModalVisible] = useState(false)
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false)
  const [logoutSessionId, setLogoutSessionId] = useState<string>('')

  // 获取系统设置列表
  const fetchSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = '/api/system-settings?page=' + currentPage + '&limit=' + pageSize
      if (searchText) {
        url += '&search=' + encodeURIComponent(searchText)
      }
      if (selectedCategory) {
        url += '&category=' + encodeURIComponent(selectedCategory)
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }
      const result = await response.json()

      if (result.success) {
        setSettings(result.data.settings)
      } else {
        message.error(result.error || '获取系统设置失败')
        setError(result.error || '获取系统设置失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('获取系统设置失败:', error)
      const errorMessage = error.message || '获取系统设置失败，请检查网络连接'
      message.error(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 获取审计日志
  const fetchAuditLogs = async (settingId?: string) => {
    try {
      const url = settingId ? `/api/system-settings/audit-log?settingId=${settingId}` : '/api/system-settings/audit-log'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }
      const result = await response.json()

      if (result.success) {
        setAuditLogs(result.data.auditLogs)
      } else {
        message.error(result.error || '获取审计日志失败')
      }
    } catch (error: any) {
      console.error('获取审计日志失败:', error)
      message.error(error.message || '获取审计日志失败')
    }
  }

  // 获取登录日志列表
  const fetchLoginLogs = async (page: number = 1, limit: number = 20, filters?: LoginLogFilterParams) => {
    setLoginLogLoading(true)
    try {
      const url = new URL('/api/login-logs', window.location.origin)

      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', limit.toString())

      if (filters?.email) {
        url.searchParams.set('email', filters.email)
      }

      if (filters?.ipAddress) {
        url.searchParams.set('ipAddress', filters.ipAddress)
      }

      if (filters?.dateRange) {
        if (filters.dateRange[0]) {
          url.searchParams.set('startDate', filters.dateRange[0].startOf('day').toISOString())
        }
        if (filters.dateRange[1]) {
          url.searchParams.set('endDate', filters.dateRange[1].endOf('day').toISOString())
        }
      }

      if (filters?.isActive !== undefined) {
        url.searchParams.set('isActive', filters.isActive.toString())
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        console.error('响应状态码:', response.status, response.statusText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('API响应数据:', data)

      if (data.success) {
        setLoginLogs(data.data.logs)
        setLoginLogPagination(data.data.pagination)
      } else {
        console.error('API返回错误:', data.error)
        message.error(`获取登录日志失败: ${data.error || '未知错误'}`)
      }
    } catch (error: any) {
      console.error('获取登录日志失败:', error)
      message.error(`获取登录日志失败: ${error.message || '网络错误'}`)
    } finally {
      setLoginLogLoading(false)
    }
  }

  // 处理登录日志分页变化
  const handleLoginLogPageChange = (page: number, size: number) => {
    setLoginLogPagination(prev => ({ ...prev, page, limit: size }))
    fetchLoginLogs(page, size, loginLogFilterParams)
  }

  // 处理强制登出
  const handleForceLogout = async () => {
    if (!logoutSessionId) return

    try {
      const response = await fetch('/api/login-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: logoutSessionId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        message.success('强制登出成功')
        setLogoutConfirmVisible(false)
        setLogoutSessionId('')
        fetchLoginLogs(loginLogPagination.page, loginLogPagination.limit, loginLogFilterParams)
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      } else {
        message.error(result.error || '强制登出失败')
      }
    } catch (error: any) {
      console.error('强制登出失败:', error)
      message.error('强制登出失败')
    }
  }

  // 处理删除登录日志
  const handleDeleteLoginLog = async (id: string) => {
    if (!id) return

    try {
      const response = await fetch('/api/login-logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        message.success('删除成功')
        fetchLoginLogs(loginLogPagination.page, loginLogPagination.limit, loginLogFilterParams)
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error: any) {
      console.error('删除登录日志失败:', error)
      message.error('删除失败')
    }
  }

  // 从设置列表中提取唯一分类
  useEffect(() => {
    if (settings.length > 0) {
      const uniqueCategories = Array.from(new Set(settings.map((s: SystemSetting) => s.category))) as string[]
      setCategories(uniqueCategories)
    }
  }, [settings])

  useEffect(() => {
    fetchSettings()
    if (activeTab === 'audit') {
      fetchAuditLogs()
    } else if (activeTab === 'login-logs') {
      fetchLoginLogs()
    }
  }, [activeTab, searchText, selectedCategory, currentPage, pageSize])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1) // 搜索时重置页码
  }

  // 处理分类筛选
  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value)
    setCurrentPage(1) // 筛选时重置页码
  }

  // 处理分页变化
  const handlePageChange = (page: number, size: number) => {
    setCurrentPage(page)
    setPageSize(size)
  }

  // 根据类型渲染不同的表单控件
  const renderFormControl = (type: string, name: string, value: any, validationRules?: any) => {
    switch (type) {
      case 'boolean':
        return (
          <Form.Item
            name={name}
            valuePropName="checked"
            initialValue={value === 'true' || value === true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        )
      case 'number':
        const min = validationRules?.min || -Infinity
        const max = validationRules?.max || Infinity
        const step = validationRules?.step || 1
        return (
          <Form.Item
            name={name}
            initialValue={value ? Number(value) : 0}
            rules={[{ type: 'number', message: '请输入数字', min, max }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入数字"
              min={min}
              max={max}
              step={step}
            />
          </Form.Item>
        )
      case 'json':
        return (
          <Form.Item
            name={name}
            initialValue={value ? JSON.stringify(JSON.parse(value), null, 2) : ''}
            rules={[{
              validator: (_, val) => {
                if (!val) return Promise.resolve()
                try {
                  JSON.parse(val)
                  return Promise.resolve()
                } catch (error: any) {
                  return Promise.reject(new Error('JSON格式不正确'))
                }
              }
            }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入JSON格式"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </Form.Item>
        )
      default:
        // 如果有枚举值，使用Select控件
        if (validationRules?.enum && Array.isArray(validationRules.enum)) {
          return (
            <Form.Item
              name={name}
              initialValue={value}
              rules={[{ required: validationRules?.required, message: '请选择值' }]}
            >
              <Select placeholder="请选择值">
                {validationRules.enum.map((option: any) => (
                  <Option key={option} value={option}>{option}</Option>
                ))}
              </Select>
            </Form.Item>
          )
        }
        // 否则使用普通Input
        return (
          <Form.Item
            name={name}
            initialValue={value}
            rules={[
              { required: validationRules?.required, message: '请输入值' },
              { min: validationRules?.minLength, message: `最少${validationRules.minLength}个字符` },
              { max: validationRules?.maxLength, message: `最多${validationRules.maxLength}个字符` },
              { pattern: validationRules?.pattern, message: validationRules?.patternMessage || '格式不正确' }
            ].filter(Boolean)}
          >
            <Input
              placeholder="请输入值"
              type={validationRules?.type === 'password' ? 'password' : 'text'}
            />
          </Form.Item>
        )
    }
  }

  // 处理表单提交，根据类型转换值
  const handleFormSubmit = async (values: any) => {
    setLoading(true)
    try {
      // 根据类型转换值
      let processedValues = { ...values }

      // 前端验证
      if (processedValues.type === 'json') {
        try {
          // 验证JSON格式
          JSON.parse(processedValues.value)
        } catch (error: any) {
          message.error('JSON格式不正确')
          return
        }
      }

      if (processedValues.type === 'number') {
        const numValue = Number(processedValues.value)
        if (isNaN(numValue)) {
          message.error('请输入有效的数字')
          return
        }
        processedValues.value = numValue.toString()
      } else if (processedValues.type === 'boolean') {
        processedValues.value = processedValues.value ? 'true' : 'false'
      }

      await handleSaveSetting(processedValues)
    } catch (error: any) {
      console.error('保存设置失败:', error)
      message.error('保存设置失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

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
    } catch (error: any) {
      console.error('保存设置失败:', error)
      message.error('保存设置失败，请稍后重试')
    }
  }

  // 删除设置
  const handleDeleteSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`)
      }
      const result = await response.json()

      if (result.success) {
        message.success('删除成功')
        fetchSettings()
      } else {
        message.error(result.error || '删除失败')
      }
    } catch (error: any) {
      console.error('删除设置失败:', error)
      message.error(error.message || '删除设置失败')
    }
  }

  // 开始实时编辑
  const handleStartEdit = (setting: SystemSetting) => {
    setEditingId(setting.id)
    let initialValue: any = setting.value
    if (setting.type === 'boolean') {
      initialValue = setting.value === 'true'
    } else if (setting.type === 'number') {
      initialValue = Number(setting.value)
    } else if (setting.type === 'json') {
      initialValue = JSON.stringify(JSON.parse(setting.value), null, 2)
    }
    setEditingValue(initialValue)
    editForm.setFieldsValue({ value: initialValue })
  }

  // 保存实时编辑
  const handleSaveEdit = async (setting: SystemSetting) => {
    // 验证JSON格式
    if (setting.type === 'json') {
      try {
        JSON.parse(editingValue)
      } catch (error: any) {
        message.error('JSON格式不正确')
        return
      }
    }

    // 验证数字范围
    if (setting.type === 'number') {
      const numValue = Number(editingValue)
      if (isNaN(numValue)) {
        message.error('请输入有效的数字')
        return
      }
      if (numValue < (setting.validationRules?.min || -Infinity) || numValue > (setting.validationRules?.max || Infinity)) {
        message.error(`数字必须在${setting.validationRules?.min || '-∞'}到${setting.validationRules?.max || '∞'}之间`)
        return
      }
    }

    // 打开确认对话框
    setSettingToUpdate(setting)
    setNewValueToSave(editingValue)
    setConfirmModalVisible(true)
  }

  // 查看设置历史记录
  const handleViewHistory = async (setting: SystemSetting) => {
    setSelectedSettingId(setting.id)
    await fetchAuditLogs(setting.id)
    setHistoryModalVisible(true)
  }

  // 检查是否需要重启
  const checkRestartRequired = (setting: SystemSetting) => {
    // 这里可以根据设置的key或其他属性判断是否需要重启
    // 例如：某些特定的配置项需要重启才能生效
    const restartRequiredKeys = [
      'API_KEY',
      'DATABASE_URL',
      'ALLOWED_ORIGINS',
      'SYSTEM_SETTINGS_DATABASE_URL',
      'ACTIVATION_CODES_DATABASE_URL',
      'ENABLE_API_KEY_AUTH',
      'API_KEY_EXPIRATION_HOURS',
      'ENABLE_RATE_LIMITING',
      'RATE_LIMIT_MAX_REQUESTS',
      'RATE_LIMIT_WINDOW_MS',
      'ENABLE_CORS_FOR_API_TOOLS',
      'ALLOWED_ORIGINS',
      'JWT_SECRET',
      'ENABLE_USER_BEHAVIOR_API_SECURITY',
      'ENABLE_REQUEST_SIGNATURE',
      'ENABLE_STRICT_USER_AGENT_CHECK',
      'JWT_EXPIRATION_HOURS',
      'DATABASE_URL',
      'SYSTEM_SETTINGS_DATABASE_URL',
      'ACTIVATION_CODES_DATABASE_URL',
      'USER_BEHAVIOR_API_KEY',
      'USER_BEHAVIOR_RECORD_API_KEY',
      'WANJIGUANJIA_APP_ID',
      'WANJIGUANJIA_APP_SECRET',
      'ALLOWED_USER_AGENTS',
      'ALLOWED_CLIENT_ORIGINS',
      'REQUEST_SIGNATURE_SECRET'
    ]
    return restartRequiredKeys.includes(setting.key)
  }

  // 确认保存编辑
  const handleConfirmSave = async () => {
    if (!settingToUpdate) return

    try {
      let valueToSave = newValueToSave

      // 根据类型转换值
      if (settingToUpdate.type === 'boolean') {
        valueToSave = valueToSave ? 'true' : 'false'
      } else if (settingToUpdate.type === 'number') {
        valueToSave = valueToSave.toString()
      } else if (settingToUpdate.type === 'json') {
        try {
          // 验证JSON格式
          JSON.parse(valueToSave)
        } catch (error: any) {
          message.error('JSON格式不正确')
          return
        }
      }

      const response = await fetch(`/api/system-settings/${settingToUpdate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settingToUpdate,
          value: valueToSave,
          reason: changeReason // 添加变更原因
        }),
      })

      const result = await response.json()

      if (result.success) {
        message.success('更新成功')

        // 检查是否需要重启
        if (checkRestartRequired(settingToUpdate)) {
          setRestartRequired(true)
          setRestartRequiredSettings(prev => [...prev, settingToUpdate])
        }

        setEditingId(null)
        setEditingValue(null)
        setConfirmModalVisible(false)
        setChangeReason('')
        setSettingToUpdate(null)
        setNewValueToSave(null)
        fetchSettings()
      } else {
        message.error(result.error || '更新失败')
      }
    } catch (error: any) {
      console.error('保存设置失败:', error)
      message.error('保存设置失败')
    }
  }

  // 取消实时编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingValue(null)
    editForm.resetFields()
  }

  // 处理实时编辑值变化
  const handleEditValueChange = (e: any) => {
    let value = e
    if (e.target) {
      value = e.target.value
    }
    setEditingValue(value)
  }

  // 处理新建设置
  const handleNewSetting = () => {
    setEditingSetting(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 处理编辑设置
  const handleEditSetting = (setting: SystemSetting) => {
    setEditingSetting(setting)
    form.setFieldsValue({
      category: setting.category,
      key: setting.key,
      value: setting.type === 'json' && setting.value ? JSON.stringify(JSON.parse(setting.value), null, 2) : setting.value,
      description: setting.description,
      type: setting.type,
      isSecret: setting.isSecret,
      isRequired: setting.isRequired
    })
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
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

        const exportFileDefaultName = `system-settings-${new Date().toISOString().split('T')[0]}.json`

        const linkElement = document.createElement('a')
        linkElement.setAttribute('href', dataUri)
        linkElement.setAttribute('download', exportFileDefaultName)
        linkElement.click()

        message.success('导出成功')
      } else {
        message.error('导出失败')
      }
    } catch (error: any) {
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

  // 登录日志表格列定义
  const loginLogColumns: ColumnsType<LoginLog> = [
    {
      title: '登录账号',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email) => <Text strong>{email}</Text>
    },
    {
      title: '登录IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 150
    },
    {
      title: '设备类型',
      dataIndex: 'deviceInfo',
      key: 'deviceType',
      width: 120,
      render: (deviceInfo: DeviceInfo) => {
        const deviceType = deviceInfo.device.type || 'Unknown'
        return <Tag color={deviceType === 'Unknown' ? 'default' : 'blue'}>{deviceType}</Tag>
      }
    },
    {
      title: '操作系统',
      dataIndex: 'deviceInfo',
      key: 'os',
      width: 180,
      render: (deviceInfo: DeviceInfo) => {
        const { name, version } = deviceInfo.os
        return `${name} ${version}`
      }
    },
    {
      title: '浏览器',
      dataIndex: 'deviceInfo',
      key: 'browser',
      width: 180,
      render: (deviceInfo: DeviceInfo) => {
        const { name, version } = deviceInfo.browser
        return `${name} ${version}`
      }
    },
    {
      title: '登录时间',
      dataIndex: 'loginTime',
      key: 'loginTime',
      width: 200,
      sorter: (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime(),
      render: (loginTime) => dayjs(loginTime).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '会话状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '活跃' : '已登出'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: LoginLog) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLoginLog(record)
              setLoginLogDetailModalVisible(true)
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            danger
            icon={<LogoutOutlined />}
            onClick={() => {
              setLogoutSessionId(record.sessionId)
              setLogoutConfirmVisible(true)
            }}
            disabled={!record.isActive}
          >
            退出登录
          </Button>
          <Popconfirm
            title="确定要删除这条登录日志吗？"
            onConfirm={() => handleDeleteLoginLog(record.id)}
            okText="确定"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 审计日志表格列定义
  const auditLogColumns: ColumnsType<AuditLog> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      sortDirections: ['descend', 'ascend'],
      width: 200,
    },
    {
      title: '设置',
      key: 'setting',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Tag color="blue">{categoryConfig[record.settingCategory]?.name || record.settingCategory}</Tag>
          <Text code>{record.settingKey}</Text>
        </div>
      ),
      width: 200,
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
        const labels = {
          create: '创建',
          update: '更新',
          delete: '删除'
        }
        return <Tag color={colors[action as keyof typeof colors]}>{labels[action as keyof typeof labels]}</Tag>
      },
      filters: [
        { text: '创建', value: 'create' },
        { text: '更新', value: 'update' },
        { text: '删除', value: 'delete' },
      ],
      onFilter: (value, record) => record.action === value,
      width: 100,
    },
    {
      title: '旧值',
      dataIndex: 'oldValue',
      key: 'oldValue',
      render: (value) => value ? <Text code style={{ fontSize: '12px', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Text> : '-',
      width: 150,
    },
    {
      title: '新值',
      dataIndex: 'newValue',
      key: 'newValue',
      render: (value) => value ? <Text code style={{ fontSize: '12px', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Text> : '-',
      width: 150,
    },
    {
      title: '变更原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reason ? <div style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reason}</div> : '-',
      width: 200,
    },
    {
      title: '操作人',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => <Text>{userId || '系统'}</Text>,
      width: 100,
    },
    {
      title: '查看详情',
      key: 'detail',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            // 这里可以添加查看详情的逻辑
            Modal.info({
              title: '变更详情',
              width: 600,
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>设置信息</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                      <div style={{ fontWeight: 'bold' }}>分类：</div>
                      <div>{categoryConfig[record.settingCategory]?.name || record.settingCategory}</div>
                      <div style={{ fontWeight: 'bold' }}>键名：</div>
                      <div>{record.settingKey}</div>
                      <div style={{ fontWeight: 'bold' }}>操作：</div>
                      <div>{record.action}</div>
                      <div style={{ fontWeight: 'bold' }}>时间：</div>
                      <div>{new Date(record.timestamp).toLocaleString()}</div>
                      <div style={{ fontWeight: 'bold' }}>操作人：</div>
                      <div>{record.userId || '系统'}</div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>变更内容</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>旧值</div>
                        <div style={{ padding: '12px', backgroundColor: '#fff2f0', borderRadius: '6px', border: '1px solid #ffccc7', maxHeight: '150px', overflow: 'auto' }}>
                          <Text code>{record.oldValue || '-'}</Text>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>新值</div>
                        <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f', maxHeight: '150px', overflow: 'auto' }}>
                          <Text code>{record.newValue || '-'}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0' }}>变更原因</h4>
                    <div style={{ padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '6px', border: '1px solid #adc6ff' }}>
                      {record.reason || '-'}
                    </div>
                  </div>
                </div>
              )
            })
          }}
        >
          详情
        </Button>
      ),
      width: 80,
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
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleNewSetting}
                loading={loading}
              >
                新建设置
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportSettings}
                loading={loading}
              >
                导出设置
              </Button>
            </Space>

            <Space>
              <Select
                placeholder="选择分类"
                value={selectedCategory}
                onChange={handleCategoryFilter}
                style={{ width: 150 }}
                allowClear
                loading={loading}
              >
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{categoryConfig[cat]?.name || cat}</Option>
                ))}
              </Select>
              <Input.Search
                placeholder="搜索设置键名"
                allowClear
                enterButton
                size="middle"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 200 }}
                loading={loading}
              />
            </Space>
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff2f0', border: '1px solid #ffccc7', borderRadius: '4px', color: '#ff4d4f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CloseOutlined style={{ fontSize: '16px', cursor: 'pointer' }} onClick={() => setError(null)} />
              {error}
            </div>
          )}

          {/* 分类卡片布局 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loading ? (
              <Card loading={true} style={{ minHeight: '200px' }} />
            ) : (
              <>
                {categories
                  .filter(cat => !selectedCategory || cat === selectedCategory)
                  .sort((a, b) => (categoryConfig[a]?.order || 100) - (categoryConfig[b]?.order || 100))
                  .map(category => {
                    const categorySettings = settings.filter(setting => setting.category === category)
                    if (categorySettings.length === 0) return null

                    const config = categoryConfig[category] || { name: category, icon: <SettingOutlined />, order: 100 }

                    return (
                      <Card
                        key={category}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                            {config.icon}
                            {config.name}
                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>({categorySettings.length})</span>
                          </div>
                        }
                        bordered={true}
                        loading={loading}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                          {categorySettings.map(setting => (
                            <div key={setting.id} style={{ padding: '16px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#fff', transition: 'all 0.3s', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#262626', fontSize: '14px' }}>{setting.key}</div>
                                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>{setting.description || '无描述'}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <Tag color={setting.isSecret ? 'red' : 'green'}>{setting.isSecret ? '敏感' : '普通'}</Tag>
                                  {checkRestartRequired(setting) && (
                                    <Tag color="orange">需要重启</Tag>
                                  )}
                                </div>
                              </div>

                              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #f0f0f0' }}>
                                {editingId === setting.id ? (
                                  <Form form={editForm} layout="vertical">
                                    <div style={{ marginBottom: '16px' }}>
                                      {setting.type === 'boolean' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <Switch
                                            checked={editingValue}
                                            onChange={handleEditValueChange}
                                            checkedChildren="启用"
                                            unCheckedChildren="禁用"
                                            size="small"
                                          />
                                          <span>{editingValue ? '启用' : '禁用'}</span>
                                        </div>
                                      ) : setting.type === 'number' ? (
                                        <InputNumber
                                          style={{ width: '100%' }}
                                          value={editingValue}
                                          onChange={handleEditValueChange}
                                          placeholder="请输入数字"
                                          min={setting.validationRules?.min || -Infinity}
                                          max={setting.validationRules?.max || Infinity}
                                          step={setting.validationRules?.step || 1}
                                          size="small"
                                        />
                                      ) : setting.type === 'json' ? (
                                        <TextArea
                                          rows={4}
                                          value={editingValue}
                                          onChange={handleEditValueChange}
                                          placeholder="请输入JSON格式"
                                          style={{ fontFamily: 'monospace', fontSize: '12px' }}
                                          size="small"
                                        />
                                      ) : setting.validationRules?.enum && Array.isArray(setting.validationRules.enum) ? (
                                        <Select
                                          style={{ width: '100%' }}
                                          value={editingValue}
                                          onChange={handleEditValueChange}
                                          placeholder="请选择值"
                                          size="small"
                                        >
                                          {setting.validationRules.enum.map((option: any) => (
                                            <Option key={option} value={option}>{option}</Option>
                                          ))}
                                        </Select>
                                      ) : (
                                        <Input
                                          value={editingValue}
                                          onChange={handleEditValueChange}
                                          placeholder="请输入值"
                                          type={setting.validationRules?.type === 'password' ? 'password' : 'text'}
                                          size="small"
                                        />
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                      <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => handleSaveEdit(setting)}
                                      >
                                        保存
                                      </Button>
                                      <Button
                                        size="small"
                                        onClick={handleCancelEdit}
                                      >
                                        取消
                                      </Button>
                                    </div>
                                  </Form>
                                ) : (
                                  <div>
                                    {setting.isSecret ? (
                                      <Text code>{setting.isSecret ? '***' : setting.value || '-'}</Text>
                                    ) : setting.type === 'boolean' ? (
                                      <Tag color={setting.value === 'true' ? 'green' : 'red'}>
                                        {setting.value === 'true' ? '启用' : '禁用'}
                                      </Tag>
                                    ) : setting.type === 'json' ? (
                                      <pre style={{ margin: 0, fontSize: '12px', maxWidth: '280px', overflow: 'auto', fontFamily: 'monospace', lineHeight: '1.4' }}>
                                        {JSON.stringify(JSON.parse(setting.value), null, 2)}
                                      </pre>
                                    ) : (
                                      <Text code>{setting.value || '-'}</Text>
                                    )}
                                  </div>
                                )}
                              </div>

                              {editingId !== setting.id && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <Button
                                    type="link"
                                    icon={<HistoryOutlined />}
                                    onClick={() => handleViewHistory(setting)}
                                    size="small"
                                  >
                                    历史
                                  </Button>
                                  <Button
                                    type="link"
                                    icon={<EditOutlined />}
                                    onClick={() => handleStartEdit(setting)}
                                    size="small"
                                  >
                                    编辑
                                  </Button>
                                  <Popconfirm
                                    title="确定要删除这个设置吗？"
                                    onConfirm={() => handleDeleteSetting(setting.id)}
                                    disabled={setting.isRequired}
                                  >
                                    <Button
                                      type="link"
                                      danger
                                      icon={<DeleteOutlined />}
                                      disabled={setting.isRequired}
                                      size="small"
                                    >
                                      删除
                                    </Button>
                                  </Popconfirm>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Card>
                    )
                  })}

                {/* 空状态处理 */}
                {categories.filter(cat => !selectedCategory || cat === selectedCategory).length === 0 && (
                  <Card bordered={true} style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <div style={{ marginBottom: '16px', fontSize: '48px' }}>📋</div>
                    <h3 style={{ marginBottom: '8px', color: '#262626' }}>暂无配置项</h3>
                    <p style={{ color: '#666', marginBottom: '24px' }}>当前没有找到符合条件的系统设置项</p>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleNewSetting}>
                      新建设置
                    </Button>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* 分页组件 */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={settings.length}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['10', '20', '50', '100']}
              showTotal={(total) => `共 ${total} 条记录`}
            />
          </div>
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

        <TabPane
          tab={
            <span>
              <SecurityScanOutlined />
              登录日志
            </span>
          }
          key="login-logs"
        >
          {/* 登录日志筛选器 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="搜索邮箱"
                  prefix={<SearchOutlined />}
                  value={loginLogFilterParams.email}
                  onChange={(e) => setLoginLogFilterParams(prev => ({ ...prev, email: e.target.value }))}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="搜索IP地址"
                  prefix={<SearchOutlined />}
                  value={loginLogFilterParams.ipAddress}
                  onChange={(e) => setLoginLogFilterParams(prev => ({ ...prev, ipAddress: e.target.value }))}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <RangePicker
                  style={{ width: '100%' }}
                  placeholder={['开始日期', '结束日期']}
                  value={loginLogFilterParams.dateRange}
                  onChange={(dates) => setLoginLogFilterParams(prev => ({ ...prev, dateRange: dates }))}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="会话状态"
                  value={loginLogFilterParams.isActive}
                  onChange={(value) => setLoginLogFilterParams(prev => ({ ...prev, isActive: value }))}
                  allowClear
                >
                  <Option value={true}>活跃</Option>
                  <Option value={false}>已登出</Option>
                </Select>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    onClick={() => fetchLoginLogs(loginLogPagination.page, loginLogPagination.limit, loginLogFilterParams)}
                    icon={<SearchOutlined />}
                  >
                    搜索
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => fetchLoginLogs(loginLogPagination.page, loginLogPagination.limit)}
                    icon={<ReloadOutlined />}
                  >
                    刷新数据
                  </Button>
                  <Button
                    onClick={() => {
                      setLoginLogFilterParams({})
                      fetchLoginLogs(1, loginLogPagination.limit)
                    }}
                  >
                    重置筛选
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 登录日志表格 */}
          <Card>
            <Table
              columns={loginLogColumns}
              dataSource={loginLogs}
              rowKey="id"
              loading={loginLogLoading}
              pagination={{
                current: loginLogPagination.page,
                pageSize: loginLogPagination.limit,
                total: loginLogPagination.total,
                onChange: handleLoginLogPageChange,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>

          {/* 登录详情模态框 */}
          <Modal
            title="登录详情"
            open={loginLogDetailModalVisible}
            onCancel={() => setLoginLogDetailModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setLoginLogDetailModalVisible(false)}>
                关闭
              </Button>
            ]}
            width={700}
          >
            {selectedLoginLog && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                  <Text strong>登录账号：</Text>
                  <Text>{selectedLoginLog.email}</Text>

                  <Text strong>用户ID：</Text>
                  <Text code>{selectedLoginLog.userId}</Text>

                  <Text strong>登录IP：</Text>
                  <Text>{selectedLoginLog.ipAddress}</Text>

                  <Text strong>登录时间：</Text>
                  <Text>{dayjs(selectedLoginLog.loginTime).format('YYYY-MM-DD HH:mm:ss')}</Text>

                  <Text strong>会话ID：</Text>
                  <Text code>{selectedLoginLog.sessionId}</Text>

                  <Text strong>会话状态：</Text>
                  <Tag color={selectedLoginLog.isActive ? 'green' : 'red'}>
                    {selectedLoginLog.isActive ? '活跃' : '已登出'}
                  </Tag>
                </div>

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>设备信息：</Text>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 120px 1fr', gap: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                    <Text strong>设备类型：</Text>
                    <Text>{selectedLoginLog.deviceInfo.device.type || 'Unknown'}</Text>
                    <Text strong>设备型号：</Text>
                    <Text>{selectedLoginLog.deviceInfo.device.model || 'Unknown'}</Text>

                    <Text strong>设备厂商：</Text>
                    <Text>{selectedLoginLog.deviceInfo.device.vendor || 'Unknown'}</Text>
                    <Text strong>操作系统：</Text>
                    <Text>{selectedLoginLog.deviceInfo.os.name} {selectedLoginLog.deviceInfo.os.version}</Text>

                    <Text strong>浏览器：</Text>
                    <Text>{selectedLoginLog.deviceInfo.browser.name} {selectedLoginLog.deviceInfo.browser.version}</Text>
                    <Text strong>渲染引擎：</Text>
                    <Text>{selectedLoginLog.deviceInfo.engine.name} {selectedLoginLog.deviceInfo.engine.version}</Text>
                  </div>
                </div>

                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>网络信息：</Text>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 6 }}>
                    <Text strong>语言：</Text>
                    <Text>{selectedLoginLog.networkInfo.language || 'Unknown'}</Text>
                    <Text strong>来源页面：</Text>
                    <Text>{selectedLoginLog.networkInfo.referer || 'Direct'}</Text>
                    <Text strong>网络类型：</Text>
                    <Text>{selectedLoginLog.networkInfo.networkType || 'Unknown'}</Text>
                    <Text strong>运营商：</Text>
                    <Text>{selectedLoginLog.networkInfo.carrier || 'Unknown'}</Text>
                  </div>
                </div>
              </div>
            )}
          </Modal>

          {/* 强制登出确认对话框 */}
          <Modal
            title="确认强制登出"
            open={logoutConfirmVisible}
            onOk={handleForceLogout}
            onCancel={() => setLogoutConfirmVisible(false)}
            okText="确认"
            cancelText="取消"
            okType="danger"
          >
            <p>您确定要强制登出该设备吗？该操作将立即终止此会话，用户需要重新登录。</p>
            <p style={{ color: '#ff4d4f', marginTop: 8 }}>注意：此操作不可撤销，请谨慎操作！</p>
          </Modal>
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
          onFinish={handleFormSubmit}
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
            <Select onChange={() => form.setFieldsValue({ value: '' })}>
              <Option value="string">字符串</Option>
              <Option value="number">数字</Option>
              <Option value="boolean">布尔值</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="值"
          >
            {/* 根据类型动态渲染表单控件 */}
            {form.getFieldValue('type') && renderFormControl(form.getFieldValue('type'), 'value', editingSetting?.value)}
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

      {/* 配置变更确认对话框 */}
      <Modal
        title="确认配置变更"
        open={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false)
          setChangeReason('')
        }}
        footer={null}
        width={700}
        bodyStyle={{ maxHeight: '60vh', overflow: 'auto' }}
      >
        {settingToUpdate && (
          <div>
            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f0f5ff', borderRadius: '8px', borderLeft: '4px solid #1890ff' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>设置信息</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '8px' }}>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>分类：</div>
                <div>{categoryConfig[settingToUpdate.category]?.name || settingToUpdate.category}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>键名：</div>
                <div>{settingToUpdate.key}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>描述：</div>
                <div>{settingToUpdate.description}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>类型：</div>
                <div>{settingToUpdate.type}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>敏感信息：</div>
                <div>{settingToUpdate.isSecret ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>}</div>
                <div style={{ fontWeight: 'bold', color: '#1890ff' }}>必需项：</div>
                <div>{settingToUpdate.isRequired ? <Tag color="orange">是</Tag> : <Tag color="default">否</Tag>}</div>
                {checkRestartRequired(settingToUpdate) && (
                  <>
                    <div style={{ fontWeight: 'bold', color: '#1890ff' }}>生效方式：</div>
                    <div><Tag color="yellow"><RestOutlined /> 需要重启</Tag></div>
                  </>
                )}
              </div>
            </div>

            <Divider>
              <span style={{ fontWeight: 'bold' }}>变更预览</span>
            </Divider>

            <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h5 style={{ margin: '0 0 12px 0', color: '#ff4d4f' }}>旧值</h5>
                  <div style={{ padding: '12px', backgroundColor: '#fff2f0', borderRadius: '6px', border: '1px solid #ffccc7' }}>
                    {settingToUpdate.isSecret ? (
                      <Text code style={{ fontSize: '14px' }}>***</Text>
                    ) : settingToUpdate.type === 'boolean' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Switch checked={settingToUpdate.value === 'true'} disabled />
                        <span>{settingToUpdate.value === 'true' ? '启用' : '禁用'}</span>
                      </div>
                    ) : settingToUpdate.type === 'json' ? (
                      <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto', fontFamily: 'monospace' }}>
                        {JSON.stringify(JSON.parse(settingToUpdate.value), null, 2)}
                      </pre>
                    ) : (
                      <Text code style={{ fontSize: '14px' }}>{settingToUpdate.value || '-'}</Text>
                    )}
                  </div>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 12px 0', color: '#52c41a' }}>新值</h5>
                  <div style={{ padding: '12px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                    {settingToUpdate.isSecret ? (
                      <Text code style={{ fontSize: '14px' }}>***</Text>
                    ) : settingToUpdate.type === 'boolean' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Switch checked={newValueToSave} disabled />
                        <span>{newValueToSave ? '启用' : '禁用'}</span>
                      </div>
                    ) : settingToUpdate.type === 'json' ? (
                      <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto', fontFamily: 'monospace' }}>
                        {JSON.stringify(JSON.parse(newValueToSave), null, 2)}
                      </pre>
                    ) : (
                      <Text code style={{ fontSize: '14px' }}>{newValueToSave}</Text>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Divider>
              <span style={{ fontWeight: 'bold' }}>变更信息</span>
            </Divider>

            <Form layout="vertical" style={{ marginBottom: '20px' }}>
              <Form.Item
                label="变更原因"
                rules={[{ required: true, message: '请输入变更原因' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请详细说明本次配置变更的原因和预期效果，以便审计和回溯"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              <Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                  <Button size="large" onClick={() => {
                    setConfirmModalVisible(false)
                    setChangeReason('')
                  }}>
                    取消
                  </Button>
                  <Button type="primary" size="large" onClick={handleConfirmSave}>
                    <CheckOutlined /> 确认保存
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 查看历史记录对话框 */}
      <Modal
        title="设置变更历史"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false)
          setSelectedSettingId(null)
        }}
        footer={null}
        width={800}
      >
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
      </Modal>

      {/* 重启提示 */}
      {restartRequired && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          maxWidth: '500px',
          borderLeft: '4px solid #faad14'
        }}>
          <div style={{ color: '#faad14', fontSize: '28px', flexShrink: 0 }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '8px', color: '#262626' }}>
              <RestOutlined style={{ marginRight: '8px', color: '#faad14' }} />
              需要重启系统
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              以下配置变更需要重启才能生效：
            </div>
            <div style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {restartRequiredSettings.map((setting, index) => (
                <div key={setting.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: '#fff7e6', borderRadius: '16px', border: '1px solid #ffe7ba', color: '#fa8c16' }}>
                  <span>{setting.key}</span>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      // 移除单个需要重启的设置
                      setRestartRequiredSettings(prev => prev.filter(item => item.id !== setting.id))
                      if (restartRequiredSettings.length === 1) {
                        setRestartRequired(false)
                      }
                    }}
                    style={{ padding: '0', color: '#fa8c16', fontSize: '12px' }}
                  >
                    <CloseOutlined style={{ fontSize: '12px' }} />
                  </Button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                size="middle"
                onClick={() => {
                  // 这里可以添加重启系统的逻辑
                  message.info('系统重启功能已触发')
                  setRestartRequired(false)
                  setRestartRequiredSettings([])
                }}
              >
                <RestOutlined /> 立即重启
              </Button>
              <Button
                size="middle"
                onClick={() => {
                  setRestartRequired(false)
                  setRestartRequiredSettings([])
                }}
              >
                稍后重启
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
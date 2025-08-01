'use client'

import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Card,
  message,
  Layout,
  Typography,
  Row,
  Col,
  Select,
  AutoComplete,
  Switch,
  InputNumber,
  Breadcrumb,
  Space,
  Divider,
  Alert,
  Spin,
  Tooltip
} from 'antd'
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  HomeOutlined,
  AppstoreOutlined,
  EditOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

const { TextArea } = Input
const { Title, Text } = Typography
const { Content } = Layout
const { Option } = Select

interface Software {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersionId?: number | null
  currentVersion: string
  latestVersion?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: {
    os?: string[]
    memory?: string
    storage?: string
    processor?: string
    graphics?: string
    other?: string
  }
  openname?: string
  filetype?: string
  isActive: boolean
  sortOrder: number
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface SoftwareFormData {
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: {
    os?: string[]
    memory?: string
    storage?: string
    processor?: string
    graphics?: string
    other?: string
  }
  openname?: string
  filetype?: string
  isActive: boolean
  sortOrder: number
  metadata?: any
}

export default function SoftwareEdit() {
  const params = useParams()
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [software, setSoftware] = useState<Software | null>(null)

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app'

  // 获取软件详情
  const fetchSoftwareDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
      const data = await response.json()

      if (data.success) {
        const softwareData = data.data
        setSoftware(softwareData)
        
        // 填充表单
        form.setFieldsValue({
          ...softwareData,
          systemRequirements: softwareData.systemRequirements || {}
        })
      } else {
        message.error('获取软件详情失败')
      }
    } catch (error) {
      console.error('Error fetching software detail:', error)
      message.error('获取软件详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 保存软件
  const handleSave = async (values: SoftwareFormData) => {
    setSaving(true)
    
    try {
      // 处理数据
      const processedValues = {
        ...values,
        tags: values.tags || [],
        systemRequirements: values.systemRequirements || {},
        metadata: values.metadata || {}
      }

      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(processedValues)
      })

      const data = await response.json()

      if (data.success) {
        message.success('软件更新成功！')
        router.push(`/admin/software/${softwareId}`)
      } else {
        message.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('Error saving software:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    if (software) {
      form.setFieldsValue({
        ...software,
        systemRequirements: software.systemRequirements || {}
      })
    }
  }

  useEffect(() => {
    if (softwareId) {
      fetchSoftwareDetail()
    }
  }, [softwareId])

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>正在加载软件信息...</Text>
            </div>
          </div>
        </Content>
      </Layout>
    )
  }

  if (!software) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
          <Alert
            message="软件不存在"
            description="未找到指定的软件信息"
            type="error"
            showIcon
            action={
              <Link href="/admin/software">
                <Button size="small">返回软件列表</Button>
              </Link>
            }
          />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      
      <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
        {/* 面包屑导航 */}
        <Breadcrumb style={{ marginBottom: '24px' }}>
          <Breadcrumb.Item>
            <Link href="/admin">
              <HomeOutlined /> 管理后台
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href="/admin/software">
              <AppstoreOutlined /> 软件管理
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link href={`/admin/software/${softwareId}`}>
              <InfoCircleOutlined /> {software.name}
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <EditOutlined /> 编辑软件
          </Breadcrumb.Item>
        </Breadcrumb>

        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Link href={`/admin/software/${softwareId}`}>
              <Button icon={<ArrowLeftOutlined />}>返回</Button>
            </Link>
            <Title level={2} style={{ margin: 0 }}>
              编辑软件 - {software.name}
            </Title>
          </Space>
          <Text type="secondary">
            修改软件信息，最新版本将根据版本历史自动计算
          </Text>
        </div>

        {/* 提示信息 */}
        <Alert
          message="编辑说明"
          description="最新版本号由系统根据版本历史自动计算，无需手动维护。如需更新版本，请在版本管理页面添加新版本。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* 编辑表单 */}
            <Card title="编辑软件信息">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="软件名称"
                      name="name"
                      rules={[
                        { required: true, message: '请输入软件名称' },
                        { max: 255, message: '软件名称不能超过255个字符' }
                      ]}
                    >
                      <Input placeholder="请输入软件名称" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="英文名称"
                      name="nameEn"
                      rules={[
                        { max: 255, message: '英文名称不能超过255个字符' }
                      ]}
                    >
                      <Input placeholder="请输入英文名称（可选）" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="软件描述"
                  name="description"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="请输入软件描述" 
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>

                <Form.Item
                  label="英文描述"
                  name="descriptionEn"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="请输入英文描述（可选）" 
                    showCount
                    maxLength={1000}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space>
                          当前版本
                          <Tooltip title="当前使用的版本号，可以手动修改">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name="currentVersion"
                      rules={[
                        { required: true, message: '请输入当前版本' },
                        { pattern: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, message: '请输入有效的语义化版本号 (如: 1.0.0)' }
                      ]}
                    >
                      <Input placeholder="例如：1.0.0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="软件分类"
                      name="category"
                    >
                      <Select placeholder="请选择分类">
                        <Option value="开发工具">开发工具</Option>
                        <Option value="浏览器">浏览器</Option>
                        <Option value="图像处理">图像处理</Option>
                        <Option value="社交通讯">社交通讯</Option>
                        <Option value="办公软件">办公软件</Option>
                        <Option value="系统工具">系统工具</Option>
                        <Option value="多媒体">多媒体</Option>
                        <Option value="游戏">游戏</Option>
                        <Option value="安全软件">安全软件</Option>
                        <Option value="网络工具">网络工具</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space>
                          启动文件名
                          <Tooltip title="软件的启动文件名或命令，例如：bypass/bypass.cmd, main.exe, start.sh">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name="openname"
                      rules={[
                        { max: 255, message: '启动文件名不能超过255个字符' }
                      ]}
                    >
                      <Input placeholder="例如：bypass/bypass.cmd" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={
                        <Space>
                          文件类型
                          <Tooltip title="软件包的文件格式类型，例如：7z, zip, apk, exe, dmg">
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      name="filetype"
                      rules={[
                        { max: 50, message: '文件类型不能超过50个字符' }
                      ]}
                    >
                      <AutoComplete
                        placeholder="请选择或输入文件类型"
                        allowClear
                        options={[
                          { value: '7z', label: '7z' },
                          { value: 'zip', label: 'zip' },
                          { value: 'rar', label: 'rar' },
                          { value: 'exe', label: 'exe' },
                          { value: 'msi', label: 'msi' },
                          { value: 'dmg', label: 'dmg' },
                          { value: 'pkg', label: 'pkg' },
                          { value: 'deb', label: 'deb' },
                          { value: 'rpm', label: 'rpm' },
                          { value: 'apk', label: 'apk' },
                          { value: 'tar.gz', label: 'tar.gz' },
                          { value: 'tar.xz', label: 'tar.xz' }
                        ]}
                        filterOption={(inputValue, option) =>
                          option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="官方网站"
                      name="officialWebsite"
                      rules={[
                        { type: 'url', message: '请输入有效的网址' }
                      ]}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="软件标签"
                      name="tags"
                    >
                      <Select
                        mode="tags"
                        placeholder="输入标签后按回车添加"
                        style={{ width: '100%' }}
                        tokenSeparators={[',']}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>系统要求</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="支持系统"
                      name={['systemRequirements', 'os']}
                    >
                      <Select
                        mode="multiple"
                        placeholder="选择支持的操作系统"
                      >
                        <Option value="Windows">Windows</Option>
                        <Option value="macOS">macOS</Option>
                        <Option value="Linux">Linux</Option>
                        <Option value="Android">Android</Option>
                        <Option value="iOS">iOS</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="内存要求"
                      name={['systemRequirements', 'memory']}
                    >
                      <Input placeholder="例如：4GB RAM" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="存储空间"
                      name={['systemRequirements', 'storage']}
                    >
                      <Input placeholder="例如：500MB 可用空间" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="处理器要求"
                      name={['systemRequirements', 'processor']}
                    >
                      <Input placeholder="例如：Intel Core i3 或同等处理器" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="其他要求"
                  name={['systemRequirements', 'other']}
                >
                  <TextArea 
                    rows={2} 
                    placeholder="其他系统要求或依赖项" 
                  />
                </Form.Item>

                <Divider>设置</Divider>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
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
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="排序顺序"
                      name="sortOrder"
                      rules={[
                        { type: 'number', min: 0, message: '排序顺序不能小于0' }
                      ]}
                    >
                      <InputNumber 
                        min={0} 
                        placeholder="数字越小排序越靠前" 
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={saving}
                      icon={<SaveOutlined />}
                    >
                      保存修改
                    </Button>
                    <Button onClick={handleReset}>
                      重置
                    </Button>
                    <Link href={`/admin/software/${softwareId}`}>
                      <Button>
                        取消
                      </Button>
                    </Link>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* 软件信息 */}
            <Card title="软件信息" size="small" style={{ marginBottom: '24px' }}>
              <Space direction="vertical" size="middle">
                <div>
                  <Text strong>软件ID: </Text>
                  <Text>#{software.id}</Text>
                </div>
                <div>
                  <Text strong>创建时间: </Text>
                  <Text>{new Date(software.createdAt).toLocaleDateString('zh-CN')}</Text>
                </div>
                <div>
                  <Text strong>最后更新: </Text>
                  <Text>{new Date(software.updatedAt).toLocaleDateString('zh-CN')}</Text>
                </div>
                {software.latestVersion && (
                  <div>
                    <Text strong>最新版本: </Text>
                    <Text>{software.latestVersion}</Text>
                  </div>
                )}
              </Space>
            </Card>

            {/* 编辑说明 */}
            <Card title="编辑说明" size="small">
              <Space direction="vertical" size="middle">
                <div>
                  <Text strong>版本管理</Text>
                  <br />
                  <Text type="secondary">最新版本由系统自动计算</Text>
                </div>
                <div>
                  <Text strong>下载链接</Text>
                  <br />
                  <Text type="secondary">在版本历史中管理下载链接</Text>
                </div>
                <div>
                  <Text strong>状态设置</Text>
                  <br />
                  <Text type="secondary">禁用后用户无法看到此软件</Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

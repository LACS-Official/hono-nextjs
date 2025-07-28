'use client'

import React, { useState, useEffect } from 'react'
import { 
  Layout,
  Form, 
  Input, 
  Button, 
  Card, 
  Switch, 
  Select, 
  InputNumber,
  message,
  Typography,
  Space,
  Row,
  Col
} from 'antd'
import { 
  SaveOutlined, 
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

const { TextArea } = Input
const { Option } = Select
const { Title } = Typography
const { Content } = Layout

interface SoftwareFormData {
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  latestVersion: string
  downloadUrl?: string
  downloadUrlBackup?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  fileSize?: string
  isActive: boolean
  sortOrder: number
}

export default function SoftwareEdit() {
  const router = useRouter()
  const params = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEdit, setIsEdit] = useState(false)

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/app'

  // 获取软件详情
  const fetchSoftware = async () => {
    if (softwareId === 'new') {
      setIsEdit(false)
      return
    }

    setIsEdit(true)
    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
      const data = await response.json()

      if (data.success) {
        form.setFieldsValue({
          ...data.data,
          tags: data.data.tags || []
        })
      } else {
        message.error('获取软件信息失败')
        router.push('/admin/software')
      }
    } catch (error) {
      console.error('Error fetching software:', error)
      message.error('网络错误，请稍后重试')
      router.push('/admin/software')
    } finally {
      setLoading(false)
    }
  }

  // 保存软件
  const handleSave = async (values: SoftwareFormData) => {
    setSaving(true)
    
    try {
      const url = isEdit ? `${API_BASE_URL}/software/${softwareId}` : `${API_BASE_URL}/software`
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (data.success) {
        message.success(isEdit ? '更新成功' : '创建成功')
        router.push('/admin/software')
      } else {
        message.error(data.error?.message || '保存失败')
      }
    } catch (error) {
      console.error('Error saving software:', error)
      message.error('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    fetchSoftware()
  }, [softwareId])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      
      <Content style={{ padding: '24px', marginTop: '64px', background: '#f5f5f5' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Link href="/admin/software">
              <Button icon={<ArrowLeftOutlined />}>返回</Button>
            </Link>
            <Title level={2} style={{ margin: 0 }}>
              {isEdit ? '编辑软件' : '添加软件'}
            </Title>
          </Space>
        </div>

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title="基本信息" loading={loading}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  isActive: true,
                  sortOrder: 0,
                  tags: []
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="软件名称"
                      name="name"
                      rules={[{ required: true, message: '请输入软件名称' }]}
                    >
                      <Input placeholder="请输入软件名称" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="英文名称"
                      name="nameEn"
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
                  />
                </Form.Item>

                <Form.Item
                  label="英文描述"
                  name="descriptionEn"
                >
                  <TextArea 
                    rows={3} 
                    placeholder="请输入英文描述（可选）" 
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="当前版本"
                      name="currentVersion"
                      rules={[{ required: true, message: '请输入当前版本' }]}
                    >
                      <Input placeholder="例如：1.0.0" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="最新版本"
                      name="latestVersion"
                      rules={[{ required: true, message: '请输入最新版本' }]}
                    >
                      <Input placeholder="例如：1.0.1" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="下载链接"
                      name="downloadUrl"
                    >
                      <Input placeholder="请输入下载链接" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="备用下载链接"
                      name="downloadUrlBackup"
                    >
                      <Input placeholder="请输入备用下载链接" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="官方网站"
                      name="officialWebsite"
                    >
                      <Input placeholder="请输入官方网站" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="分类"
                      name="category"
                    >
                      <Input placeholder="请输入软件分类" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="文件大小"
                      name="fileSize"
                    >
                      <Input placeholder="例如：100 MB" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="排序"
                      name="sortOrder"
                    >
                      <InputNumber 
                        min={0} 
                        placeholder="排序数字，越小越靠前"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="状态"
                  name="isActive"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="启用" 
                    unCheckedChildren="禁用" 
                  />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit"
                      icon={<SaveOutlined />}
                      loading={saving}
                    >
                      {isEdit ? '更新软件' : '创建软件'}
                    </Button>
                    <Link href="/admin/software">
                      <Button>取消</Button>
                    </Link>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  )
}

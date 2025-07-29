'use client'

import React, { useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Switch, 
  DatePicker, 
  message,
  Space,
  Typography,
  Breadcrumb
} from 'antd'
import { 
  PlusOutlined, 
  SaveOutlined, 
  ArrowLeftOutlined,
  HomeOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

interface AnnouncementFormData {
  title: string
  titleEn?: string
  content: string
  contentEn?: string
  type: string
  priority: string
  isPublished: boolean
  expiresAt?: string
}

export default function NewAnnouncementPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (values: AnnouncementFormData) => {
    setLoading(true)
    try {
      // 这里应该调用 API 创建公告
      console.log('创建公告:', values)
      
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      message.success('公告创建成功！')
      router.push('/dashboard/announcements')
    } catch (error) {
      console.error('创建公告失败:', error)
      message.error('创建公告失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <Link href="/dashboard">
            <HomeOutlined /> 控制台
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href="/dashboard/announcements">
            <BellOutlined /> 公告管理
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>新增公告</Breadcrumb.Item>
      </Breadcrumb>

      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <PlusOutlined style={{ marginRight: '8px' }} />
          新增公告
        </Title>
      </div>

      {/* 表单卡片 */}
      <Card>
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
          {/* 基本信息 */}
          <Title level={4}>基本信息</Title>
          
          <Form.Item
            label="公告标题"
            name="title"
            rules={[
              { required: true, message: '请输入公告标题' },
              { max: 500, message: '标题不能超过500个字符' }
            ]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            label="英文标题"
            name="titleEn"
            rules={[
              { max: 500, message: '英文标题不能超过500个字符' }
            ]}
          >
            <Input placeholder="请输入英文标题（可选）" />
          </Form.Item>

          <Form.Item
            label="公告内容"
            name="content"
            rules={[
              { required: true, message: '请输入公告内容' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="请输入公告内容"
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item
            label="英文内容"
            name="contentEn"
          >
            <TextArea 
              rows={6} 
              placeholder="请输入英文内容（可选）"
              showCount
              maxLength={5000}
            />
          </Form.Item>

          {/* 公告设置 */}
          <Title level={4} style={{ marginTop: '32px' }}>公告设置</Title>

          <Form.Item
            label="公告类型"
            name="type"
            rules={[{ required: true, message: '请选择公告类型' }]}
          >
            <Select placeholder="请选择公告类型">
              <Option value="general">一般公告</Option>
              <Option value="maintenance">维护公告</Option>
              <Option value="update">更新公告</Option>
              <Option value="security">安全公告</Option>
              <Option value="promotion">推广公告</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              <Option value="low">低</Option>
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="过期时间"
            name="expiresAt"
          >
            <DatePicker 
              showTime 
              placeholder="选择过期时间（可选）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="立即发布"
            name="isPublished"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item style={{ marginTop: '32px' }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                创建公告
              </Button>
              <Button 
                onClick={handleCancel}
                icon={<ArrowLeftOutlined />}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

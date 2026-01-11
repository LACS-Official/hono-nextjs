'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  message,
  Alert,
  Divider,
  Tag
} from 'antd'
import {
  ArrowLeftOutlined,
  SaveOutlined,
  KeyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'
import {
  activationCodeApi,
  type CreateActivationCodeRequest,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

export default function NewActivationCodePage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true)

    try {
      const request: CreateActivationCodeRequest = {
        expirationDays: values.expirationDays || 365,
        metadata: {
          customerEmail: values.customerEmail,
          licenseType: values.licenseType,
          purchaseId: values.purchaseId,
          customerId: values.customerId,
          notes: values.notes
        },
        productInfo: {
          name: values.productName || '默认产品',
          version: values.productVersion || '1.0.0',
          features: values.features || ['basic']
        }
      }

      const result = await activationCodeApi.createActivationCode(request)

      message.success('激活码创建成功！')

      // 跳转到详情页面或列表页面
      router.push(`/admin/activation-codes/${result.id}`)

    } catch (error) {
      const apiError = error as ActivationCodeApiError
      message.error(`创建失败: ${apiError.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 预设的许可证类型
  const licenseTypes = [
    { value: 'standard', label: '标准版' },
    { value: 'premium', label: '高级版' },
    { value: 'enterprise', label: '企业版' },
    { value: 'trial', label: '试用版' },
    { value: 'educational', label: '教育版' }
  ]

  // 预设的产品功能
  const productFeatures = [
    { value: 'basic', label: '基础功能' },
    { value: 'advanced', label: '高级功能' },
    { value: 'premium', label: '高级功能' },
    { value: 'sync', label: '同步功能' },
    { value: 'backup', label: '备份功能' },
    { value: 'analytics', label: '分析功能' },
    { value: 'api', label: 'API访问' }
  ]

  return (
    <ErrorBoundaryWrapper>
      <div className="responsive-container" style={{ paddingTop: '0', paddingBottom: '24px' }}>
        {/* 页面头部 */}
        <div className="responsive-card-spacing">
          <Space align="center" style={{ marginBottom: '16px' }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              返回
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              <KeyOutlined style={{ marginRight: '8px' }} />
              创建激活码
            </Title>
          </Space>
          <Paragraph style={{ color: '#666', margin: 0 }}>
            填写以下信息来创建新的激活码
          </Paragraph>
        </div>

        {/* 创建表单 */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              expirationDays: 365,
              licenseType: 'standard',
              productName: '玩机管家',
              productVersion: '1.0.0',
              features: ['basic']
            }}
          >
            <Row gutter={24}>
              {/* 基础信息 */}
              <Col span={24}>
                <Title level={4}>
                  <InfoCircleOutlined style={{ marginRight: '8px' }} />
                  基础信息
                </Title>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="expirationDays"
                  label="有效期（天）"
                  rules={[
                    { required: true, message: '请输入有效期' },
                    { type: 'number', min: 1, max: 3650, message: '有效期必须在1-3650天之间' }
                  ]}
                  extra="激活码的有效期，超过此时间后将无法使用"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="365"
                    min={1}
                    max={3650}
                    addonAfter="天"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="licenseType"
                  label="许可证类型"
                  rules={[{ required: true, message: '请选择许可证类型' }]}
                >
                  <Select placeholder="选择许可证类型">
                    {licenseTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* 客户信息 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>客户信息</Title>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="customerEmail"
                  label="客户邮箱"
                  rules={[
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input placeholder="customer@example.com" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="customerId"
                  label="客户ID"
                >
                  <Input placeholder="客户唯一标识" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="purchaseId"
                  label="订单ID"
                >
                  <Input placeholder="关联的订单或购买记录ID" />
                </Form.Item>
              </Col>

              {/* 产品信息 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>产品信息</Title>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="productName"
                  label="产品名称"
                  rules={[{ required: true, message: '请输入产品名称' }]}
                >
                  <Input placeholder="玩机管家" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="productVersion"
                  label="产品版本"
                  rules={[{ required: true, message: '请输入产品版本' }]}
                >
                  <Input placeholder="1.0.0" />
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="features"
                  label="包含功能"
                  rules={[{ required: true, message: '请选择至少一个功能' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="选择激活码包含的功能"
                    style={{ width: '100%' }}
                  >
                    {productFeatures.map(feature => (
                      <Option key={feature.value} value={feature.value}>
                        {feature.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* 备注信息 */}
              <Col span={24}>
                <Divider />
                <Title level={4}>备注信息</Title>
              </Col>

              <Col span={24}>
                <Form.Item
                  name="notes"
                  label="备注"
                >
                  <TextArea
                    rows={4}
                    placeholder="添加关于此激活码的备注信息..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* 提示信息 */}
            <Alert
              message="创建提示"
              description="激活码创建后将自动生成唯一的激活码字符串，您可以将其分发给客户使用。"
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            {/* 操作按钮 */}
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => router.back()}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                >
                  创建激活码
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </ErrorBoundaryWrapper>
  )
}

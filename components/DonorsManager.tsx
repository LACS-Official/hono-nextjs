'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  DatePicker,
  Space,
  message,
  Modal,
  Typography,
  Divider,
  Tag,
  Spin,
  Alert
} from 'antd'
import {
  PlusOutlined,
  UserOutlined,
  CalendarOutlined,
  ReloadOutlined,
  HeartOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// 捐赠人员数据接口
interface Donor {
  id: number
  name: string
  donationDate: string
  createdAt: string
}

// 新增捐赠人员表单数据接口
interface NewDonorForm {
  name: string
  donationDate: dayjs.Dayjs
}

export default function DonorsManager() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm<NewDonorForm>()

  // 获取捐赠人员列表
  const fetchDonors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/donors')
      const data = await response.json()

      if (data.success) {
        setDonors(data.data)
      } else {
        message.error(data.error || '获取捐赠人员列表失败')
      }
    } catch (error) {
      console.error('获取捐赠人员列表失败:', error)
      message.error('获取捐赠人员列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 新增捐赠人员
  const handleAddDonor = async (values: NewDonorForm) => {
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          donationDate: values.donationDate.format('YYYY-MM-DD')
        })
      })

      const data = await response.json()

      if (data.success) {
        message.success('捐赠人员添加成功')
        setIsModalVisible(false)
        form.resetFields()
        fetchDonors() // 刷新列表
      } else {
        message.error(data.error || '添加捐赠人员失败')
      }
    } catch (error) {
      console.error('添加捐赠人员失败:', error)
      message.error('添加捐赠人员失败')
    } finally {
      setSubmitting(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDonors()
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '捐赠人姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: '捐赠日期',
      dataIndex: 'donationDate',
      key: 'donationDate',
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#52c41a' }} />
          <Text>{dayjs(date).format('YYYY年MM月DD日')}</Text>
        </Space>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => (
        <Text type="secondary">
          {dayjs(createdAt).format('YYYY-MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: () => (
        <Tag color="green" icon={<HeartOutlined />}>
          已记录
        </Tag>
      ),
    },
  ]

  return (
    <Card
      title={
        <Space>
          <HeartOutlined style={{ color: '#ff4d4f' }} />
          <Title level={4} style={{ margin: 0 }}>
            捐赠人员管理
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDonors}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            新增捐赠人员
          </Button>
        </Space>
      }
    >
      {/* 统计信息 */}
      <div style={{ marginBottom: '16px' }}>
        <Alert
          message={
            <Space>
              <Text>总计捐赠人员：</Text>
              <Text strong style={{ color: '#1890ff' }}>{donors.length}</Text>
              <Text>人</Text>
            </Space>
          }
          type="info"
          showIcon
        />
      </div>

      <Divider />

      {/* 捐赠人员列表 */}
      <Table
        columns={columns}
        dataSource={donors}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        locale={{
          emptyText: '暂无捐赠人员记录'
        }}
      />

      {/* 新增捐赠人员弹窗 */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            新增捐赠人员
          </Space>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddDonor}
          autoComplete="off"
        >
          <Form.Item
            label="捐赠人姓名"
            name="name"
            rules={[
              { required: true, message: '请输入捐赠人姓名' },
              { max: 255, message: '姓名不能超过255个字符' }
            ]}
          >
            <Input
              placeholder="请输入捐赠人姓名"
              prefix={<UserOutlined />}
              maxLength={255}
            />
          </Form.Item>

          <Form.Item
            label="捐赠日期"
            name="donationDate"
            rules={[
              { required: true, message: '请选择捐赠日期' }
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="请选择捐赠日期"
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsModalVisible(false)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<PlusOutlined />}
              >
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

import React, { useState, useEffect } from 'react';
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
  Select,
  DatePicker,
  Typography,
  Empty,
  Popconfirm,
  Tooltip,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  NotificationOutlined,
  PushpinOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SoftwareAnnouncement {
  id: number;
  softwareId: number;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  type: 'general' | 'update' | 'security' | 'maintenance' | 'feature' | 'bugfix';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  version?: string;
  isPublished: boolean;
  isSticky?: boolean;
  publishedAt?: string;
  expiresAt?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface SoftwareAnnouncementManagerProps {
  softwareId: number;
  softwareName: string;
}

const SoftwareAnnouncementManager: React.FC<SoftwareAnnouncementManagerProps> = ({ 
  softwareId, 
  softwareName 
}) => {
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<SoftwareAnnouncement | null>(null);
  const [form] = Form.useForm();
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/app';

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements`);
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.data?.announcements || []);
      } else {
        message.error('获取公告列表失败');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      message.error('获取公告列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建或更新公告
  const handleSubmit = async (values: any) => {
    try {
      const method = editingAnnouncement ? 'PUT' : 'POST';
      const url = editingAnnouncement 
        ? `${API_BASE_URL}/software/id/${softwareId}/announcements/${editingAnnouncement.id}`
        : `${API_BASE_URL}/software/id/${softwareId}/announcements`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingAnnouncement ? '公告更新成功' : '公告创建成功');
        setModalVisible(false);
        form.resetFields();
        setEditingAnnouncement(null);
        fetchAnnouncements();
      } else {
        message.error(data.error || (editingAnnouncement ? '公告更新失败' : '公告创建失败'));
      }
    } catch (error) {
      console.error('Error saving announcement:', error);
      message.error(editingAnnouncement ? '公告更新失败，请稍后重试' : '公告创建失败，请稍后重试');
    }
  };

  // 删除公告
  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      });

      const data = await response.json();

      if (data.success) {
        message.success('公告删除成功');
        fetchAnnouncements();
      } else {
        message.error(data.error || '公告删除失败');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      message.error('公告删除失败，请稍后重试');
    }
  };

  // 打开编辑模态框
  const handleEdit = (announcement: SoftwareAnnouncement) => {
    setEditingAnnouncement(announcement);
    form.setFieldsValue({
      ...announcement,
      publishedAt: announcement.publishedAt ? dayjs(announcement.publishedAt) : null,
      expiresAt: announcement.expiresAt ? dayjs(announcement.expiresAt) : null
    });
    setModalVisible(true);
  };

  // 打开创建模态框
  const handleCreate = () => {
    setEditingAnnouncement(null);
    form.resetFields();
    setModalVisible(true);
  };

  useEffect(() => {
    if (softwareId) {
      fetchAnnouncements();
    }
  }, [softwareId]);

  const columns: ColumnsType<SoftwareAnnouncement> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.titleEn && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.titleEn}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          general: { color: 'default', text: '一般' },
          update: { color: 'blue', text: '更新' },
          security: { color: 'red', text: '安全' },
          maintenance: { color: 'orange', text: '维护' },
          feature: { color: 'green', text: '功能' },
          bugfix: { color: 'purple', text: '修复' }
        };
        const config = typeMap[type] || { color: 'default', text: type };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const priorityMap: Record<string, { color: string; text: string }> = {
          low: { color: 'default', text: '低' },
          normal: { color: 'blue', text: '普通' },
          high: { color: 'orange', text: '高' },
          urgent: { color: 'red', text: '紧急' }
        };
        const config = priorityMap[priority] || { color: 'default', text: priority };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 100,
      render: (isPublished: boolean, record) => (
        <Space direction="vertical" size={0}>
          <Tag icon={record.isSticky ? <PushpinOutlined /> : null} 
               color={isPublished ? 'success' : 'default'}>
            {isPublished ? '已发布' : '未发布'}
          </Tag>
          {record.isSticky && (
            <Tag icon={<PushpinOutlined />} color="gold">置顶</Tag>
          )}
        </Space>
      )
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (version: string) => version ? <Tag>{version}</Tag> : '-'
    },
    {
      title: '发布时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 120,
      render: (publishedAt: string) => publishedAt 
        ? dayjs(publishedAt).format('YYYY-MM-DD') 
        : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="编辑">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除公告"
            description="确定要删除这条公告吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const typeOptions = [
    { value: 'general', label: '一般公告' },
    { value: 'update', label: '更新通知' },
    { value: 'security', label: '安全公告' },
    { value: 'maintenance', label: '维护通知' },
    { value: 'feature', label: '功能介绍' },
    { value: 'bugfix', label: '修复通知' }
  ];

  const priorityOptions = [
    { value: 'low', label: '低优先级' },
    { value: 'normal', label: '普通优先级' },
    { value: 'high', label: '高优先级' },
    { value: 'urgent', label: '紧急优先级' }
  ];

  return (
    <div>
      <Card 
        title={
          <Space>
            <NotificationOutlined />
            <span>软件公告管理</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            添加公告
          </Button>
        }
      >
        {announcements.length > 0 ? (
          <Table
            columns={columns}
            dataSource={announcements}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false
            }}
          />
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
            description="暂无公告"
            imageStyle={{ height: 60 }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加第一个公告
            </Button>
          </Empty>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <NotificationOutlined />
            <span>{editingAnnouncement ? '编辑公告' : '添加公告'}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingAnnouncement(null);
        }}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="公告标题"
            rules={[{ required: true, message: '请输入公告标题' }]}
          >
            <Input placeholder="请输入公告标题" />
          </Form.Item>

          <Form.Item
            name="titleEn"
            label="公告标题 (英文)"
          >
            <Input placeholder="请输入英文公告标题" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="公告类型"
                initialValue="general"
              >
                <Select placeholder="请选择公告类型">
                  {typeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                initialValue="normal"
              >
                <Select placeholder="请选择优先级">
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="公告内容"
            rules={[{ required: true, message: '请输入公告内容' }]}
          >
            <TextArea 
              placeholder="请输入公告内容" 
              rows={4} 
              style={{ resize: 'none' }} 
            />
          </Form.Item>

          <Form.Item
            name="contentEn"
            label="公告内容 (英文)"
          >
            <TextArea 
              placeholder="请输入英文公告内容" 
              rows={4} 
              style={{ resize: 'none' }} 
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label="关联版本"
              >
                <Input placeholder="例如: 1.0.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="isSticky"
                label="是否置顶"
                valuePropName="checked"
                initialValue={false}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="publishedAt"
                label="发布时间"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss" 
                  placeholder="请选择发布时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiresAt"
                label="过期时间"
              >
                <DatePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss" 
                  placeholder="请选择过期时间"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isPublished"
            label="是否发布"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SoftwareAnnouncementManager;
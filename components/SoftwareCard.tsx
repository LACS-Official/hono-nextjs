'use client'

import React from 'react'
import { Card, Tag, Button, Space, Typography, Tooltip, Badge } from 'antd'
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  BarChartOutlined 
} from '@ant-design/icons'
import type { Software } from '../utils/software-api'

const { Text, Paragraph } = Typography

interface SoftwareCardProps {
  software: Software
  onEdit: (software: Software) => void
  onDelete: (id: number) => void
  onView: (software: Software) => void
  onViewStats: (software: Software) => void
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({
  software,
  onEdit,
  onDelete,
  onView,
  onViewStats
}) => {
  return (
    <Card
      hoverable
      className="software-card"
      style={{ marginBottom: 16 }}
      actions={[
        <Tooltip title="查看详情">
          <EyeOutlined key="view" onClick={() => onView(software)} />
        </Tooltip>,
        <Tooltip title="编辑">
          <EditOutlined key="edit" onClick={() => onEdit(software)} />
        </Tooltip>,
        <Tooltip title="查看统计">
          <BarChartOutlined key="stats" onClick={() => onViewStats(software)} />
        </Tooltip>,
        <Tooltip title="删除">
          <DeleteOutlined key="delete" onClick={() => onDelete(software.id)} />
        </Tooltip>
      ]}
    >
      <div className="software-card-header">
        <div className="software-title">
          <Text strong style={{ fontSize: 16 }}>{software.name}</Text>
          {software.nameEn && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              {software.nameEn}
            </Text>
          )}
        </div>
        <div className="software-status">
          <Badge 
            status={software.isActive ? 'success' : 'error'} 
            text={software.isActive ? '已激活' : '已停用'} 
          />
        </div>
      </div>

      <div className="software-card-content">
        {software.description && (
          <Paragraph
            ellipsis={{ rows: 2, expandable: false }}
            style={{ marginBottom: 12, minHeight: 40 }}
          >
            {software.description}
          </Paragraph>
        )}

        <div className="software-meta">
          <Space wrap size={[8, 4]}>
            <Tag color="blue">#{software.id}</Tag>
            {software.category && (
              <Tag color="green">{software.category}</Tag>
            )}
            <Tag color="orange">版本: {software.currentVersion}</Tag>
            <Tag color="purple">浏览: {software.viewCount}</Tag>
          </Space>
        </div>

        {software.tags && software.tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Space wrap size={[4, 4]}>
              {software.tags.map((tag, index) => (
                <Tag key={index} color="default" style={{ fontSize: 11 }}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}
      </div>

      <div className="software-card-footer">
        <Text type="secondary" style={{ fontSize: 11 }}>
          创建时间: {new Date(software.createdAt).toLocaleDateString()}
        </Text>
        {software.updatedAt !== software.createdAt && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            | 更新: {new Date(software.updatedAt).toLocaleDateString()}
          </Text>
        )}
      </div>
    </Card>
  )
}

export default SoftwareCard
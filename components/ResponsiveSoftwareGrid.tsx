'use client'

import React from 'react'
import { Row, Col, Empty, Spin } from 'antd'
import SoftwareCard from './SoftwareCard'
import type { Software } from '../app/admin/software/page'

interface ResponsiveSoftwareGridProps {
  software: Software[]
  loading: boolean
  onEdit: (software: Software) => void
  onDelete: (id: number) => void
  onView: (software: Software) => void
  onViewStats: (software: Software) => void
}

const ResponsiveSoftwareGrid: React.FC<ResponsiveSoftwareGridProps> = ({
  software,
  loading,
  onEdit,
  onDelete,
  onView,
  onViewStats
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (software.length === 0) {
    return (
      <Empty
        description="暂无软件数据"
        style={{ margin: '50px 0' }}
      />
    )
  }

  return (
    <Row gutter={[16, 16]}>
      {software.map((item) => (
        <Col
          key={item.id}
          xs={24}      // 手机: 1列
          sm={12}      // 小屏幕: 2列
          lg={8}       // 大屏幕: 3列
          xl={6}       // 超大屏幕: 4列
          xxl={4}      // 超超大屏幕: 6列
        >
          <SoftwareCard
            software={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onViewStats={onViewStats}
          />
        </Col>
      ))}
    </Row>
  )
}

export default ResponsiveSoftwareGrid
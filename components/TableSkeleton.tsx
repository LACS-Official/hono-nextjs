'use client'

import React from 'react'
import { Skeleton, Card, Row, Col } from 'antd'

interface TableSkeletonProps {
  rows?: number
  columns?: number
  avatar?: boolean
  title?: boolean
  paragraph?: boolean
  active?: boolean
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  avatar = false,
  title = true,
  paragraph = true,
  active = true
}) => {
  return (
    <div style={{ padding: '16px 0' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Col key={colIndex} flex={1}>
                <Skeleton
                  key={`${index}-${colIndex}`}
                  avatar={avatar && colIndex === 0}
                  title={title && colIndex === 0}
                  paragraph={paragraph && colIndex === 0}
                  active={active}
                  style={{ padding: '8px 0' }}
                />
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  )
}

export default TableSkeleton
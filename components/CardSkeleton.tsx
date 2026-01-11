'use client'

import React from 'react'
import { Skeleton, Card, Row, Col } from 'antd'

interface CardSkeletonProps {
  count?: number
  rows?: number
  active?: boolean
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 6,
  rows = 3,
  active = true
}) => {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col
          key={index}
          xs={24}      // 手机: 1列
          sm={12}      // 小屏幕: 2列
          lg={8}       // 大屏幕: 3列
          xl={6}       // 超大屏幕: 4列
          xxl={4}      // 超超大屏幕: 6列
        >
          <Card>
            <Skeleton
              avatar
              title
              paragraph={{ rows }}
              active={active}
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default CardSkeleton
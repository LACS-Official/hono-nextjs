'use client'

import React from 'react'
import { Skeleton, Card, Row, Col, Statistic } from 'antd'

interface StatsCardSkeletonProps {
  count?: number
  active?: boolean
}

const StatsCardSkeleton: React.FC<StatsCardSkeletonProps> = ({
  count = 4,
  active = true
}) => {
  return (
    <Row gutter={16} style={{ marginBottom: '24px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Col
          key={index}
          xs={24}      // 手机: 1列
          sm={12}      // 小屏幕: 2列
          lg={6}       // 大屏幕: 4列
        >
          <Card>
            <Skeleton
              active={active}
              paragraph={false}
              title={{ width: '60%' }}
            />
            <Skeleton
              active={active}
              paragraph={false}
              title={{ width: '40%', style: { marginTop: 16 } }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StatsCardSkeleton
'use client'

import React from 'react'
import { Typography, Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface PageContainerProps {
  title: string
  description?: string
  breadcrumb?: Array<{
    title: string
    href?: string
  }>
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function PageContainer({
  title,
  description,
  breadcrumb,
  children,
  className = '',
  style = {}
}: PageContainerProps) {
  return (
    <div 
      className={`responsive-container ${className}`}
      style={{ 
        paddingTop: '0', 
        paddingBottom: '24px',
        ...style 
      }}
    >
      {/* 面包屑导航 */}
      {breadcrumb && breadcrumb.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <Breadcrumb
            items={[
              {
                title: <HomeOutlined />,
                href: '/admin'
              },
              ...breadcrumb.map(item => ({
                title: item.title,
                href: item.href
              }))
            ]}
          />
        </div>
      )}

      {/* 页面头部 */}
      <div className="responsive-card-spacing">
        <Title level={2} className="responsive-title">
          {title}
        </Title>
        {description && (
          <Paragraph style={{ color: '#666', margin: 0 }}>
            {description}
          </Paragraph>
        )}
      </div>

      {/* 页面内容 */}
      {children}
    </div>
  )
}

// 响应式搜索和操作栏组件
interface SearchAndActionBarProps {
  children: React.ReactNode
  className?: string
}

export function SearchAndActionBar({
  children,
  className = ''
}: SearchAndActionBarProps) {
  return (
    <div className={`responsive-search-container ${className}`}>
      {children}
    </div>
  )
}

// 响应式表格容器组件
interface ResponsiveTableContainerProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function ResponsiveTableContainer({
  children,
  className = '',
  style = {}
}: ResponsiveTableContainerProps) {
  return (
    <div 
      className={`responsive-table-container ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// 响应式卡片组件
interface ResponsiveCardProps {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}

export function ResponsiveCard({
  title,
  children,
  className = '',
  style = {},
  bodyStyle = {}
}: ResponsiveCardProps) {
  return (
    <div 
      className={`responsive-card-spacing ${className}`}
      style={{
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #f0f0f0',
        ...style
      }}
    >
      {title && (
        <div style={{
          padding: '16px 16px 0 16px',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
        </div>
      )}
      <div style={{
        padding: '16px',
        ...bodyStyle
      }}>
        {children}
      </div>
    </div>
  )
}

// 响应式统计卡片网格
interface StatisticGridProps {
  children: React.ReactNode
  className?: string
}

export function StatisticGrid({
  children,
  className = ''
}: StatisticGridProps) {
  return (
    <div className={`responsive-card-spacing ${className}`}>
      {children}
    </div>
  )
}

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
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSearch?: (value: string) => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SearchAndActionBar({
  searchPlaceholder = '搜索...',
  searchValue,
  onSearchChange,
  onSearch,
  filters,
  actions,
  className = ''
}: SearchAndActionBarProps) {
  return (
    <div className={`responsive-search-container ${className}`}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        {/* 搜索框和筛选器容器 */}
        <div>
          {onSearch && (
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onSearch(searchValue || '')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '14px'
              }}
            />
          )}
          {filters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {filters}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="responsive-button-group">
          {actions}
        </div>
      )}
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
  statistics: Array<{
    title: string
    value: number | string
    prefix?: React.ReactNode
    suffix?: string
    precision?: number
    valueStyle?: React.CSSProperties
  }>
  loading?: boolean
  className?: string
}

export function StatisticGrid({
  statistics,
  loading = false,
  className = ''
}: StatisticGridProps) {
  if (loading) {
    return (
      <div className={`responsive-card-spacing ${className}`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              textAlign: 'center'
            }}>
              <div style={{ height: '60px', background: '#f5f5f5', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`responsive-card-spacing ${className}`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statistics.map((stat, index) => (
          <div key={index} style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #f0f0f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              {stat.title}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              ...stat.valueStyle
            }}>
              {stat.prefix}
              {typeof stat.value === 'number' && stat.precision !== undefined
                ? stat.value.toFixed(stat.precision)
                : stat.value}
              {stat.suffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

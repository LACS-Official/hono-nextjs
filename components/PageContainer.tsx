'use client'

import React from 'react'
import { Home } from 'lucide-react'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

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
      className={cn("space-y-6 pb-12", className)}
      style={style}
    >
      {/* 面包屑导航 */}
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                后台
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* 页面头部 */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 text-lg">
            {description}
          </p>
        )}
      </div>

      {/* 页面内容 */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}

// 响应式搜索和操作栏组件
export function SearchAndActionBar({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 mb-6", className)}>
      {children}
    </div>
  )
}

// 响应式表格容器组件
export function ResponsiveTableContainer({
  children,
  className = '',
  style = {}
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div 
      className={cn("rounded-md border bg-white overflow-hidden", className)}
      style={style}
    >
      {children}
    </div>
  )
}

// 响应式卡片组件
export function ResponsiveCard({
  title,
  children,
  className = '',
  style = {},
  bodyStyle = {}
}: {
  title?: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  bodyStyle?: React.CSSProperties
}) {
  return (
    <div 
      className={cn("bg-white rounded-lg border shadow-sm", className)}
      style={style}
    >
      {title && (
        <div className="px-6 py-4 border-bottom font-bold text-lg border-b">
          {title}
        </div>
      )}
      <div className="p-6" style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}

// 响应式统计卡片网格
export function StatisticGrid({
  children,
  className = ''
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  )
}

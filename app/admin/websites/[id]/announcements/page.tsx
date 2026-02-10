'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// 注意:这里复用 SoftwareAnnouncementManager 组件的逻辑
// 实际项目中可以创建一个通用的 AnnouncementManager 组件
export default function WebsiteAnnouncementsPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = parseInt(params.id as string)

  return (
    <div className="space-y-6 pb-24">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/websites">网站管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>公告管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/websites')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8" />
          网站公告管理
        </h2>
      </div>

      {/* 公告管理组件 */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <p className="text-muted-foreground">
          网站公告管理功能正在开发中...
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          提示:可以复用 SoftwareAnnouncementManager 组件的逻辑,创建一个通用的公告管理组件。
        </p>
      </div>
    </div>
  )
}

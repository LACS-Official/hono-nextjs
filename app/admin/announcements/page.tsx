'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Globe,
  AppWindow,
  Plus,
  RefreshCw,
  ArrowRight,
  Pin,
  ExternalLink,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  Search,
  Edit,
  Trash2
} from 'lucide-react'
import dayjs from 'dayjs'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface WebsiteItem {
  id: number
  name: string
  domain: string
  category?: string
  isActive: boolean
  announcementsCount?: number
}

interface SoftwareItem {
  id: number
  name: string
  nameEn?: string
  category?: string
  currentVersion?: string
  isActive: boolean
}

export default function AnnouncementsCenterPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [websites, setWebsites] = useState<WebsiteItem[]>([])
  const [softwareList, setSoftwareList] = useState<SoftwareItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'websites' | 'software'>('websites')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [websitesRes, softwareRes] = await Promise.all([
        fetch('/api/websites'),
        fetch('/api/software?page=1&pageSize=100'),
      ])

      const websitesData = await websitesRes.json()
      const softwareData = await softwareRes.json()

      if (websitesData.success && websitesData.data) {
        setWebsites(websitesData.data.websites || websitesData.data || [])
      }

      if (softwareData.success && softwareData.data) {
        setSoftwareList(softwareData.data.software || softwareData.data || [])
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "数据加载异常",
        description: err.message || "无法拉取网站与软件列表",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredWebsites = websites.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSoftware = softwareList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nameEn && s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 pb-24 max-w-7xl">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>公告管理中心</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 头部标题 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-blue-600" />
            统一公告管理中心
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            集中管理旗下所有网站站点公告与软件客户端系统公告，支持置顶、多类型展示与精准分发。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 核心统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm border-blue-500/20 bg-gradient-to-br from-blue-500/[0.03] to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">网站站点公告</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">
              {websites.length} <span className="text-xs font-normal text-muted-foreground">个已接入网站</span>
            </div>
            <p className="text-xs text-muted-foreground">
              为各个托管站点独立配置前端顶部横幅公告、弹窗提示及更新通知。
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-purple-500/20 bg-gradient-to-br from-purple-500/[0.03] to-transparent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">软件客户端公告</CardTitle>
            <AppWindow className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">
              {softwareList.length} <span className="text-xs font-normal text-muted-foreground">款已收录软件</span>
            </div>
            <p className="text-xs text-muted-foreground">
              为桌面/移动端软件发布维护停机公告、版本升级指引与紧急弹窗。
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索与选项卡 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-2 w-full sm:w-[320px]">
            <TabsTrigger value="websites" className="text-xs flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              网站站点公告 ({websites.length})
            </TabsTrigger>
            <TabsTrigger value="software" className="text-xs flex items-center gap-1.5">
              <AppWindow className="h-3.5 w-3.5" />
              软件客户端公告 ({softwareList.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'websites' ? "搜索网站名称或域名..." : "搜索软件名称或分类..."}
            className="pl-9 h-9 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 选项卡内容：网站站点公告 */}
      {activeTab === 'websites' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWebsites.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">未匹配到任何网站</p>
              </div>
            ) : (
              filteredWebsites.map((item) => (
                <Card key={item.id} className="hover:border-blue-500/40 transition-all shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                        <CardDescription className="font-mono text-xs text-blue-600 dark:text-blue-400">
                          {item.domain}
                        </CardDescription>
                      </div>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                        {item.isActive ? '运行中' : '已暂停'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>分类: {item.category || '未分类'}</span>
                      <span className="font-mono">ID: #{item.id}</span>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => router.push(`/admin/websites/${item.id}/announcements`)}
                      >
                        <Bell className="mr-1.5 h-3.5 w-3.5" />
                        管理该网站公告
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* 选项卡内容：软件客户端公告 */}
      {activeTab === 'software' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSoftware.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <AppWindow className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm">未匹配到任何软件</p>
              </div>
            ) : (
              filteredSoftware.map((item) => (
                <Card key={item.id} className="hover:border-purple-500/40 transition-all shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                        {item.nameEn && (
                          <CardDescription className="text-xs truncate">
                            {item.nameEn}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px]">
                        {item.isActive ? '启用' : '禁用'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>当前版本: {item.currentVersion || '无'}</span>
                      <span className="font-mono">ID: #{item.id}</span>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => router.push(`/admin/software/${item.id}`)}
                      >
                        <Bell className="mr-1.5 h-3.5 w-3.5" />
                        前往管理软件公告
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

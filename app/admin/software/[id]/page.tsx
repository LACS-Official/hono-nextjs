'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Info,
  History,
  Bell,
  ExternalLink,
  Tag as TagIcon,
  Calendar,
  Hash,
  Package,
  FileCode,
  Globe
} from 'lucide-react'

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { DetailSkeleton } from '@/components/SkeletonScreen'

import EnhancedVersionManager from '@/components/EnhancedVersionManager'
import SoftwareAnnouncementManager from '@/components/SoftwareAnnouncementManager'

interface Software {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  latestVersion?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: {
    os?: string[]
    memory?: string
    storage?: string
    processor?: string
    other?: string
  }
  openname?: string
  filetype?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function SoftwareDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [software, setSoftware] = useState<Software | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // 获取软件详情
  const fetchSoftwareDetail = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
      const data = await response.json()

      if (data.success) {
        setSoftware(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "无法加载软件详情",
        })
        router.push('/admin/software')
      }
    } catch (error) {
      console.error('Error fetching software detail:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除软件
  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "删除成功",
          description: "软件已被删除",
        })
        router.push('/admin/software')
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || "未知错误",
        })
      }
    } catch (error) {
      console.error('Error deleting software:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  useEffect(() => {
    if (softwareId) {
      fetchSoftwareDetail()
    }
  }, [softwareId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/software">软件管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>软件详情</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <DetailSkeleton />
      </div>
    )
  }

  if (!software) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>软件不存在</AlertTitle>
          <AlertDescription>
            未找到指定的软件信息
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/admin/software')}>
          返回软件列表
        </Button>
      </div>
    )
  }

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
            <BreadcrumbLink href="/admin/software">软件管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{software.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{software.name}</h2>
            <Badge variant={software.isActive ? "default" : "destructive"} className={software.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
              {software.isActive ? '启用' : '禁用'}
            </Badge>
          </div>
          {software.nameEn && (
            <p className="text-muted-foreground">{software.nameEn}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/software')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <Link href={`/admin/software/${software.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              编辑
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      {/* 禁用状态提示 */}
      {!software.isActive && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>软件已禁用</AlertTitle>
          <AlertDescription>
            此软件当前处于禁用状态,用户无法在前端看到此软件。
          </AlertDescription>
        </Alert>
      )}

      {/* 主要内容区域 */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            软件信息
          </TabsTrigger>
          <TabsTrigger value="versions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            版本管理
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            公告管理
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 左侧主要信息 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">软件ID</p>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline">#{software.id}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">状态</p>
                      <Badge variant={software.isActive ? "default" : "destructive"} className={software.isActive ? "bg-green-500" : ""}>
                        {software.isActive ? '启用' : '禁用'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">中文名称</p>
                      <p className="text-sm">{software.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">英文名称</p>
                      <p className="text-sm">{software.nameEn || '-'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">当前版本</p>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {software.currentVersion}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">最新版本</p>
                      {software.latestVersion ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {software.latestVersion}
                        </Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">自动计算</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">软件分类</p>
                      {software.category ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                          {software.category}
                        </Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">未分类</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">排序顺序</p>
                      <p className="text-sm">{software.sortOrder}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <FileCode className="h-4 w-4" />
                        启动文件
                      </p>
                      {software.openname ? (
                        <Badge variant="outline">{software.openname}</Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        文件类型
                      </p>
                      {software.filetype ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {software.filetype}
                        </Badge>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        创建时间
                      </p>
                      <p className="text-sm">{new Date(software.createdAt).toLocaleString('zh-CN')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        更新时间
                      </p>
                      <p className="text-sm">{new Date(software.updatedAt).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>

                  {software.officialWebsite && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          官方网站
                        </p>
                        <a 
                          href={software.officialWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {software.officialWebsite}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </>
                  )}

                  {software.description && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">中文描述</p>
                        <p className="text-sm leading-relaxed">{software.description}</p>
                      </div>
                    </>
                  )}

                  {software.descriptionEn && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">英文描述</p>
                        <p className="text-sm leading-relaxed">{software.descriptionEn}</p>
                      </div>
                    </>
                  )}

                  {software.tags && software.tags.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <TagIcon className="h-4 w-4" />
                          软件标签
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {software.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 右侧快速操作 */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">快速操作</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/admin/software/${software.id}/edit`} className="block">
                    <Button variant="outline" className="w-full justify-start">
                      <Edit className="mr-2 h-4 w-4" />
                      编辑软件信息
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除软件
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <EnhancedVersionManager
            softwareId={software.id}
            softwareName={software.name}
            onVersionAdded={() => {
              fetchSoftwareDetail()
            }}
          />
        </TabsContent>

        <TabsContent value="announcements">
          <SoftwareAnnouncementManager
            softwareId={software.id}
            softwareName={software.name}
          />
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除软件</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除软件 <strong>{software.name}</strong> 吗？
              <br />
              <span className="text-destructive">
                删除后将无法恢复,相关的版本历史和公告也会被删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "删除中..." : "确定删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
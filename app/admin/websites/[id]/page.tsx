'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Globe,
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
  Bell,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Calendar,
  Layers,
  Info,
  Clock,
  ShieldCheck,
  AlertTriangle
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface WebsiteDetail {
  id: number
  name: string
  domain: string
  description?: string | null
  category?: string | null
  logo?: string | null
  isActive: boolean
  isShowInAboutUs: boolean
  createdAt: string
  updatedAt: string
}

interface WebsiteStats {
  bannersCount: number
  announcementsCount: number
}

export default function WebsiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const websiteId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [website, setWebsite] = useState<WebsiteDetail | null>(null)
  const [stats, setStats] = useState<WebsiteStats>({ bannersCount: 0, announcementsCount: 0 })

  // 编辑弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDomain, setFormDomain] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formLogo, setFormLogo] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // 删除弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchWebsiteData = async () => {
    if (isNaN(websiteId)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/websites/${websiteId}`)
      const data = await res.json()
      if (data.success && data.data?.website) {
        setWebsite(data.data.website)
        if (data.data.stats) {
          setStats(data.data.stats)
        }
      } else {
        toast({
          variant: "destructive",
          title: "获取网站详情失败",
          description: data.error || "网站不存在或已被移除",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message || "无法连接到服务器",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebsiteData()
  }, [websiteId])

  // 打开编辑弹窗
  const handleOpenEdit = () => {
    if (!website) return
    setFormName(website.name)
    setFormDomain(website.domain)
    setFormCategory(website.category || '')
    setFormDescription(website.description || '')
    setFormLogo(website.logo || '')
    setFormIsActive(website.isActive)
    setEditDialogOpen(true)
  }

  // 保存更新
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formDomain.trim()) {
      toast({ variant: "destructive", title: "请填写网站名称和域名" })
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/websites/${websiteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          domain: formDomain.trim(),
          category: formCategory.trim() || null,
          description: formDescription.trim() || null,
          logo: formLogo.trim() || null,
          isActive: formIsActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "网站信息更新成功" })
        setEditDialogOpen(false)
        fetchWebsiteData()
      } else {
        toast({
          variant: "destructive",
          title: "更新失败",
          description: data.error || "无法更新网站信息",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message || "未能完成更新",
      })
    } finally {
      setSaving(false)
    }
  }

  // 确认删除网站
  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/websites/${websiteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast({ title: "网站已成功删除" })
        router.push('/admin/websites')
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || "无法删除网站",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "删除异常",
        description: err.message || "请求超时",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading && !website) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">正在加载网站详情信息...</p>
      </div>
    )
  }

  if (!website) {
    return (
      <div className="space-y-6 pb-24 max-w-5xl">
        <Button variant="ghost" onClick={() => router.push('/admin/websites')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回网站列表
        </Button>
        <Card className="p-8 text-center">
          <Globe className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold">未找到对应网站</h3>
          <p className="text-sm text-muted-foreground mt-1">该网站记录可能已被删除或不存在。</p>
        </Card>
      </div>
    )
  }

  const visitUrl = website.domain.startsWith('http') ? website.domain : `https://${website.domain}`

  return (
    <div className="space-y-6 pb-24 max-w-6xl">
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
            <BreadcrumbPage>{website.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 头部概览卡片 */}
      <div className="p-6 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
              {website.logo ? (
                <img src={website.logo} alt={website.name} className="h-full w-full object-cover" />
              ) : (
                <Globe className="h-7 w-7 text-blue-600" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-bold tracking-tight">{website.name}</h2>
                <Badge variant={website.isActive ? "default" : "secondary"} className={website.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                  {website.isActive ? '运行中 / 启用' : '已暂停 / 禁用'}
                </Badge>
                {website.category && (
                  <Badge variant="outline" className="text-xs">
                    {website.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <a
                  href={visitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 font-mono text-xs text-blue-600 dark:text-blue-400"
                >
                  {website.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span>•</span>
                <span>创建于 {dayjs(website.createdAt).format('YYYY-MM-DD')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchWebsiteData} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenEdit}>
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              编辑信息
            </Button>
            <a href={visitUrl} target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                访问站点
              </Button>
            </a>
          </div>
        </div>

        {website.description && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
            {website.description}
          </p>
        )}
      </div>

      {/* 核心指标与快捷入口 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 轮播图管理入口 */}
        <Card className="hover:border-blue-500/40 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">轮播图与横幅 (Banners)</CardTitle>
            <ImageIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tracking-tight">
              {stats.bannersCount} <span className="text-xs font-normal text-muted-foreground">个横幅</span>
            </div>
            <p className="text-xs text-muted-foreground">
              管理该网站首页展示的大屏轮播、活动横幅与跳转外链。
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push(`/admin/websites/${website.id}/banners`)}
            >
              <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
              进入横幅/轮播图管理
            </Button>
          </CardContent>
        </Card>

        {/* 公告管理入口 */}
        <Card className="hover:border-blue-500/40 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">网站公告 (Announcements)</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tracking-tight">
              {stats.announcementsCount} <span className="text-xs font-normal text-muted-foreground">条公告</span>
            </div>
            <p className="text-xs text-muted-foreground">
              发布维护通知、更新日志、置顶公告或紧急弹窗提示。
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => router.push(`/admin/websites/${website.id}/announcements`)}
            >
              <Bell className="mr-1.5 h-3.5 w-3.5" />
              进入网站公告管理
            </Button>
          </CardContent>
        </Card>

        {/* 站点健康度与设置 */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">站点状态配置</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${website.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="font-semibold text-sm">{website.isActive ? '服务对外正常开放' : '服务暂停访问'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              更新时间: {dayjs(website.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                删除此网站
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细参数展示 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            基础属性与技术规格
          </CardTitle>
          <CardDescription>该网站在平台系统内注册的底层参数与 API 关联信息</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">网站记录 ID</dt>
              <dd className="font-mono text-sm font-semibold mt-1">#{website.id}</dd>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">主域名绑定 (Domain)</dt>
              <dd className="font-mono text-sm font-semibold mt-1 truncate">{website.domain}</dd>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">站点分类</dt>
              <dd className="text-sm font-semibold mt-1">{website.category || '未分类'}</dd>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">Logo 静态地址</dt>
              <dd className="font-mono text-xs mt-1 truncate text-muted-foreground">{website.logo || '未配置'}</dd>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">公告查询 API</dt>
              <dd className="font-mono text-xs mt-1 text-blue-600 truncate">/api/websites/{website.id}/announcements</dd>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border">
              <dt className="text-muted-foreground font-medium">横幅/轮播 API</dt>
              <dd className="font-mono text-xs mt-1 text-blue-600 truncate">/api/websites/{website.id}/banners</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* 编辑网站弹窗 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                编辑网站信息
              </DialogTitle>
              <DialogDescription>修改网站基本资料与访问状态。</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">网站名称 *</label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：领创官网 / 资源导航站"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">网站域名 *</label>
                <Input
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  placeholder="例如：lacs.cc 或 https://lacs.cc"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">站点分类</label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="例如：官网 / 工具站 / 社区"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Logo 图片地址</label>
                <Input
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">网站简介</label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="简述网站定位与功能..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <span className="text-xs font-medium">启用网站</span>
                  <p className="text-[10px] text-muted-foreground">是否对外正常开放访问与提供 API</p>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                保存更改
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              确认彻底删除该网站？
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将级联删除该网站关联的全部横幅轮播图与公告数据，操作不可撤回！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? '正在删除...' : '确认彻底删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

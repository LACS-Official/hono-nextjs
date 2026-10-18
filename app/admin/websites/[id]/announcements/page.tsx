'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Bell,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Pin,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Eye,
  SlidersHorizontal,
  ExternalLink
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface WebsiteAnnouncement {
  id: number
  websiteId: number
  title: string
  content: string
  type: 'info' | 'warning' | 'error' | 'success'
  isSticky: boolean
  sortOrder: number
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  isPublished: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface WebsiteInfo {
  id: number
  name: string
  domain: string
}

export default function WebsiteAnnouncementsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const websiteId = parseInt(params.id as string)

  const [loading, setLoading] = useState(false)
  const [website, setWebsite] = useState<WebsiteInfo | null>(null)
  const [announcements, setAnnouncements] = useState<WebsiteAnnouncement[]>([])

  // 筛选状态
  const [filterType, setFilterType] = useState('all')
  const [filterPublished, setFilterPublished] = useState('all')
  const [filterActive, setFilterActive] = useState('all')

  // 弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WebsiteAnnouncement | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 删除对话框状态
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 表单状态
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState<'info' | 'warning' | 'error' | 'success'>('info')
  const [formIsSticky, setFormIsSticky] = useState(false)
  const [formSortOrder, setFormSortOrder] = useState('0')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formIsPublished, setFormIsPublished] = useState(true)

  // 获取网站基本信息
  const fetchWebsiteInfo = async () => {
    try {
      const res = await fetch(`/api/websites/${websiteId}`)
      const data = await res.json()
      if (data.success && data.data?.website) {
        setWebsite(data.data.website)
      }
    } catch {}
  }

  // 获取公告列表
  const fetchAnnouncements = async () => {
    if (isNaN(websiteId)) return
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (filterType !== 'all') q.set('type', filterType)
      if (filterPublished !== 'all') q.set('published', filterPublished)
      if (filterActive !== 'all') q.set('active', filterActive)

      const res = await fetch(`/api/websites/${websiteId}/announcements?${q.toString()}`)
      const data = await res.json()
      if (data.success && data.data) {
        setAnnouncements(data.data.announcements || [])
        if (data.data.website) {
          setWebsite(data.data.website)
        }
      } else {
        toast({
          variant: "destructive",
          title: "加载公告列表失败",
          description: data.error || "无法获取网站公告数据",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "网络请求异常",
        description: err.message || "无法连接到服务器",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWebsiteInfo()
    fetchAnnouncements()
  }, [websiteId, filterType, filterPublished, filterActive])

  // 打开创建弹窗
  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormTitle('')
    setFormContent('')
    setFormType('info')
    setFormIsSticky(false)
    setFormSortOrder('0')
    setFormIsActive(true)
    setFormIsPublished(true)
    setDialogOpen(true)
  }

  // 打开编辑弹窗
  const handleOpenEdit = (item: WebsiteAnnouncement) => {
    setEditingItem(item)
    setFormTitle(item.title)
    setFormContent(item.content)
    setFormType(item.type)
    setFormIsSticky(item.isSticky)
    setFormSortOrder(String(item.sortOrder || 0))
    setFormIsActive(item.isActive)
    setFormIsPublished(item.isPublished)
    setDialogOpen(true)
  }

  // 保存（创建或更新）
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast({ variant: "destructive", title: "请填写公告标题" })
      return
    }
    if (!formContent.trim()) {
      toast({ variant: "destructive", title: "请填写公告内容" })
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        isSticky: formIsSticky,
        sortOrder: parseInt(formSortOrder) || 0,
        isActive: formIsActive,
        isPublished: formIsPublished,
      }

      let res
      if (editingItem) {
        res = await fetch(`/api/websites/${websiteId}/announcements/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/websites/${websiteId}/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (data.success) {
        toast({
          title: editingItem ? "公告更新成功" : "公告创建成功",
          description: editingItem ? "已保存最新的公告内容" : "新公告已就绪",
        })
        setDialogOpen(false)
        fetchAnnouncements()
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: data.error || "未能完成公告保存操作",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message || "网络异常，未能保存",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/websites/${websiteId}/announcements/${deleteTargetId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "删除成功", description: "该网站公告已移除" })
        setDeleteTargetId(null)
        fetchAnnouncements()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || "无法删除公告",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "删除异常",
        description: err.message || "请求失败",
      })
    } finally {
      setDeleting(false)
    }
  }

  // 快捷切换状态
  const handleTogglePublished = async (item: WebsiteAnnouncement) => {
    try {
      const res = await fetch(`/api/websites/${websiteId}/announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !item.isPublished }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: item.isPublished ? "公告已下线" : "公告已公开发布" })
        fetchAnnouncements()
      }
    } catch {}
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200">警告</Badge>
      case 'error':
        return <Badge variant="destructive" className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200">紧急</Badge>
      case 'success':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200">成功</Badge>
      default:
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200">通知</Badge>
    }
  }

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
            <BreadcrumbLink href="/admin/websites">网站管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/admin/websites/${websiteId}`}>{website?.name || `网站 #${websiteId}`}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>公告管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 头部区 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/websites')} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
              <Bell className="h-7 w-7 text-blue-600" />
              网站公告管理
            </h2>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            {website ? `正在管理「${website.name}」(${website.domain}) 的站点公告` : `正在管理网站 #${websiteId} 的站点公告`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-1.5 h-4 w-4" />
            新增网站公告
          </Button>
        </div>
      </div>

      {/* 筛选与状态栏 */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              筛选条件:
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="公告类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有类型</SelectItem>
                <SelectItem value="info">常规通知 (info)</SelectItem>
                <SelectItem value="warning">提醒警示 (warning)</SelectItem>
                <SelectItem value="error">紧急通知 (error)</SelectItem>
                <SelectItem value="success">利好/更新 (success)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPublished} onValueChange={setFilterPublished}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="发布状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有发布状态</SelectItem>
                <SelectItem value="true">已公开发布</SelectItem>
                <SelectItem value="false">草稿/未发布</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="启用状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有启用状态</SelectItem>
                <SelectItem value="true">已启用</SelectItem>
                <SelectItem value="false">已禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">
            当前共有 <span className="font-semibold text-foreground">{announcements.length}</span> 条公告
          </div>
        </CardContent>
      </Card>

      {/* 公告表格 */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[80px]">排序/置顶</TableHead>
              <TableHead className="w-[100px]">类型</TableHead>
              <TableHead>公告标题与内容</TableHead>
              <TableHead className="w-[100px]">启用状态</TableHead>
              <TableHead className="w-[100px]">发布状态</TableHead>
              <TableHead className="w-[140px]">发布时间</TableHead>
              <TableHead className="text-right w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span>正在加载网站公告...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Bell className="h-8 w-8 text-slate-300" />
                      <span>该网站暂无公告记录，点击右上角「新增网站公告」发布第一条公告</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      {item.isSticky && (
                        <span title="置顶公告" className="text-orange-500">
                          <Pin className="h-3.5 w-3.5 fill-current" />
                        </span>
                      )}
                      <span>#{item.sortOrder}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(item.type)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 py-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.isSticky && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-orange-300 text-orange-600">
                            置顶
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed whitespace-pre-wrap">
                        {item.content}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? "default" : "secondary"} className="text-xs">
                      {item.isActive ? '已启用' : '已禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleTogglePublished(item)}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      title="点击快捷切换发布状态"
                    >
                      <Badge
                        variant={item.isPublished ? "outline" : "secondary"}
                        className={item.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}
                      >
                        {item.isPublished ? '已发布' : '草稿'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleOpenEdit(item)}
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                        onClick={() => setDeleteTargetId(item.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 新增/编辑公告弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                {editingItem ? '编辑网站公告' : '新增网站公告'}
              </DialogTitle>
              <DialogDescription>
                公告将实时同步在网站端与相关客户端的公告展示窗口。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">公告标题 *</label>
                <Input
                  placeholder="例如：系统维护通知 / 全新服务上线..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">公告类型</label>
                  <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">常规通知 (Info)</SelectItem>
                      <SelectItem value="warning">提醒警示 (Warning)</SelectItem>
                      <SelectItem value="error">重大警报 (Error)</SelectItem>
                      <SelectItem value="success">好消息/更新 (Success)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">排序权重 (数字越大越靠前)</label>
                  <Input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">公告内容 (支持多行文本) *</label>
                <Textarea
                  placeholder="请输入公告详细内容..."
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium">置顶展示</span>
                    <p className="text-[10px] text-muted-foreground">优先显示在最顶部</p>
                  </div>
                  <Switch checked={formIsSticky} onCheckedChange={setFormIsSticky} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium">公开发布</span>
                    <p className="text-[10px] text-muted-foreground">对访客可见</p>
                  </div>
                  <Switch checked={formIsPublished} onCheckedChange={setFormIsPublished} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium">启用状态</span>
                    <p className="text-[10px] text-muted-foreground">是否有效生效</p>
                  </div>
                  <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {submitting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingItem ? '保存修改' : '立即创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除该网站公告？
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可逆。删除后该公告将立即停止在网站前端展示。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? '正在删除...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

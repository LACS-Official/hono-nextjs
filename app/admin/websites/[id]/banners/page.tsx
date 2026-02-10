'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  Globe,
  RefreshCw,
  ArrowLeft,
  BarChart
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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

interface Banner {
  id: number
  websiteId: number
  title: string
  subtitle?: string
  description?: string
  imageUrl: string
  imageAlt?: string
  linkUrl?: string
  linkTarget: string
  position: string
  sortOrder: number
  style?: any
  displayConditions?: any
  isActive: boolean
  isPublished: boolean
  viewCount: number
  clickCount: number
  createdAt: string
  updatedAt: string
}

interface Website {
  id: number
  name: string
  domain: string
}

// 表单验证 schema
const bannerFormSchema = z.object({
  title: z.string().min(1, '请输入标题'),
  description: z.string().optional(),
  imageUrl: z.string().url('请输入有效的图片URL'),
  imageAlt: z.string().optional(),
  linkUrl: z.string().url('请输入有效的链接URL').optional().or(z.literal('')),
  linkTarget: z.enum(['_self', '_blank']).default('_self'),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  isPublished: z.boolean().default(true),
})

type BannerFormValues = z.infer<typeof bannerFormSchema>

export default function BannersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const websiteId = parseInt(params.id as string)

  const [website, setWebsite] = useState<Website | null>(null)
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null)

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      imageAlt: '',
      linkUrl: '',
      linkTarget: '_self',
      sortOrder: 0,
      isActive: true,
      isPublished: true,
    },
  })

  // 获取轮播图列表
  const fetchBanners = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/websites/${websiteId}/banners`)
      const data = await response.json()

      if (data.success) {
        setWebsite(data.data.website)
        setBanners(data.data.banners)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "获取轮播图列表失败",
        })
      }
    } catch (error) {
      console.error('获取轮播图列表失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (websiteId) {
      fetchBanners()
    }
  }, [websiteId])

  // 处理编辑
  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner)
    form.reset({
      title: banner.title,
      description: banner.description || '',
      imageUrl: banner.imageUrl,
      imageAlt: banner.imageAlt || '',
      linkUrl: banner.linkUrl || '',
      linkTarget: banner.linkTarget as '_self' | '_blank',
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
      isPublished: banner.isPublished,
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const response = await fetch(`/api/websites/${websiteId}/banners/${deleteTarget}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "删除成功",
          description: "轮播图已删除",
        })
        fetchBanners()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || '删除失败',
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // 处理提交
  const handleSubmit = async (values: BannerFormValues) => {
    try {
      let response
      if (editingBanner) {
        response = await fetch(`/api/websites/${websiteId}/banners/${editingBanner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch(`/api/websites/${websiteId}/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: editingBanner ? "更新成功" : "创建成功",
          description: editingBanner ? '轮播图更新成功' : '轮播图创建成功',
        })
        setModalVisible(false)
        setEditingBanner(null)
        form.reset()
        fetchBanners()
      } else {
        toast({
          variant: "destructive",
          title: editingBanner ? "更新失败" : "创建失败",
          description: data.error || '操作失败',
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    }
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
            <BreadcrumbLink href="/admin/websites">网站管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>轮播图管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/websites')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ImageIcon className="h-8 w-8" />
              轮播图管理
            </h2>
          </div>
          <p className="text-muted-foreground ml-10">
            {website ? `${website.name} - ${website.domain}` : '加载中...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBanners} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => {
            setEditingBanner(null)
            form.reset()
            setModalVisible(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            添加轮播图
          </Button>
        </div>
      </div>

      {/* 轮播图列表 */}
      <Card>
        <CardHeader>
          <CardTitle>轮播图列表</CardTitle>
          <CardDescription>共 {banners.length} 个轮播图</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">轮播图</TableHead>
                <TableHead>标题信息</TableHead>
                <TableHead className="w-[80px]">排序</TableHead>
                <TableHead className="w-[120px]">状态</TableHead>
                <TableHead className="w-[100px]">统计</TableHead>
                <TableHead className="w-[150px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无轮播图数据
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <img
                        src={banner.imageUrl}
                        alt={banner.imageAlt || banner.title}
                        className="w-[100px] h-[60px] object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{banner.title}</div>
                        {banner.description && (
                          <div className="text-xs text-muted-foreground max-w-[300px] truncate">
                            {banner.description}
                          </div>
                        )}
                        {banner.linkUrl && (
                          <div className="text-xs text-blue-500 truncate max-w-[300px]">
                            链接: {banner.linkUrl}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{banner.sortOrder}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                          {banner.isActive ? '启用' : '禁用'}
                        </Badge>
                        <Badge variant={banner.isPublished ? 'default' : 'secondary'}>
                          {banner.isPublished ? '已发布' : '草稿'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {banner.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart className="h-3 w-3" />
                          {banner.clickCount}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreviewBanner(banner)
                            setPreviewDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(banner.id)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 添加/编辑轮播图对话框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBanner ? '编辑轮播图' : '添加轮播图'}</DialogTitle>
            <DialogDescription>
              {editingBanner ? '修改轮播图信息' : '创建新的轮播图'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入轮播图标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>图片URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>图片描述</FormLabel>
                    <FormControl>
                      <Input placeholder="图片alt文本（用于SEO和无障碍访问）" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="轮播图描述"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>最多500个字符</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="linkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>链接URL</FormLabel>
                      <FormControl>
                        <Input placeholder="点击跳转链接（可选）" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkTarget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>链接打开方式</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择打开方式" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_self">当前窗口</SelectItem>
                          <SelectItem value="_blank">新窗口</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排序</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="数字越小越靠前"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>启用状态</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>发布状态</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalVisible(false)
                    setEditingBanner(null)
                    form.reset()
                  }}
                >
                  取消
                </Button>
                <Button type="submit">
                  {editingBanner ? '更新' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewBanner?.title}</DialogTitle>
          </DialogHeader>
          {previewBanner && (
            <div className="space-y-4">
              <img
                src={previewBanner.imageUrl}
                alt={previewBanner.imageAlt || previewBanner.title}
                className="w-full rounded-lg"
              />
              {previewBanner.description && (
                <div>
                  <strong>描述：</strong>
                  <p className="mt-1 text-sm text-muted-foreground">{previewBanner.description}</p>
                </div>
              )}
              {previewBanner.linkUrl && (
                <div>
                  <strong>链接：</strong>
                  <a
                    href={previewBanner.linkUrl}
                    target={previewBanner.linkTarget}
                    className="ml-2 text-blue-500 hover:underline"
                  >
                    {previewBanner.linkUrl}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这个轮播图吗?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

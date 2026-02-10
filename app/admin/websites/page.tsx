'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Bell,
  Image as ImageIcon,
  Globe,
  RefreshCw,
  ExternalLink
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface Website {
  id: number
  name: string
  domain: string
  description?: string
  category?: string
  logo?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 表单验证 schema
const websiteFormSchema = z.object({
  name: z.string().min(1, '请输入网站名称'),
  domain: z.string().min(1, '请输入域名'),
  description: z.string().optional(),
  category: z.string().optional(),
  logo: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

type WebsiteFormValues = z.infer<typeof websiteFormSchema>

export default function WebsitesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const form = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteFormSchema),
    defaultValues: {
      name: '',
      domain: '',
      description: '',
      category: '',
      logo: '',
      isActive: true,
    },
  })

  // 获取网站列表
  const fetchWebsites = async (page = 1, pageSize = 10, search = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search })
      })

      const response = await fetch(`/api/websites?${params}`)
      const data = await response.json()

      if (data.success) {
        setWebsites(data.data.websites)
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        })
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "获取网站列表失败",
        })
      }
    } catch (error) {
      console.error('获取网站列表失败:', error)
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
    fetchWebsites()
  }, [])

  // 处理编辑
  const handleEdit = (website: Website) => {
    setEditingWebsite(website)
    form.reset({
      name: website.name,
      domain: website.domain,
      description: website.description || '',
      category: website.category || '',
      logo: website.logo || '',
      isActive: website.isActive,
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const response = await fetch(`/api/websites/${deleteTarget}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "删除成功",
          description: "网站已删除",
        })
        fetchWebsites(pagination.current, pagination.pageSize)
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
  const handleSubmit = async (values: WebsiteFormValues) => {
    try {
      let response
      if (editingWebsite) {
        response = await fetch(`/api/websites/${editingWebsite.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch('/api/websites', {
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
          title: editingWebsite ? "更新成功" : "创建成功",
          description: editingWebsite ? '网站更新成功' : '网站创建成功',
        })
        setModalVisible(false)
        setEditingWebsite(null)
        form.reset()
        fetchWebsites(pagination.current, pagination.pageSize)
      } else {
        toast({
          variant: "destructive",
          title: editingWebsite ? "更新失败" : "创建失败",
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
            <BreadcrumbPage>网站管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8" />
            网站管理
          </h2>
          <p className="text-muted-foreground">
            管理所有网站及其相关内容
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchWebsites()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => {
            setEditingWebsite(null)
            form.reset()
            setModalVisible(true)
          }}>
            <Plus className="mr-2 h-4 w-4" />
            添加网站
          </Button>
        </div>
      </div>

      {/* 网站列表 */}
      <Card>
        <CardHeader>
          <CardTitle>网站列表</CardTitle>
          <CardDescription>共 {pagination.total} 个网站</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>网站信息</TableHead>
                <TableHead className="w-[100px]">分类</TableHead>
                <TableHead className="w-[100px]">状态</TableHead>
                <TableHead className="w-[120px]">创建时间</TableHead>
                <TableHead className="w-[200px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : websites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无网站数据
                  </TableCell>
                </TableRow>
              ) : (
                websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          {website.logo && (
                            <img 
                              src={website.logo} 
                              alt={website.name}
                              className="w-6 h-6 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          )}
                          <Globe className="h-4 w-4 text-blue-500" />
                          {website.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{website.domain}</div>
                        {website.description && (
                          <div className="text-xs text-muted-foreground max-w-[300px] truncate">
                            {website.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {website.category ? (
                        <Badge variant="secondary">{website.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">未分类</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={website.isActive ? 'default' : 'secondary'}>
                        {website.isActive ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(website.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/websites/${website.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>查看详情</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/websites/${website.id}/announcements`)}
                              >
                                <Bell className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>公告管理</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/websites/${website.id}/banners`)}
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>轮播图管理</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(website)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(website.id)
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

      {/* 添加/编辑网站对话框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWebsite ? '编辑网站' : '添加网站'}</DialogTitle>
            <DialogDescription>
              {editingWebsite ? '修改网站信息' : '创建新的网站'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>网站名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入网站名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>域名</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>网站分类</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择网站分类" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="blog">博客</SelectItem>
                          <SelectItem value="forum">论坛</SelectItem>
                          <SelectItem value="shop">商店</SelectItem>
                          <SelectItem value="service">服务</SelectItem>
                          <SelectItem value="portfolio">作品集</SelectItem>
                          <SelectItem value="news">新闻</SelectItem>
                          <SelectItem value="education">教育</SelectItem>
                          <SelectItem value="entertainment">娱乐</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo图片URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网站描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入网站描述，简要介绍网站的功能和特色"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      最多500个字符
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>启用状态</FormLabel>
                      <FormDescription>
                        启用后网站将对外可见
                      </FormDescription>
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalVisible(false)
                    setEditingWebsite(null)
                    form.reset()
                  }}
                >
                  取消
                </Button>
                <Button type="submit">
                  {editingWebsite ? '更新' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这个网站吗?</AlertDialogTitle>
            <AlertDialogDescription>
              删除后将无法恢复,相关的轮播图、页面等数据也会被删除。
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

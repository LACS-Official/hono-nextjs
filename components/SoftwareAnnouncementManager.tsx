'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import dayjs from 'dayjs'
import {
  Plus,
  Edit,
  Trash2,
  Bell,
  Pin,
  RefreshCw
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

interface SoftwareAnnouncement {
  id: number
  softwareId: number
  title: string
  titleEn?: string
  content: string
  contentEn?: string
  type: 'general' | 'update' | 'security' | 'maintenance' | 'feature' | 'bugfix'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  version?: string
  isPublished: boolean
  isSticky?: boolean
  publishedAt?: string
  expiresAt?: string
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface SoftwareAnnouncementManagerProps {
  softwareId: number
  softwareName: string
}

// 表单验证 schema
const announcementFormSchema = z.object({
  title: z.string().min(1, '请输入公告标题'),
  titleEn: z.string().optional(),
  content: z.string().min(1, '请输入公告内容'),
  contentEn: z.string().optional(),
  type: z.enum(['general', 'update', 'security', 'maintenance', 'feature', 'bugfix']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  version: z.string().optional(),
  isSticky: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
})

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

const SoftwareAnnouncementManager: React.FC<SoftwareAnnouncementManagerProps> = ({ 
  softwareId, 
  softwareName 
}) => {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<SoftwareAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<SoftwareAnnouncement | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: '',
      titleEn: '',
      content: '',
      contentEn: '',
      type: 'general',
      priority: 'normal',
      version: '',
      isSticky: false,
      isPublished: true,
      publishedAt: '',
      expiresAt: '',
    },
  })

  // 获取公告列表
  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements`)
      const data = await response.json()

      if (data.success) {
        setAnnouncements(data.data?.announcements || [])
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "获取公告列表失败",
        })
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新公告
  const handleSubmit = async (values: AnnouncementFormValues) => {
    try {
      const method = editingAnnouncement ? 'PUT' : 'POST'
      const url = editingAnnouncement 
        ? `${API_BASE_URL}/software/id/${softwareId}/announcements/${editingAnnouncement.id}`
        : `${API_BASE_URL}/software/id/${softwareId}/announcements`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: editingAnnouncement ? "更新成功" : "创建成功",
          description: editingAnnouncement ? '公告更新成功' : '公告创建成功',
        })
        setModalVisible(false)
        form.reset()
        setEditingAnnouncement(null)
        fetchAnnouncements()
      } else {
        toast({
          variant: "destructive",
          title: editingAnnouncement ? "更新失败" : "创建失败",
          description: data.error || (editingAnnouncement ? '公告更新失败' : '公告创建失败'),
        })
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    }
  }

  // 删除公告
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/announcements/${deleteTarget}`, {
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
          description: "公告已删除",
        })
        fetchAnnouncements()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || '公告删除失败',
        })
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
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

  // 打开编辑模态框
  const handleEdit = (announcement: SoftwareAnnouncement) => {
    setEditingAnnouncement(announcement)
    form.reset({
      title: announcement.title,
      titleEn: announcement.titleEn || '',
      content: announcement.content,
      contentEn: announcement.contentEn || '',
      type: announcement.type,
      priority: announcement.priority,
      version: announcement.version || '',
      isSticky: announcement.isSticky || false,
      isPublished: announcement.isPublished,
      publishedAt: announcement.publishedAt ? dayjs(announcement.publishedAt).format('YYYY-MM-DDTHH:mm') : '',
      expiresAt: announcement.expiresAt ? dayjs(announcement.expiresAt).format('YYYY-MM-DDTHH:mm') : '',
    })
    setModalVisible(true)
  }

  // 打开创建模态框
  const handleCreate = () => {
    setEditingAnnouncement(null)
    form.reset()
    setModalVisible(true)
  }

  useEffect(() => {
    if (softwareId) {
      fetchAnnouncements()
    }
  }, [softwareId])

  const typeConfig: Record<string, { color: string; label: string }> = {
    general: { color: 'bg-gray-100 text-gray-800', label: '一般' },
    update: { color: 'bg-blue-100 text-blue-800', label: '更新' },
    security: { color: 'bg-red-100 text-red-800', label: '安全' },
    maintenance: { color: 'bg-orange-100 text-orange-800', label: '维护' },
    feature: { color: 'bg-green-100 text-green-800', label: '功能' },
    bugfix: { color: 'bg-purple-100 text-purple-800', label: '修复' }
  }

  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: 'bg-gray-100 text-gray-800', label: '低' },
    normal: { color: 'bg-blue-100 text-blue-800', label: '普通' },
    high: { color: 'bg-orange-100 text-orange-800', label: '高' },
    urgent: { color: 'bg-red-100 text-red-800', label: '紧急' }
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              软件公告管理
            </CardTitle>
            <CardDescription>管理 {softwareName} 的公告信息</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAnnouncements} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              添加公告
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-[100px]">类型</TableHead>
                  <TableHead className="w-[100px]">优先级</TableHead>
                  <TableHead className="w-[120px]">状态</TableHead>
                  <TableHead className="w-[100px]">版本</TableHead>
                  <TableHead className="w-[120px]">发布时间</TableHead>
                  <TableHead className="w-[120px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : (
                  announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{announcement.title}</div>
                          {announcement.titleEn && (
                            <div className="text-xs text-muted-foreground">{announcement.titleEn}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={typeConfig[announcement.type]?.color}>
                          {typeConfig[announcement.type]?.label || announcement.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={priorityConfig[announcement.priority]?.color}>
                          {priorityConfig[announcement.priority]?.label || announcement.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={announcement.isPublished ? 'default' : 'secondary'}>
                            {announcement.isPublished ? '已发布' : '未发布'}
                          </Badge>
                          {announcement.isSticky && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              <Pin className="mr-1 h-3 w-3" />
                              置顶
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {announcement.version ? (
                          <Badge variant="outline">{announcement.version}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {announcement.publishedAt 
                          ? dayjs(announcement.publishedAt).format('YYYY-MM-DD') 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(announcement.id)
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
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无公告</h3>
              <p className="text-sm text-muted-foreground mb-4">
                还没有添加任何公告,点击下方按钮添加第一个公告
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                添加第一个公告
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑公告对话框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {editingAnnouncement ? '编辑公告' : '添加公告'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? '修改公告信息' : '创建新的软件公告'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公告标题</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入公告标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titleEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公告标题 (英文)</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入英文公告标题" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>公告类型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择公告类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">一般公告</SelectItem>
                          <SelectItem value="update">更新通知</SelectItem>
                          <SelectItem value="security">安全公告</SelectItem>
                          <SelectItem value="maintenance">维护通知</SelectItem>
                          <SelectItem value="feature">功能介绍</SelectItem>
                          <SelectItem value="bugfix">修复通知</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>优先级</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择优先级" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">低优先级</SelectItem>
                          <SelectItem value="normal">普通优先级</SelectItem>
                          <SelectItem value="high">高优先级</SelectItem>
                          <SelectItem value="urgent">紧急优先级</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公告内容</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入公告内容"
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contentEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>公告内容 (英文)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入英文公告内容"
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>关联版本</FormLabel>
                      <FormControl>
                        <Input placeholder="例如: 1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSticky"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-2">
                      <div className="space-y-0.5">
                        <FormLabel>是否置顶</FormLabel>
                        <FormDescription>置顶的公告会显示在列表顶部</FormDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>发布时间</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>过期时间</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>是否发布</FormLabel>
                      <FormDescription>发布后公告将对用户可见</FormDescription>
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
                    form.reset()
                    setEditingAnnouncement(null)
                  }}
                >
                  取消
                </Button>
                <Button type="submit">
                  {editingAnnouncement ? '更新公告' : '创建公告'}
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
            <AlertDialogTitle>确认删除公告</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条公告吗?此操作不可撤销。
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

export default SoftwareAnnouncementManager
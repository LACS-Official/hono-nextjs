'use client'

import { useState, useEffect } from 'react'
import {
  Contact,
  Users,
  Globe,
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// 类型定义
interface ContactInfo {
  id: number
  title: string
  description: string
  info: string
  action: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface GroupChat {
  id: number
  name: string
  limit: string
  groupNumber: string
  qrcode: string
  joinLink: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface MediaPlatform {
  id: number
  name: string
  logo: string
  account: string
  accountId: string
  qrcode: string
  qrcodeTitle: string
  qrcodeDesc: string
  link: string
  analyticsEvent: string
  createdAt: string
  updatedAt: string
}

interface Project {
  id: number
  category: string
  categoryName: string
  title: string
  description: string
  platform: string
  updateDate: string
  link: string
  icon: string
  pLanguage: string[]
  createdAt: string
  updatedAt: string
}

// Zod Schemas
const contactSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  description: z.string().min(1, "请输入描述"),
  info: z.string().min(1, "请输入联系信息"),
  action: z.string().url("请输入有效的 URL").or(z.string().min(1, "请输入链接")),
  analyticsEvent: z.string().optional(),
})

const groupSchema = z.object({
  name: z.string().min(1, "请输入群名称"),
  limit: z.string().min(1, "请输入人数限制"),
  groupNumber: z.string().min(1, "请输入群号"),
  qrcode: z.string().optional(),
  joinLink: z.string().url("请输入有效的 URL").or(z.string().min(1, "请输入链接")),
  analyticsEvent: z.string().optional(),
})

const mediaSchema = z.object({
  name: z.string().min(1, "请输入平台名称"),
  logo: z.string().optional(),
  account: z.string().min(1, "请输入账号名称"),
  accountId: z.string().min(1, "请输入账号ID"),
  qrcode: z.string().optional(),
  qrcodeTitle: z.string().optional(),
  qrcodeDesc: z.string().optional(),
  link: z.string().url("请输入有效的 URL").or(z.string().min(1, "请输入链接")),
  analyticsEvent: z.string().optional(),
})

const projectSchema = z.object({
  category: z.string().min(1, "请输入分类标识"),
  categoryName: z.string().min(1, "请输入分类名称"),
  title: z.string().min(1, "请输入项目标题"),
  description: z.string().min(1, "请输入项目描述"),
  platform: z.string().min(1, "请输入适用平台"),
  updateDate: z.string().min(1, "请选择更新日期"),
  link: z.string().url("请输入有效的 URL").or(z.string().min(1, "请输入链接")),
  icon: z.string().optional(),
  pLanguage: z.string().min(1, "请输入编程语言 (以逗号分隔)"),
})

export default function InfoManagementPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('contact')
  
  // 核心状态
  const [contactData, setContactData] = useState<ContactInfo[]>([])
  const [groupChatData, setGroupChatData] = useState<GroupChat[]>([])
  const [mediaPlatformData, setMediaPlatformData] = useState<MediaPlatform[]>([])
  const [projectData, setProjectData] = useState<Project[]>([])
  
  const [loading, setLoading] = useState({
    contact: false,
    group: false,
    media: false,
    project: false
  })

  // 弹窗状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number | string } | null>(null)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<{ type: string; data: any } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 表单初始化
  const contactForm = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: { title: '', description: '', info: '', action: '', analyticsEvent: '' }
  })
  const groupForm = useForm<z.infer<typeof groupSchema>>({
    resolver: zodResolver(groupSchema) as any,
    defaultValues: { name: '', limit: '', groupNumber: '', qrcode: '', joinLink: '', analyticsEvent: '' }
  })
  const mediaForm = useForm<z.infer<typeof mediaSchema>>({
    resolver: zodResolver(mediaSchema) as any,
    defaultValues: { name: '', logo: '', account: '', accountId: '', qrcode: '', qrcodeTitle: '', qrcodeDesc: '', link: '', analyticsEvent: '' }
  })
  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: { category: '', categoryName: '', title: '', description: '', platform: '', updateDate: '', link: '', icon: '', pLanguage: '' }
  })

  // ==================== 数据获取 ====================
  const fetchContactData = async () => {
    setLoading(prev => ({ ...prev, contact: true }))
    try {
      const response = await fetch('/api/info-management/contact-info')
      const result = await response.json()
      if (result.success) setContactData(result.data)
    } catch (error) {
      console.error('获取联系方式失败:', error)
    } finally {
      setLoading(prev => ({ ...prev, contact: false }))
    }
  }

  const fetchGroupChatData = async () => {
    setLoading(prev => ({ ...prev, group: true }))
    try {
      const response = await fetch('/api/info-management/group-chats')
      const result = await response.json()
      if (result.success) setGroupChatData(result.data)
    } catch (error) {
      console.error('获取群聊信息失败:', error)
    } finally {
      setLoading(prev => ({ ...prev, group: false }))
    }
  }

  const fetchMediaPlatformData = async () => {
    setLoading(prev => ({ ...prev, media: true }))
    try {
      const response = await fetch('/api/info-management/media-platforms')
      const result = await response.json()
      if (result.success) setMediaPlatformData(result.data)
    } catch (error) {
      console.error('获取媒体平台失败:', error)
    } finally {
      setLoading(prev => ({ ...prev, media: false }))
    }
  }

  const fetchProjectData = async () => {
    setLoading(prev => ({ ...prev, project: true }))
    try {
      const response = await fetch('/api/info-management/projects')
      const result = await response.json()
      if (result.success) setProjectData(result.data)
    } catch (error) {
      console.error('获取项目信息失败:', error)
    } finally {
      setLoading(prev => ({ ...prev, project: false }))
    }
  }

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'contact') fetchContactData()
    else if (activeTab === 'group') fetchGroupChatData()
    else if (activeTab === 'media') fetchMediaPlatformData()
    else if (activeTab === 'project') fetchProjectData()
  }, [activeTab])

  // ==================== 操作处理 ====================
  const handleEdit = (type: string, data: any) => {
    setEditingItem({ type, data })
    if (type === 'contact') {
      contactForm.reset({ ...data })
    } else if (type === 'group') {
      groupForm.reset({ ...data })
    } else if (type === 'media') {
      mediaForm.reset({ ...data })
    } else if (type === 'project') {
      projectForm.reset({ 
        ...data, 
        pLanguage: Array.isArray(data.pLanguage) ? data.pLanguage.join(', ') : data.pLanguage 
      })
    }
    setEditModalOpen(true)
  }

  const handleAddNew = (type: string) => {
    setEditingItem({ type, data: null })
    if (type === 'contact') contactForm.reset({ title: '', description: '', info: '', action: '', analyticsEvent: '' })
    else if (type === 'group') groupForm.reset({ name: '', limit: '', groupNumber: '', qrcode: '', joinLink: '', analyticsEvent: '' })
    else if (type === 'media') mediaForm.reset({ name: '', logo: '', account: '', accountId: '', qrcode: '', qrcodeTitle: '', qrcodeDesc: '', link: '', analyticsEvent: '' })
    else if (type === 'project') projectForm.reset({ category: '', categoryName: '', title: '', description: '', platform: '', updateDate: '', link: '', icon: '', pLanguage: '' })
    setEditModalOpen(true)
  }

  const onSave = async (values: any) => {
    if (!editingItem) return
    setSubmitting(true)
    try {
      const { type, data } = editingItem
      const isEdit = !!data
      
      let url = ''
      if (type === 'contact') url = '/api/info-management/contact-info'
      else if (type === 'group') url = '/api/info-management/group-chats'
      else if (type === 'media') url = '/api/info-management/media-platforms'
      else if (type === 'project') url = '/api/info-management/projects'

      const finalUrl = isEdit ? `${url}/${data.id}` : url
      const method = isEdit ? 'PUT' : 'POST'

      // 特殊处理项目语言
      if (type === 'project') {
        values.pLanguage = values.pLanguage.split(',').map((s: string) => s.trim()).filter(Boolean)
      }

      const response = await fetch(finalUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const result = await response.json()
      if (result.success) {
        toast({ title: isEdit ? "修改成功" : "添加成功" })
        setEditModalOpen(false)
        if (type === 'contact') fetchContactData()
        else if (type === 'group') fetchGroupChatData()
        else if (type === 'media') fetchMediaPlatformData()
        else if (type === 'project') fetchProjectData()
      } else {
        toast({ variant: "destructive", title: "保存失败", description: result.error })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "请求失败", description: "发生了一些错误" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const { type, id } = deleteTarget
    try {
      let url = ''
      if (type === 'contact') url = `/api/info-management/contact-info/${id}`
      else if (type === 'group') url = `/api/info-management/group-chats/${id}`
      else if (type === 'media') url = `/api/info-management/media-platforms/${id}`
      else if (type === 'project') url = `/api/info-management/projects/${id}`

      const response = await fetch(url, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast({ title: "删除成功" })
        if (type === 'contact') fetchContactData()
        else if (type === 'group') fetchGroupChatData()
        else if (type === 'media') fetchMediaPlatformData()
        else if (type === 'project') fetchProjectData()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "删除失败" })
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/admin">管理后台</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>信息管理中心</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">信息管理中心</h2>
        <p className="text-muted-foreground">管理联系方式、群聊、媒体平台和项目信息</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contact"><Contact className="h-4 w-4 mr-2" />联系方式</TabsTrigger>
          <TabsTrigger value="group"><Users className="h-4 w-4 mr-2" />群聊信息</TabsTrigger>
          <TabsTrigger value="media"><Globe className="h-4 w-4 mr-2" />媒体平台</TabsTrigger>
          <TabsTrigger value="project"><FolderKanban className="h-4 w-4 mr-2" />项目信息</TabsTrigger>
        </TabsList>

        {/* 渲染内容 */}
        {['contact', 'group', 'media', 'project'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{tab === 'contact' ? '联系方式' : tab === 'group' ? '群聊' : tab === 'media' ? '媒体' : '项目'}管理</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    if (tab === 'contact') fetchContactData()
                    else if (tab === 'group') fetchGroupChatData()
                    else if (tab === 'media') fetchMediaPlatformData()
                    else if (tab === 'project') fetchProjectData()
                  }}>
                    <RefreshCw className={`h-4 w-4 ${loading[tab as keyof typeof loading] ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button size="sm" onClick={() => handleAddNew(tab)}><Plus className="h-4 w-4 mr-1" />新增</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>{tab === 'project' ? '项目标题' : tab === 'contact' ? '标题' : '名称'}</TableHead>
                      <TableHead>{tab === 'project' ? '分类' : '描述/信息'}</TableHead>
                      <TableHead>更多信息</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading[tab as keyof typeof loading] ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                    ) : (tab === 'contact' ? contactData : tab === 'group' ? groupChatData : tab === 'media' ? mediaPlatformData : projectData).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">暂无数据</TableCell></TableRow>
                    ) : (tab === 'contact' ? contactData : tab === 'group' ? groupChatData : tab === 'media' ? mediaPlatformData : projectData).map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell className="font-medium">{item.title || item.name}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{item.description || item.account || item.limit}</TableCell>
                        <TableCell>
                          {tab === 'contact' && <span>{item.info}</span>}
                          {tab === 'group' && <span>{item.groupNumber}</span>}
                          {tab === 'media' && <span>{item.accountId}</span>}
                          {tab === 'project' && <div className="flex flex-wrap gap-1">{item.pLanguage?.map((l: string, i: number) => <Badge key={i} variant="outline">{l}</Badge>)}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(tab, item)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setDeleteTarget({ type: tab, id: item.id })
                              setDeleteDialogOpen(true)
                            }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 编辑/新增弹窗 */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem?.data ? '编辑' : '新增'}{editingItem?.type === 'contact' ? '联系方式' : editingItem?.type === 'group' ? '群聊' : editingItem?.type === 'media' ? '媒体平台' : '项目'}</DialogTitle>
          </DialogHeader>
          
          {editingItem?.type === 'contact' && (
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(onSave)} className="space-y-4">
                <FormField control={contactForm.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={contactForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>描述</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={contactForm.control} name="info" render={({ field }) => (
                  <FormItem><FormLabel>联系信息</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={contactForm.control} name="action" render={({ field }) => (
                  <FormItem><FormLabel>动作链接</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={submitting} className="w-full">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button>
              </form>
            </Form>
          )}

          {editingItem?.type === 'group' && (
            <Form {...groupForm}>
              <form onSubmit={groupForm.handleSubmit(onSave)} className="space-y-4">
                <FormField control={groupForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>群名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={groupForm.control} name="groupNumber" render={({ field }) => (
                  <FormItem><FormLabel>群号</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={groupForm.control} name="limit" render={({ field }) => (
                  <FormItem><FormLabel>人数限制</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={groupForm.control} name="joinLink" render={({ field }) => (
                  <FormItem><FormLabel>加入链接</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={groupForm.control} name="qrcode" render={({ field }) => (
                  <FormItem><FormLabel>二维码 URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={submitting} className="w-full">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button>
              </form>
            </Form>
          )}

          {editingItem?.type === 'media' && (
            <Form {...mediaForm}>
              <form onSubmit={mediaForm.handleSubmit(onSave)} className="space-y-4">
                <FormField control={mediaForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>平台名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={mediaForm.control} name="account" render={({ field }) => (
                  <FormItem><FormLabel>账号名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={mediaForm.control} name="accountId" render={({ field }) => (
                  <FormItem><FormLabel>账号 ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={mediaForm.control} name="link" render={({ field }) => (
                  <FormItem><FormLabel>链接</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={mediaForm.control} name="logo" render={({ field }) => (
                  <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" disabled={submitting} className="w-full">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button>
              </form>
            </Form>
          )}

          {editingItem?.type === 'project' && (
            <Form {...projectForm}>
              <form onSubmit={projectForm.handleSubmit(onSave)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={projectForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>项目标题</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={projectForm.control} name="platform" render={({ field }) => (
                    <FormItem><FormLabel>适用平台</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={projectForm.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>分类标识</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={projectForm.control} name="categoryName" render={({ field }) => (
                    <FormItem><FormLabel>分类名称</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={projectForm.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>项目描述</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={projectForm.control} name="pLanguage" render={({ field }) => (
                  <FormItem><FormLabel>编程语言 (逗号分隔)</FormLabel><FormControl><Input {...field} placeholder="React, TypeScript, Hono" /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={projectForm.control} name="link" render={({ field }) => (
                    <FormItem><FormLabel>项目链接</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={projectForm.control} name="updateDate" render={({ field }) => (
                    <FormItem><FormLabel>更新日期</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}保存</Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这条信息吗？此操作无法撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

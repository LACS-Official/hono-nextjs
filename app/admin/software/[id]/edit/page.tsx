'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Info,
  Package,
  Globe,
  Monitor,
  HardDrive,
  Cpu,
  Layers,
  Settings,
  HelpCircle,
  FileCode,
  Tags,
  Calendar,
  Hash,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Zap,
  Download,
  GitBranch,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Link2
} from 'lucide-react'

import GithubSyncModal from '@/components/GithubSyncModal'
import { ACCELERATION_SOURCES } from '@/lib/github-constants'
import { createClient } from '@/utils/supabase/client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FormSkeleton } from '@/components/SkeletonScreen'
import { uploadToImgBed } from '@/lib/imgbed-utils'

// 定义表单验证 Schema (与新建页面相同)
const formSchema = z.object({
  name: z.string().min(1, "请输入软件名称").max(255, "软件名称不能超过255个字符"),
  nameEn: z.string().max(255, "英文名称不能超过255个字符").optional(),
  description: z.string().max(1000, "描述不能超过1000个字符").optional(),
  descriptionEn: z.string().max(1000, "英文描述不能超过1000个字符").optional(),
  currentVersion: z.string().min(1, "请输入当前版本").regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, "请输入有效的语义化版本号 (如: 1.0.0)"),
  category: z.string().optional(),
  officialWebsite: z.string().url("请输入有效的网址").optional().or(z.literal("")),
  openname: z.string().max(255, "启动文件名不能超过255个字符").optional(),
  filetype: z.string().max(50, "文件类型不能超过50个字符").optional(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().min(0, "排序顺序不能小于0").default(0),
  os: z.array(z.string()).optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  processor: z.string().optional(),
  otherRequirements: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal("")),
  githubRepo: z.string().optional(),
  githubProxy: z.string().optional(),
  githubUseProxyOfficial: z.boolean().default(true),
  githubAssetFilter: z.string().optional(),
  githubAutoRedirect: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

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
  logoUrl?: string
  metadata?: {
    github?: {
      repo?: string
      proxyPrefix?: string
      sourceId?: string
      useProxyAsOfficial?: boolean
      assetFilter?: string
      lastSyncAt?: string
      autoRedirectDownload?: boolean
    }
    [key: string]: any
  }
  createdAt: string
  updatedAt: string
}

export default function SoftwareEdit() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [software, setSoftware] = useState<Software | null>(null)
  const [githubModalOpen, setGithubModalOpen] = useState(false)
  const [copiedDownloadUrl, setCopiedDownloadUrl] = useState(false)
  const [fetchingRepoInfo, setFetchingRepoInfo] = useState(false)

  const softwareId = params.id as string
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      nameEn: "",
      description: "",
      descriptionEn: "",
      currentVersion: "",
      category: "",
      officialWebsite: "",
      openname: "",
      filetype: "",
      tags: "",
      isActive: true,
      sortOrder: 0,
      os: [],
      memory: "",
      storage: "",
      processor: "",
      otherRequirements: "",
      logoUrl: "",
      githubRepo: "",
      githubProxy: "https://ghproxy.net/",
      githubUseProxyOfficial: true,
      githubAssetFilter: ""
    },
  })

  // 获取软件详情
  useEffect(() => {
    const fetchSoftwareDetail = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
        const data = await response.json()

        if (data.success) {
          const softwareData = data.data
          setSoftware(softwareData)
          
          // 填充表单
          form.reset({
            name: softwareData.name || "",
            nameEn: softwareData.nameEn || "",
            description: softwareData.description || "",
            descriptionEn: softwareData.descriptionEn || "",
            currentVersion: softwareData.currentVersion || "",
            category: softwareData.category || "",
            officialWebsite: softwareData.officialWebsite || "",
            openname: softwareData.openname || "",
            filetype: softwareData.filetype || "",
            tags: softwareData.tags ? softwareData.tags.join(', ') : "",
            isActive: softwareData.isActive ?? true,
            sortOrder: softwareData.sortOrder || 0,
            os: softwareData.systemRequirements?.os || [],
            memory: softwareData.systemRequirements?.memory || "",
            storage: softwareData.systemRequirements?.storage || "",
            processor: softwareData.systemRequirements?.processor || "",
            otherRequirements: softwareData.systemRequirements?.other || "",
            logoUrl: softwareData.logoUrl || "",
            githubRepo: softwareData.metadata?.github?.repo || "",
            githubProxy: softwareData.metadata?.github?.proxyPrefix || "https://ghproxy.net/",
            githubUseProxyOfficial: softwareData.metadata?.github?.useProxyAsOfficial ?? true,
            githubAssetFilter: softwareData.metadata?.github?.assetFilter || "",
            githubAutoRedirect: softwareData.metadata?.github?.autoRedirectDownload ?? true
          })
        } else {
          toast({
            variant: "destructive",
            title: "获取失败",
            description: "无法加载软件信息",
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

    if (softwareId) {
      fetchSoftwareDetail()
    }
  }, [softwareId])

  const onSubmit = async (values: FormValues) => {
    setSaving(true)

    try {
      // 获取Supabase会话信息
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        toast({
          variant: "destructive",
          title: "未授权",
          description: "请先登录后再进行操作",
        })
        return
      }

      // 处理提交数据
      const processedValues = {
        name: values.name,
        nameEn: values.nameEn,
        description: values.description,
        descriptionEn: values.descriptionEn,
        currentVersion: values.currentVersion,
        category: values.category,
        officialWebsite: values.officialWebsite,
        openname: values.openname,
        filetype: values.filetype,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        systemRequirements: {
          os: values.os,
          memory: values.memory,
          storage: values.storage,
          processor: values.processor,
          other: values.otherRequirements
        },
        logoUrl: values.logoUrl,
        metadata: {
          ...(software?.metadata || {}),
          github: {
            repo: values.githubRepo?.trim() || undefined,
            proxyPrefix: values.githubProxy || 'https://ghproxy.net/',
            useProxyAsOfficial: values.githubUseProxyOfficial ?? true,
            assetFilter: values.githubAssetFilter?.trim() || undefined,
            autoRedirectDownload: values.githubAutoRedirect ?? true,
            lastSyncAt: software?.metadata?.github?.lastSyncAt,
          }
        }
      }

      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(processedValues)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "更新成功",
          description: "软件信息已更新",
        })
        setTimeout(() => {
          router.push(`/admin/software/${softwareId}`)
        }, 1000)
      } else {
        toast({
          variant: "destructive",
          title: "更新失败",
          description: data.error || "未知错误",
        })
      }
    } catch (error) {
      console.error('Error saving software:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setSaving(false)
    }
  }

  // 从 GitHub 获取仓库信息并填入表单
  const handleAutoFillFromGithub = async () => {
    const repo = form.getValues('githubRepo')
    if (!repo?.trim()) {
      toast({
        variant: 'destructive',
        title: '请先输入 GitHub 仓库',
        description: '例如: owner/repo 或完整 GitHub URL',
      })
      return
    }

    setFetchingRepoInfo(true)
    try {
      const res = await fetch(`${API_BASE_URL}/software/github?repo=${encodeURIComponent(repo.trim())}&action=details`)
      const json = await res.json()

      if (json.success && json.data?.repoDetails) {
        const details = json.data.repoDetails
        if (details.description && !form.getValues('description')) {
          form.setValue('description', details.description)
        }
        if (details.description && !form.getValues('descriptionEn')) {
          form.setValue('descriptionEn', details.description)
        }
        if ((details.homepage || details.htmlUrl) && !form.getValues('officialWebsite')) {
          form.setValue('officialWebsite', details.homepage || details.htmlUrl)
        }
        if (details.topics && details.topics.length > 0 && !form.getValues('tags')) {
          form.setValue('tags', details.topics.join(', '))
        }
        toast({
          title: '信息获取成功',
          description: '已将 GitHub 描述、官网及标签自动填入表单',
        })
      } else {
        toast({
          variant: 'destructive',
          title: '获取失败',
          description: json.error || '未能获取该仓库的信息',
        })
      }
    } catch (error: any) {
      console.error('Auto fill error:', error)
      toast({
        variant: 'destructive',
        title: '请求失败',
        description: error.message || '网络异常',
      })
    } finally {
      setFetchingRepoInfo(false)
    }
  }

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
              <BreadcrumbPage>编辑软件</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <FormSkeleton />
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
            <BreadcrumbLink href={`/admin/software/${softwareId}`}>{software.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>编辑</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">编辑软件 - {software.name}</h2>
          <p className="text-muted-foreground">
            修改软件信息,最新版本将根据版本历史自动计算
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.push(`/admin/software/${softwareId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回详情
            </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>编辑说明</AlertTitle>
        <AlertDescription>
          最新版本号由系统根据版本历史自动计算,无需手动维护。如需更新版本,请在版本管理页面添加新版本。
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 左侧表单区域 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-8">
                
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
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>软件名称 <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="请输入软件名称" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="nameEn"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>英文名称</FormLabel>
                            <FormControl>
                              <Input placeholder="请输入英文名称（可选）" {...field} />
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
                          <FormLabel>软件描述</FormLabel>
                          <FormControl>
                            <Textarea placeholder="请输入软件描述" className="min-h-[100px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="descriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>英文描述</FormLabel>
                          <FormControl>
                            <Textarea placeholder="请输入英文描述（可选）" className="min-h-[80px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="currentVersion"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              当前版本 <span className="text-destructive">*</span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>当前使用的版本号,可以手动修改</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如：1.0.0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>软件分类</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="请选择分类" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['开发工具', '浏览器', '图像处理', '社交通讯', '办公软件', '系统工具', '多媒体', '游戏', '安全软件', '网络工具'].map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 技术细节 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5 text-primary" />
                      技术细节
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="openname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              启动文件名
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>软件的启动文件名或命令</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如：bypass/bypass.cmd" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="filetype"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>文件类型</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择文件类型" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['7z', 'zip', 'rar', 'exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'apk', 'tar.gz'].map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="officialWebsite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Globe className="h-4 w-4" /> 官方网站
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Tags className="h-4 w-4" /> 标签
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="输入标签，用逗号分隔" {...field} />
                            </FormControl>
                            <FormDescription>
                              例如：免费, 开源, 效率工具
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 系统要求 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-primary" />
                      系统要求
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="os"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>支持系统</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {['Windows', 'macOS', 'Linux', 'Android', 'iOS'].map((os) => (
                              <Button
                                key={os}
                                type="button"
                                variant={field.value?.includes(os) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  const current = field.value || []
                                  if (current.includes(os)) {
                                    field.onChange(current.filter(i => i !== os))
                                  } else {
                                    field.onChange([...current, os])
                                  }
                                }}
                              >
                                {os}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="memory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Layers className="h-4 w-4" /> 内存要求
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如：4GB RAM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="storage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <HardDrive className="h-4 w-4" /> 存储空间
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如：500MB 可用空间" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="processor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" /> 处理器
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如：Intel Core i3 或同等处理器" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="otherRequirements"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>其他要求</FormLabel>
                            <FormControl>
                              <Input placeholder="其他系统要求或依赖项" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* GitHub 关联与同步设置 */}
                <Card className="rounded-2xl border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-[#0071e3]" />
                        GitHub 同步与仓库设置
                      </CardTitle>
                      {software?.metadata?.github?.lastSyncAt && (
                        <span className="text-xs text-muted-foreground">
                          上次同步: {new Date(software.metadata.github.lastSyncAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <CardDescription>
                      配置对应的 GitHub 仓库地址与镜像加速源，支持一键拉取仓库资料及自动同步版本和下载链接
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="githubRepo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              GitHub 仓库地址
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>支持 owner/repo 或完整 GitHub 链接 (例如: localsend/localsend)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="例如: owner/repo 或 https://github.com/owner/repo" {...field} />
                            </FormControl>
                            <FormDescription>
                              关联后可自动识别 Releases、Tag 及附件安装包
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="githubProxy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <Zap className="h-4 w-4 text-amber-500" />
                              默认下载镜像加速源
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || 'https://ghproxy.net/'}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择加速源" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ACCELERATION_SOURCES.map(source => (
                                  <SelectItem key={source.id} value={source.prefix || 'direct'}>
                                    {source.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              国内用户下载 GitHub 资产时的加速反代前缀
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="githubUseProxyOfficial"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm font-medium">主下载源使用加速链接</FormLabel>
                              <FormDescription className="text-xs">
                                开启后将加速链接保存为主下载地址，直连链接作为备用
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

                      <FormField
                        control={form.control}
                        name="githubAssetFilter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>资产文件筛选规则 (可选)</FormLabel>
                            <FormControl>
                              <Input placeholder="例如: .exe, win, x64 (留空按平台扩展名优选)" {...field} />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Release 存在多个安装包时优先选中的文件名关键字
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="githubAutoRedirect"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-xl border border-sky-100 dark:border-sky-950/40 bg-sky-50/40 dark:bg-sky-950/20 p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-sm font-semibold text-sky-900 dark:text-sky-300">
                                方案 4：开启动态最新下载直链 (自动重定向)
                              </FormLabel>
                              <Badge variant="outline" className="bg-sky-100/80 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300 text-[10px] border-sky-200">
                                Vercel 推荐
                              </Badge>
                            </div>
                            <FormDescription className="text-xs text-muted-foreground leading-relaxed">
                              开启后下载端点将自动通过 10 分钟 SWR 边缘缓存重定向到 GitHub 最新 Release 镜像直链。无需每次手动同步，即使部署到 Vercel 也能永久保持最新！
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

                    {/* 专属永久动态下载链接展示卡片 */}
                    {softwareId && form.watch('githubRepo') && (
                      <div className="rounded-xl border bg-card/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 text-primary" />
                            该软件专属永久动态下载地址 (直达最新 Release):
                          </span>
                          <span className="text-[11px] text-muted-foreground">302 自动重定向</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-1.5 text-xs bg-muted/60 rounded-lg border font-mono truncate select-all">
                            {typeof window !== 'undefined' ? `${window.location.origin}/app/software/id/${softwareId}/download` : `/app/software/id/${softwareId}/download`}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 rounded-lg text-xs"
                            onClick={() => {
                              const url = `${window.location.origin}/app/software/id/${softwareId}/download`
                              navigator.clipboard.writeText(url)
                              setCopiedDownloadUrl(true)
                              toast({ title: '已复制动态下载链接', description: url })
                              setTimeout(() => setCopiedDownloadUrl(false), 2000)
                            }}
                          >
                            {copiedDownloadUrl ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 mr-1" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 mr-1" />
                            )}
                            {copiedDownloadUrl ? '已复制' : '复制链接'}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                            asChild
                          >
                            <a
                              href={`/app/software/id/${softwareId}/download?json=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="在新标签页测试解析结果"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              测试解析
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 操作按钮组 */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAutoFillFromGithub}
                        disabled={fetchingRepoInfo}
                        className="rounded-full text-xs font-medium"
                      >
                        {fetchingRepoInfo ? (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[#0071e3]" />
                        )}
                        获取仓库资料并填入表单
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setGithubModalOpen(true)}
                        className="rounded-full text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        打开 GitHub 版本同步面板
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 设置 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      设置
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">启用状态</FormLabel>
                              <FormDescription>
                                设置软件是否在前台可见
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
                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>排序顺序</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              数字越小排序越靠前
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                  <Button type="submit" size="lg" disabled={saving}>
                    {saving && <RotateCcw className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    保存修改
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="lg" 
                    onClick={() => {
                      if (software) {
                        form.reset({
                          name: software.name || "",
                          nameEn: software.nameEn || "",
                          description: software.description || "",
                          descriptionEn: software.descriptionEn || "",
                          currentVersion: software.currentVersion || "",
                          category: software.category || "",
                          officialWebsite: software.officialWebsite || "",
                          openname: software.openname || "",
                          filetype: software.filetype || "",
                          tags: software.tags ? software.tags.join(', ') : "",
                          isActive: software.isActive ?? true,
                          sortOrder: software.sortOrder || 0,
                          os: software.systemRequirements?.os || [],
                          memory: software.systemRequirements?.memory || "",
                          storage: software.systemRequirements?.storage || "",
                          processor: software.systemRequirements?.processor || "",
                          otherRequirements: software.systemRequirements?.other || ""
                        })
                      }
                    }}
                  >
                    重置
                  </Button>
                  <Button type="button" variant="ghost" size="lg" onClick={() => router.push(`/admin/software/${softwareId}`)}>
                    取消
                  </Button>
                </div>
              </div>
            </div>

        {/* 右侧信息区域 */}
        <div className="space-y-6">
          {/* Logo 上传卡片 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                软件 Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormControl>
                      <div className="flex flex-col items-center gap-4">
                        {field.value ? (
                          <div className="relative group">
                            <div className="w-32 h-32 rounded-lg border-2 border-primary/20 overflow-hidden bg-muted">
                              <img 
                                src={field.value} 
                                alt="Logo Preview" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => field.onChange("")}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center bg-muted/30">
                            <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                            <span className="text-xs text-muted-foreground">暂无 Logo</span>
                          </div>
                        )}
                        
                        <div className="w-full space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="logo-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  try {
                                    toast({ title: "正在上传..." })
                                    const url = await uploadToImgBed(file, 'appfun/icons', `${softwareId}-icon`)
                                    field.onChange(url)
                                    toast({ title: "上传成功" })
                                  } catch (error) {
                                    toast({ 
                                      variant: "destructive", 
                                      title: "上传失败", 
                                      description: "请检查网络或稍后重试" 
                                    })
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              size="sm"
                              onClick={() => document.getElementById('logo-upload')?.click()}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              上传图片
                            </Button>
                          </div>
                          
                          <div className="relative">
                            <Separator className="my-2" />
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase">
                                或输入 URL
                              </span>
                            </span>
                          </div>
                          
                          <Input
                            placeholder="输入图标链接地址"
                            className="h-8 text-xs"
                            {...field}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">软件信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ID:</span>
                <span className="text-muted-foreground">#{software.id}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">创建时间:</span>
                <span className="text-muted-foreground">
                  {new Date(software.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">最后更新:</span>
                <span className="text-muted-foreground">
                  {new Date(software.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              {software.latestVersion && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="font-medium">最新版本:</span>
                    <p className="text-muted-foreground">{software.latestVersion}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">编辑说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">版本管理</p>
                <p className="text-muted-foreground">最新版本由系统自动计算</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-medium">下载链接</p>
                <p className="text-muted-foreground">在版本历史中管理下载链接</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-medium">状态设置</p>
                <p className="text-muted-foreground">禁用后用户无法看到此软件</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
        </form>
      </Form>

      {/* GitHub 版本同步弹窗 */}
      <GithubSyncModal
        open={githubModalOpen}
        onOpenChange={setGithubModalOpen}
        softwareId={software.id}
        softwareName={software.name}
        initialRepo={form.getValues('githubRepo') || software.metadata?.github?.repo}
        initialProxyPrefix={form.getValues('githubProxy') || software.metadata?.github?.proxyPrefix}
        initialSourceId={software.metadata?.github?.sourceId}
        onSyncComplete={() => {
          // 重新拉取详情，使更新后的版本号立即呈现在表单中
          const fetchDetail = async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/software/id/${softwareId}`)
              const json = await res.json()
              if (json.success && json.data) {
                setSoftware(json.data)
                if (json.data.currentVersion) {
                  form.setValue('currentVersion', json.data.currentVersion)
                }
              }
            } catch (e) {
              console.error(e)
            }
          }
          fetchDetail()
        }}
        onApplyRepoInfo={(info) => {
          if (info.description && !form.getValues('description')) {
            form.setValue('description', info.description)
          }
          if (info.officialWebsite && !form.getValues('officialWebsite')) {
            form.setValue('officialWebsite', info.officialWebsite)
          }
          if (info.tags && info.tags.length > 0 && !form.getValues('tags')) {
            form.setValue('tags', info.tags.join(', '))
          }
          if (info.filetype && !form.getValues('filetype')) {
            form.setValue('filetype', info.filetype)
          }
        }}
      />
    </div>
  )
}
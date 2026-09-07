'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { uploadToImgBed } from '@/lib/imgbed-utils'

// 定义表单验证 Schema
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
  tags: z.string().optional(), // 暂时用字符串处理，后续分割为数组
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().min(0, "排序顺序不能小于0").default(0),
  // 系统要求
  os: z.array(z.string()).optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  processor: z.string().optional(),
  otherRequirements: z.string().optional(),
  logoUrl: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

export default function SoftwareNew() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [githubInput, setGithubInput] = useState('')
  const [fetchingGithub, setFetchingGithub] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any, // 临时规避类型不匹配
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
      logoUrl: ""
    },
  })

  // 从 GitHub 快速导入资料
  const handleImportFromGithub = async () => {
    const repo = githubInput.trim()
    if (!repo) {
      toast({
        variant: 'destructive',
        title: '请输入 GitHub 仓库',
        description: '例如: owner/repo 或 https://github.com/owner/repo',
      })
      return
    }

    setFetchingGithub(true)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
    try {
      const res = await fetch(`${API_BASE_URL}/software/github?repo=${encodeURIComponent(repo)}`)
      const json = await res.json()

      if (json.success && json.data) {
        const d = json.data.repoDetails
        const latestRelease = json.data.releases?.[0]

        if (d.name && !form.getValues('name')) {
          form.setValue('name', d.name)
        }
        if (d.name && !form.getValues('nameEn')) {
          form.setValue('nameEn', d.name)
        }
        if (d.description && !form.getValues('description')) {
          form.setValue('description', d.description)
        }
        if (d.description && !form.getValues('descriptionEn')) {
          form.setValue('descriptionEn', d.description)
        }
        if ((d.homepage || d.htmlUrl) && !form.getValues('officialWebsite')) {
          form.setValue('officialWebsite', d.homepage || d.htmlUrl)
        }
        if (d.topics && d.topics.length > 0 && !form.getValues('tags')) {
          form.setValue('tags', d.topics.join(', '))
        }
        if (latestRelease?.normalizedVersion) {
          form.setValue('currentVersion', latestRelease.normalizedVersion)
        }
        if (latestRelease?.primaryAsset) {
          const extMatch = latestRelease.primaryAsset.name.match(/\.([a-zA-Z0-9]+)$/)
          if (extMatch && !form.getValues('filetype')) {
            form.setValue('filetype', extMatch[1].toLowerCase())
          }
        }
        toast({
          title: '导入成功',
          description: `已自动填入 ${d.fullName} 仓库信息及最新版本 ${latestRelease?.tagName || ''}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: '获取失败',
          description: json.error || '无法获取仓库信息',
        })
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: '请求失败',
        description: e.message || '网络异常',
      })
    } finally {
      setFetchingGithub(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

    try {
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
          github: githubInput.trim() ? {
            repo: githubInput.trim(),
            proxyPrefix: 'https://ghproxy.net/',
            useProxyAsOfficial: true,
          } : undefined
        }
      }

      const response = await fetch(`${API_BASE_URL}/software`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        },
        body: JSON.stringify(processedValues)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "软件创建成功",
          description: "即将跳转到详情页面...",
        })
        setTimeout(() => {
             router.push(`/admin/software/${data.data.id}`)
        }, 1000)
      } else {
        toast({
          variant: "destructive",
          title: "创建失败",
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
      setLoading(false)
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
            <BreadcrumbLink href="/admin/software">软件管理</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>新增软件</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">新增软件</h2>
          <p className="text-muted-foreground">
            添加新的软件到系统中，最新版本将根据版本历史自动计算
          </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
            </Button>
        </div>
      </div>

       <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>温馨提示</AlertTitle>
        <AlertDescription>
          创建软件后，您可以在软件详情页面添加版本历史和管理下载链接。最新版本号将根据版本历史自动计算，无需手动维护。
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 左侧表单区域 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-8">
                    {/* GitHub 快速导入 */}
                    <Card className="rounded-2xl border-black/[0.06] dark:border-white/[0.08] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] bg-gradient-to-r from-blue-50/50 via-white to-transparent dark:from-blue-950/20 dark:via-[#161617] dark:to-transparent">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Download className="h-4 w-4 text-[#0071e3]" />
                                    从 GitHub 快速导入
                                </span>
                                <Badge variant="secondary" className="text-[11px] font-normal">可选快速创建</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs">
                                输入 GitHub 仓库地址，一键自动获取软件名称、英文名、描述、官网、标签与最新版本号
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="输入 GitHub 仓库，例如: localsend/localsend"
                                    value={githubInput}
                                    onChange={(e) => setGithubInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImportFromGithub())}
                                    className="h-9 rounded-xl bg-white dark:bg-[#161617] text-sm"
                                />
                                <Button
                                    type="button"
                                    onClick={handleImportFromGithub}
                                    disabled={fetchingGithub}
                                    size="sm"
                                    className="h-9 rounded-xl px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm shrink-0"
                                >
                                    {fetchingGithub ? (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                    )}
                                    自动填入
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

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
                                                            <p>初始版本号，后续版本将通过版本历史管理</p>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="请选择分类" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="开发工具">开发工具</SelectItem>
                                                    <SelectItem value="浏览器">浏览器</SelectItem>
                                                    <SelectItem value="图像处理">图像处理</SelectItem>
                                                    <SelectItem value="社交通讯">社交通讯</SelectItem>
                                                    <SelectItem value="办公软件">办公软件</SelectItem>
                                                    <SelectItem value="系统工具">系统工具</SelectItem>
                                                    <SelectItem value="多媒体">多媒体</SelectItem>
                                                    <SelectItem value="游戏">游戏</SelectItem>
                                                    <SelectItem value="安全软件">安全软件</SelectItem>
                                                    <SelectItem value="网络工具">网络工具</SelectItem>
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
                                                            <p>软件的启动文件名或命令，例如：main.exe, start.sh</p>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Button type="submit" size="lg" disabled={loading}>
                            {loading && <RotateCcw className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" />
                            保存软件
                        </Button>
                        <Button type="button" variant="secondary" size="lg" onClick={() => form.reset()}>
                            重置
                        </Button>
                        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
                            取消
                        </Button>
                    </div>
                </div>
            </div>

        {/* 右侧帮助区域 */}
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
                                                                const url = await uploadToImgBed(file, 'appfun/icons')
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
                    <CardTitle className="text-base">填写说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="font-medium">软件名称</p>
                        <p className="text-muted-foreground">必填项，建议使用通用的中文名称。</p>
                    </div>
                     <Separator />
                    <div className="space-y-1">
                        <p className="font-medium">版本号格式</p>
                        <p className="text-muted-foreground">必须使用语义化版本号，例如 1.0.0, 2.1.0-beta.1。</p>
                    </div>
                     <Separator />
                    <div className="space-y-1">
                        <p className="font-medium">版本管理</p>
                        <p className="text-muted-foreground">创建成功后，您可以在详情页添加更多的历史版本和更新日志。</p>
                    </div>
                     <Separator />
                    <div className="space-y-1">
                        <p className="font-medium">下载链接</p>
                        <p className="text-muted-foreground">下载链接在版本管理中配置，支持多个下载源（网盘、直链等）。</p>
                    </div>
                </CardContent>
            </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

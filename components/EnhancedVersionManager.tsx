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
  Download,
  RefreshCw,
  RefreshCcw,
  Rocket,
  Bug,
  Shield,
  Zap,
  GitCompare,
  X,
  ExternalLink
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface DownloadLinks {
  official?: string
  quark?: string
  pan123?: string
  baidu?: string
  thunder?: string
  thunderPan?: string
  backup?: string[]
}

interface VersionHistory {
  id: number
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: DownloadLinks
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: 'release' | 'beta' | 'alpha' | 'rc'
  changelogCategory?: string[]
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface VersionStats {
  totalVersions: number
  stableVersions: number
  betaVersions: number
  prereleaseVersions: number
  latestVersion: string
  oldestVersion: string
  averageReleaseInterval: number
}

interface EnhancedVersionManagerProps {
  softwareId: number
  softwareName: string
  onVersionAdded?: () => void
}

// 表单验证 schema
const versionFormSchema = z.object({
  version: z.string()
    .min(1, '请输入版本号')
    .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/, '请输入有效的语义化版本号 (如: 1.0.0)'),
  releaseDate: z.string().min(1, '请选择发布日期'),
  releaseNotes: z.string().min(1, '请输入更新日志'),
  releaseNotesEn: z.string().optional(),
  fileSize: z.string().optional(),
  versionType: z.enum(['release', 'beta', 'alpha', 'rc']),
  isStable: z.boolean().default(true),
  isBeta: z.boolean().default(false),
  isPrerelease: z.boolean().default(false),
  downloadLinks: z.object({
    official: z.string().optional(),
    quark: z.string().optional(),
    pan123: z.string().optional(),
    baidu: z.string().optional(),
    thunder: z.string().optional(),
    thunderPan: z.string().optional(),
  }).optional(),
})

type VersionFormValues = z.infer<typeof versionFormSchema>

export default function EnhancedVersionManager({ 
  softwareId, 
  softwareName, 
  onVersionAdded 
}: EnhancedVersionManagerProps) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingVersion, setEditingVersion] = useState<VersionHistory | null>(null)
  const [stats, setStats] = useState<VersionStats | null>(null)
  const [selectedVersions, setSelectedVersions] = useState<VersionHistory[]>([])
  const [comparisonVisible, setComparisonVisible] = useState(false)
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionFormSchema),
    defaultValues: {
      version: '',
      releaseDate: '',
      releaseNotes: '',
      releaseNotesEn: '',
      fileSize: '',
      versionType: 'release',
      isStable: true,
      isBeta: false,
      isPrerelease: false,
      downloadLinks: {
        official: '',
        quark: '',
        pan123: '',
        baidu: '',
        thunder: '',
        thunderPan: '',
      },
    },
  })

  // 获取版本历史
  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`)
      const data = await response.json()
      
      if (data.success) {
        const sortedVersions = data.data.sort((a: VersionHistory, b: VersionHistory) => 
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        )
        setVersions(sortedVersions)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "获取版本历史失败",
        })
      }
    } catch (error) {
      console.error('获取版本历史失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取版本统计
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management?action=stats&softwareId=${softwareId}`)
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取版本统计失败:', error)
    }
  }

  // 自动更新最新版本
  const handleAutoUpdate = async () => {
    setAutoUpdateLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'updateSingle',
          softwareId: softwareId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: "更新成功",
          description: data.message || '版本更新成功',
        })
        fetchVersions()
        fetchStats()
        onVersionAdded?.()
      } else {
        toast({
          variant: "destructive",
          title: "更新失败",
          description: data.error || '版本更新失败',
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setAutoUpdateLoading(false)
    }
  }

  // 建议版本号
  const suggestVersion = async (changeType: 'major' | 'minor' | 'patch') => {
    try {
      const response = await fetch(`${API_BASE_URL}/software/version-management?action=suggest&softwareId=${softwareId}&changeType=${changeType}`)
      const data = await response.json()
      
      if (data.success) {
        form.setValue('version', data.data.suggestedVersion)
        toast({
          title: "建议版本号",
          description: `建议版本号: ${data.data.suggestedVersion}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "获取建议版本号失败",
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

  // 处理版本选择（用于比较）
  const handleVersionSelect = (version: VersionHistory, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, version])
      } else {
        toast({
          title: "选择限制",
          description: "最多只能选择两个版本进行比较",
        })
      }
    } else {
      setSelectedVersions(selectedVersions.filter(v => v.id !== version.id))
    }
  }

  // 清除版本选择
  const clearVersionSelection = () => {
    setSelectedVersions([])
  }

  // 显示版本比较
  const showVersionComparison = () => {
    if (selectedVersions.length === 2) {
      setComparisonVisible(true)
    } else {
      toast({
        title: "选择不足",
        description: "请选择两个版本进行比较",
      })
    }
  }

  useEffect(() => {
    fetchVersions()
    fetchStats()
  }, [softwareId])

  // 渲染下载链接
  const renderDownloadLinks = (links: DownloadLinks) => {
    if (!links) return <span className="text-muted-foreground">暂无下载链接</span>
    
    const linkButtons = []
    
    if (links.official) {
      linkButtons.push(
        <Button key="official" size="sm" variant="default" asChild>
          <a href={links.official} target="_blank" rel="noopener noreferrer">
            <Download className="mr-1 h-3 w-3" />
            官方
          </a>
        </Button>
      )
    }
    
    if (links.quark) {
      linkButtons.push(
        <Button key="quark" size="sm" variant="outline" asChild>
          <a href={links.quark} target="_blank" rel="noopener noreferrer">夸克</a>
        </Button>
      )
    }
    
    if (links.pan123) {
      linkButtons.push(
        <Button key="pan123" size="sm" variant="outline" asChild>
          <a href={links.pan123} target="_blank" rel="noopener noreferrer">123</a>
        </Button>
      )
    }
    
    if (links.baidu) {
      linkButtons.push(
        <Button key="baidu" size="sm" variant="outline" asChild>
          <a href={links.baidu} target="_blank" rel="noopener noreferrer">百度</a>
        </Button>
      )
    }
    
    if (links.thunder) {
      linkButtons.push(
        <Button key="thunder" size="sm" variant="outline" asChild>
          <a href={links.thunder} target="_blank" rel="noopener noreferrer">迅雷</a>
        </Button>
      )
    }

    if (links.thunderPan) {
      linkButtons.push(
        <Button key="thunderPan" size="sm" variant="outline" asChild>
          <a href={links.thunderPan} target="_blank" rel="noopener noreferrer">迅雷网盘</a>
        </Button>
      )
    }
    
    return <div className="flex flex-wrap gap-1">{linkButtons}</div>
  }

  // 处理编辑
  const handleEdit = (version: VersionHistory) => {
    setEditingVersion(version)
    form.reset({
      version: version.version,
      releaseDate: dayjs(version.releaseDate).format('YYYY-MM-DDTHH:mm'),
      releaseNotes: version.releaseNotes || '',
      releaseNotesEn: version.releaseNotesEn || '',
      fileSize: version.fileSize || '',
      versionType: version.versionType,
      isStable: version.isStable,
      isBeta: version.isBeta,
      isPrerelease: version.isPrerelease,
      downloadLinks: version.downloadLinks || {},
    })
    setModalVisible(true)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions/${deleteTarget}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "删除成功",
          description: "版本已删除",
        })
        fetchVersions()
        fetchStats()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: data.error || '删除失败',
        })
      }
    } catch (error) {
      console.error('删除版本失败:', error)
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
  const handleSubmit = async (values: VersionFormValues) => {
    try {
      const submitData = {
        ...values,
        softwareId,
        releaseDate: new Date(values.releaseDate).toISOString(),
        downloadLinks: values.downloadLinks || {}
      }

      let response
      if (editingVersion) {
        response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions/${editingVersion.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      } else {
        response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        })
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: editingVersion ? "更新成功" : "添加成功",
          description: editingVersion ? '版本更新成功' : '版本添加成功',
        })
        setModalVisible(false)
        setEditingVersion(null)
        form.reset()
        fetchVersions()
        fetchStats()
        onVersionAdded?.()
      } else {
        toast({
          variant: "destructive",
          title: editingVersion ? "更新失败" : "添加失败",
          description: data.error || (editingVersion ? '更新失败' : '添加失败'),
        })
      }
    } catch (error) {
      console.error('提交版本失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    }
  }

  // 渲染更新类型标签
  const renderChangelogCategory = (categories: string[]) => {
    if (!categories || categories.length === 0) return null

    const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      feature: { icon: <Rocket className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800', label: '新功能' },
      bugfix: { icon: <Bug className="h-3 w-3" />, color: 'bg-orange-100 text-orange-800', label: '错误修复' },
      security: { icon: <Shield className="h-3 w-3" />, color: 'bg-red-100 text-red-800', label: '安全更新' },
      performance: { icon: <Zap className="h-3 w-3" />, color: 'bg-green-100 text-green-800', label: '性能优化' },
    }

    return (
      <div className="flex flex-wrap gap-1">
        {categories.map(cat => {
          const config = categoryConfig[cat]
          if (!config) return null
          return (
            <Badge key={cat} variant="secondary" className={config.color}>
              {config.icon}
              <span className="ml-1">{config.label}</span>
            </Badge>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 版本统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总版本数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVersions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">稳定版本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.stableVersions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">测试版本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.betaVersions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">预发布版本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.prereleaseVersions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">最新版本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.latestVersion}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均发布间隔</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageReleaseInterval?.toFixed(1) || '0.0'}<span className="text-sm font-normal ml-1">天</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 操作按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => {
                setEditingVersion(null)
                form.reset()
                setModalVisible(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                添加新版本
              </Button>
              <Button variant="outline" onClick={handleAutoUpdate} disabled={autoUpdateLoading}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${autoUpdateLoading ? 'animate-spin' : ''}`} />
                自动更新版本
              </Button>
              <Button variant="outline" onClick={() => suggestVersion('patch')}>
                建议补丁版本
              </Button>
              <Button variant="outline" onClick={() => suggestVersion('minor')}>
                建议次要版本
              </Button>
              <Button variant="outline" onClick={() => suggestVersion('major')}>
                建议主要版本
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedVersions.length > 0 && (
                <>
                  <span className="flex items-center text-sm text-muted-foreground">
                    已选择 {selectedVersions.length}/2 个版本
                  </span>
                  <Button
                    variant="outline"
                    onClick={showVersionComparison}
                    disabled={selectedVersions.length !== 2}
                  >
                    <GitCompare className="mr-2 h-4 w-4" />
                    版本比较
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearVersionSelection}>
                    <X className="mr-2 h-4 w-4" />
                    清除选择
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => {
                fetchVersions()
                fetchStats()
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 版本列表 */}
      <Card>
        <CardHeader>
          <CardTitle>{softwareName} - 版本历史</CardTitle>
          <CardDescription>管理软件的所有版本信息</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedVersions.length > 0 && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>已选择 {selectedVersions.length} 个版本: {selectedVersions.map(v => v.version).join(', ')}</span>
                <div className="flex gap-2">
                  {selectedVersions.length === 2 && (
                    <Button size="sm" onClick={showVersionComparison}>
                      比较版本
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={clearVersionSelection}>
                    清除
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">选择</TableHead>
                <TableHead className="w-[120px]">版本号</TableHead>
                <TableHead className="w-[120px]">发布日期</TableHead>
                <TableHead className="w-[150px]">更新类型</TableHead>
                <TableHead>下载链接</TableHead>
                <TableHead className="w-[100px]">文件大小</TableHead>
                <TableHead className="w-[200px]">更新日志</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    暂无版本记录
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVersions.some(v => v.id === version.id)}
                        onCheckedChange={(checked) => handleVersionSelect(version, checked as boolean)}
                        disabled={selectedVersions.length >= 2 && !selectedVersions.some(v => v.id === version.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={version.isStable ? 'default' : version.isBeta ? 'secondary' : 'destructive'}>
                          {version.version}
                        </Badge>
                        <div className="flex gap-1">
                          {version.isStable && <Badge variant="outline" className="text-xs bg-green-50">稳定</Badge>}
                          {version.isBeta && <Badge variant="outline" className="text-xs bg-orange-50">测试</Badge>}
                          {version.isPrerelease && <Badge variant="outline" className="text-xs bg-red-50">预发布</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(version.releaseDate).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {renderChangelogCategory(version.changelogCategory || [])}
                    </TableCell>
                    <TableCell>
                      {renderDownloadLinks(version.downloadLinks || {})}
                    </TableCell>
                    <TableCell className="text-sm">{version.fileSize || '-'}</TableCell>
                    <TableCell>
                      {version.releaseNotes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[180px] truncate text-sm">
                                {version.releaseNotes}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{version.releaseNotes}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">无更新日志</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(version)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(version.id)
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

      {/* 新增/编辑版本对话框 */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVersion ? '编辑版本' : '新增版本'}</DialogTitle>
            <DialogDescription>
              {editingVersion ? '修改版本信息' : '添加新的软件版本'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>版本号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入版本号 (如: 1.0.0)" {...field} />
                    </FormControl>
                    <FormDescription>
                      请使用语义化版本号格式
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>发布日期</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>更新日志</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入更新日志"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseNotesEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>英文更新日志 (可选)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入英文更新日志"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>文件大小 (可选)</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入文件大小 (如: 100MB)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="versionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>版本类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择版本类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="release">正式版</SelectItem>
                        <SelectItem value="beta">测试版</SelectItem>
                        <SelectItem value="alpha">内测版</SelectItem>
                        <SelectItem value="rc">候选版</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isStable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>稳定版本</FormLabel>
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
                  name="isBeta"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>测试版本</FormLabel>
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
                  name="isPrerelease"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>预发布版本</FormLabel>
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

              <div className="border-t my-4" />

              <div className="space-y-2">
                <h4 className="font-medium">下载链接</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="downloadLinks.official"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>官方下载链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downloadLinks.quark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>夸克网盘链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downloadLinks.pan123"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>123网盘链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downloadLinks.baidu"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>百度网盘链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downloadLinks.thunder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>迅雷下载链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="downloadLinks.thunderPan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>迅雷网盘链接</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setModalVisible(false)
                    setEditingVersion(null)
                    form.reset()
                  }}
                >
                  取消
                </Button>
                <Button type="submit">
                  {editingVersion ? '更新版本' : '添加版本'}
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
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个版本吗？此操作不可撤销。
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

      {/* 版本比较对话框 (简化版) */}
      <Dialog open={comparisonVisible} onOpenChange={setComparisonVisible}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>版本比较</DialogTitle>
            <DialogDescription>
              比较两个版本之间的差异
            </DialogDescription>
          </DialogHeader>
          {selectedVersions.length === 2 && (
            <div className="grid grid-cols-2 gap-4">
              {selectedVersions.map((version, index) => (
                <Card key={version.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">版本 {version.version}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="font-medium">发布日期:</span>
                      <span className="ml-2">{new Date(version.releaseDate).toLocaleDateString('zh-CN')}</span>
                    </div>
                    <div>
                      <span className="font-medium">文件大小:</span>
                      <span className="ml-2">{version.fileSize || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium">更新日志:</span>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {version.releaseNotes || '无'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
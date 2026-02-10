'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  Shield,
  FileText,
  Bell,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  History,
  ShieldAlert,
  LogOut,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  Eye,
  MoreHorizontal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dayjs from 'dayjs'

// 分类配置
const categoryConfig: { [key: string]: { name: string; icon: React.ReactNode } } = {
  'database': { name: '数据库配置', icon: <Database className="h-4 w-4" /> },
  'security': { name: '安全配置', icon: <Shield className="h-4 w-4" /> },
  'api': { name: 'API配置', icon: <Settings className="h-4 w-4" /> },
  'system': { name: '系统配置', icon: <Settings className="h-4 w-4" /> },
  'logging': { name: '日志配置', icon: <FileText className="h-4 w-4" /> },
  'notification': { name: '通知配置', icon: <Bell className="h-4 w-4" /> },
  'other': { name: '其他配置', icon: <Settings className="h-4 w-4" /> }
}

interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  description: string
  type: string
  isSecret: boolean
  isRequired: boolean
  validationRules: any
  createdAt: string
  updatedAt: string
  updatedBy: string
}

interface AuditLog {
  id: string
  settingId: string
  action: string
  oldValue: string
  newValue: string
  reason: string
  userId: string
  timestamp: string
  settingKey: string
  settingCategory: string
}

interface LoginLog {
  id: string
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  loginTime: string
  isActive: boolean
  deviceInfo: {
    device: { type: string; model: string; vendor: string }
    os: { name: string; version: string }
    browser: { name: string; version: string }
  }
}

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  
  // 登录日志相关状态
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loginLogsLoading, setLoginLogsLoading] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockTarget, setBlockTarget] = useState<{ type: 'ip' | 'device'; value: string; label: string } | null>(null)
  const [blockReason, setBlockReason] = useState('')

  // 获取系统设置列表
  const fetchSettings = async () => {
    setLoading(true)
    try {
      let url = '/api/system-settings?page=1&limit=100'
      if (searchText) {
        url += '&search=' + encodeURIComponent(searchText)
      }
      if (selectedCategory && selectedCategory !== 'all') {
        url += '&category=' + encodeURIComponent(selectedCategory)
      }
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setSettings(result.data.settings)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: result.error || '获取系统设置失败',
        })
      }
    } catch (error: any) {
      console.error('获取系统设置失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取审计日志
  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true)
    try {
      const response = await fetch('/api/system-settings/audit-log')
      const result = await response.json()

      if (result.success) {
        setAuditLogs(result.data.auditLogs)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: result.error || '获取审计日志失败',
        })
      }
    } catch (error: any) {
      console.error('获取审计日志失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setAuditLogsLoading(false)
    }
  }

  // 获取登录日志
  const fetchLoginLogs = async () => {
    setLoginLogsLoading(true)
    try {
      const response = await fetch('/api/login-logs?page=1&limit=50')
      const result = await response.json()

      if (result.success) {
        setLoginLogs(result.data.logs)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: result.error || '获取登录日志失败',
        })
      }
    } catch (error: any) {
      console.error('获取登录日志失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoginLogsLoading(false)
    }
  }

  // 删除设置
  const handleDeleteSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/system-settings/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "删除成功",
          description: "系统设置已删除",
        })
        fetchSettings()
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || '删除失败',
        })
      }
    } catch (error: any) {
      console.error('删除设置失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    }
  }

  // 执行拉黑操作
  const handleBlockAction = async () => {
    if (!blockTarget) return
    
    try {
      const response = await fetch('/api/system-settings/blocked-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: blockTarget.type,
          value: blockTarget.value,
          reason: blockReason || '管理员手动拉黑'
        })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "操作成功",
          description: `已成功拉黑${blockTarget.type === 'ip' ? 'IP' : '设备'}: ${blockTarget.label}`,
        })
        setBlockDialogOpen(false)
        setBlockTarget(null)
        setBlockReason('')
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: result.error || '拉黑失败',
        })
      }
    } catch (error: any) {
      console.error('拉黑请求失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    }
  }

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchSettings()
    } else if (activeTab === 'audit') {
      fetchAuditLogs()
    } else if (activeTab === 'login-logs') {
      fetchLoginLogs()
    }
  }, [activeTab, searchText, selectedCategory])

  // 设备图标辅助函数
  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />
      case 'tablet': return <Laptop className="h-4 w-4" /> // 临时用Laptop代替
      default: return <Monitor className="h-4 w-4" />
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
            <BreadcrumbPage>系统设置</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          系统设置
        </h2>
        <p className="text-muted-foreground">
          管理系统配置、审计日志及安全访问控制
        </p>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统设置
          </TabsTrigger>
          <TabsTrigger value="login-logs" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            登录日志
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            审计日志
          </TabsTrigger>
        </TabsList>

        {/* 系统设置 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>系统设置列表</CardTitle>
                  <CardDescription>查看和管理系统配置项</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索设置..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部分类</SelectItem>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            {config.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={fetchSettings} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                  </Button>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    新增
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>分类</TableHead>
                    <TableHead>键名</TableHead>
                    <TableHead>值</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="w-[150px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">正在加载设置...</p>
                      </TableCell>
                    </TableRow>
                  ) : settings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    settings.map((setting) => (
                      <TableRow key={setting.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {categoryConfig[setting.category]?.icon}
                            <span className="text-sm">
                              {categoryConfig[setting.category]?.name || setting.category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{setting.key}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {setting.isSecret ? '******' : setting.value}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate font-light text-muted-foreground">
                          {setting.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal capitalize">{setting.type}</Badge>
                        </TableCell>
                        <TableCell>
                          {setting.isRequired ? (
                            <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200">必填</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget(setting.id)
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
        </TabsContent>

        {/* 登录日志 (新增标签页) */}
        <TabsContent value="login-logs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>登录行为记录</CardTitle>
                <CardDescription>监控系统登录 IP 和设备指纹，识别潜在风险</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchLoginLogs} disabled={loginLogsLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loginLogsLoading ? 'animate-spin' : ''}`} />
                刷新日志
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>IP 地址</TableHead>
                    <TableHead>设备信息</TableHead>
                    <TableHead>操作系统</TableHead>
                    <TableHead>浏览器</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">正在加载登录日志...</p>
                      </TableCell>
                    </TableRow>
                  ) : loginLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        暂无登录日志
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.email}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{log.userId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">{log.ipAddress}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-xs">
                            {getDeviceIcon(log.deviceInfo.device.type)}
                            <span>{log.deviceInfo.device.model === 'Unknown' ? '未知设备' : log.deviceInfo.device.model}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{log.deviceInfo.os.name} {log.deviceInfo.os.version}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{log.deviceInfo.browser.name} ({log.deviceInfo.browser.version.split('.')[0]})</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{dayjs(log.loginTime).format('MM-DD HH:mm')}</span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => {
                                  setBlockTarget({ type: 'ip', value: log.ipAddress, label: log.ipAddress })
                                  setBlockDialogOpen(true)
                                }}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                拉黑 IP
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  // 这里简单用 OS+Browser 作为设备标识，实际项目中应使用更精细的指纹
                                  const deviceLabel = `${log.deviceInfo.os.name} / ${log.deviceInfo.browser.name}`
                                  setBlockTarget({ type: 'device', value: log.userAgent, label: deviceLabel })
                                  setBlockDialogOpen(true)
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                拉黑此设备
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 审计日志 */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>审计日志</CardTitle>
                <CardDescription>查看系统设置的变更历史</CardDescription>
              </div>
              <Button variant="outline" onClick={fetchAuditLogs} disabled={auditLogsLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>设置键名</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>旧值</TableHead>
                    <TableHead>新值</TableHead>
                    <TableHead>原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">正在加载审计日志...</p>
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        暂无审计日志
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.settingKey}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                             {categoryConfig[log.settingCategory]?.name || log.settingCategory}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.action === 'delete' ? 'destructive' : 'default'} className="uppercase text-[10px]">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs font-mono">
                          {log.oldValue || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs font-mono">
                          {log.newValue || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs italic text-muted-foreground">
                          {log.reason || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除这个系统设置吗? 这可能会影响相关功能的正常运行。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  handleDeleteSetting(deleteTarget)
                }
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 拉黑确认对话框 (新增) */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              确认拉黑操作
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                您正在拉黑{blockTarget?.type === 'ip' ? ' IP 地址' : '设备'}: 
                <span className="font-bold ml-1 text-foreground px-1 py-0.5 bg-slate-100 rounded">{blockTarget?.label}</span>
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                拉黑后，该{blockTarget?.type === 'ip' ? ' IP 范围' : '设备指纹'}将无法再次登录系统，直到管理员从黑名单中移除。
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">拉黑原因 (可选)</label>
                <Input 
                  placeholder="请输入拉黑原因，例如：异常频繁登录、恶意扫描等"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlockReason('')}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockAction}
              className="bg-red-600 hover:bg-red-700"
            >
              确认拉黑
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
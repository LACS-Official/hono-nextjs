'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Smartphone,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  Search,
  Trash2,
  ShieldAlert,
  Eye,
  EyeOff
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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

interface UsageRecord {
  id: string
  softwareName: string
  softwareVersion?: string
  deviceFingerprint: string
  used: number
  usedAt: string
}

interface DeviceConnection {
  id: string
  deviceSerial: string
  deviceBrand?: string
  deviceModel?: string
  softwareId: number
  userDeviceFingerprint?: string
  createdAt: string
}

interface UsageStats {
  totalUsage: number
  uniqueDevices: number
  recentUsage: UsageRecord[]
  summary: {
    totalUsage: number
    uniqueDevices: number
    averageUsagePerDevice: string
  }
}

interface DeviceConnectionStats {
  totalConnections: number
  uniqueDevices: number
  recentConnections: DeviceConnection[]
  summary: {
    totalConnections: number
    uniqueDevices: number
    averageConnectionsPerDevice: string
  }
}

export default function UserBehaviorPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [deviceStats, setDeviceStats] = useState<DeviceConnectionStats | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSoftware, setSelectedSoftware] = useState<string>('all')
  const [usageSearch, setUsageSearch] = useState('')
  const [deviceSearch, setDeviceSearch] = useState('')

  // 状态：删除对话框
  const [deleteUsageTarget, setDeleteUsageTarget] = useState<string | null>(null)
  const [deleteDeviceTarget, setDeleteDeviceTarget] = useState<string | null>(null)
  const [blockTarget, setBlockTarget] = useState<{ type: 'device'; value: string; label: string } | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [showRawIds, setShowRawIds] = useState<Record<string, boolean>>({})

  const toggleRawId = (id: string) => {
    setShowRawIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const maskId = (id: string, start = 5, end = 5) => {
    if (id.length <= (start + end)) return id
    return `${id.substring(0, start)}****${id.substring(id.length - end)}`
  }

  // 获取使用统计数据
  const fetchUsageStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedSoftware && selectedSoftware !== 'all') {
        params.append('softwareId', selectedSoftware)
      }
      if (startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }
      if (usageSearch) {
        params.append('search', usageSearch)
      }

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "未登录",
          description: "请先登录",
        })
        return
      }

      const response = await fetch(`/api/user-behavior/usage?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setUsageStats(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: data.error || "获取使用统计失败",
        })
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取设备连接统计数据
  const fetchDeviceStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedSoftware && selectedSoftware !== 'all') {
        params.append('softwareId', selectedSoftware)
      }
      if (startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }
      if (deviceSearch) {
        params.append('search', deviceSearch)
      }

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "未登录",
          description: "请先登录",
        })
        return
      }

      const response = await fetch(`/api/user-behavior/device-connections?${params}`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setDeviceStats(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: data.error || "获取设备连接统计失败",
        })
      }
    } catch (error) {
      console.error('Error fetching device stats:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除使用记录
  const handleDeleteUsage = async (id: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch(`/api/user-behavior/usage?id=${id}${selectedSoftware !== 'all' ? `&softwareId=${selectedSoftware}` : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        toast({ title: "删除成功", description: data.message })
        fetchUsageStats()
      } else {
        toast({ variant: "destructive", title: "删除失败", description: data.error })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "网络异常" })
    }
  }

  // 删除设备连接记录
  const handleDeleteDevice = async (id: string) => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch(`/api/user-behavior/device-connections?id=${id}${selectedSoftware !== 'all' ? `&softwareId=${selectedSoftware}` : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        toast({ title: "删除成功", description: data.message })
        fetchDeviceStats()
      } else {
        toast({ variant: "destructive", title: "删除失败", description: data.error })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "网络异常" })
    }
  }

  // 执行拉黑操作
  const handleBlockAction = async () => {
    if (!blockTarget) return
    
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/system-settings/blocked-items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: blockTarget.type,
          value: blockTarget.value,
          reason: blockReason || '管理员从行为统计面板拉黑'
        })
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "操作成功",
          description: `已成功忽略设备: ${blockTarget.label}`,
        })
        setBlockDialogOpen(false)
        setBlockTarget(null)
        setBlockReason('')
        // 拉黑后通常希望也删除记录
        if (blockTarget.type === 'device') {
          // 这里可以根据业务决定是否自动删除，暂不自动删除
        }
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.error })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "请求失败" })
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchUsageStats()
    fetchDeviceStats()
  }

  // 导出数据
  const handleExport = () => {
    toast({
      title: "开发中",
      description: "导出功能正在开发中...",
    })
  }

  useEffect(() => {
    fetchUsageStats()
    fetchDeviceStats()
  }, [selectedSoftware, startDate, endDate, usageSearch, deviceSearch])

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
            <BreadcrumbPage>用户行为统计</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">用户行为统计</h2>
          <p className="text-muted-foreground">
            查看软件使用情况和设备连接统计
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[150px]"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[150px]"
          />
          <Select value={selectedSoftware} onValueChange={setSelectedSoftware}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择软件" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部软件</SelectItem>
              <SelectItem value="1">玩机管家</SelectItem>
              <SelectItem value="19">玩机管家安卓版</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="usage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            软件使用统计
          </TabsTrigger>
          <TabsTrigger value="device" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            设备连接统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-6">
          {/* 使用统计卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总使用次数</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.totalUsage || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">独立设备数</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.uniqueDevices || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均使用次数/设备</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.summary.averageUsagePerDevice || '0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 使用记录表格 */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>最近使用记录</CardTitle>
                    <CardDescription>
                      显示最近的软件使用记录
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索设备指纹..."
                      className="pl-8"
                      value={usageSearch}
                      onChange={(e) => setUsageSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>软件名称</TableHead>
                    <TableHead>软件版本</TableHead>
                    <TableHead>设备指纹</TableHead>
                    <TableHead>使用次数</TableHead>
                    <TableHead>最后使用时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : usageStats?.recentUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageStats?.recentUsage.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.softwareName}</TableCell>
                        <TableCell>{record.softwareVersion || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                              {showRawIds[record.id] ? record.deviceFingerprint : maskId(record.deviceFingerprint)}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRawId(record.id)}
                            >
                              {showRawIds[record.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.used}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(record.usedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600"
                              onClick={() => {
                                setBlockTarget({ type: 'device', value: record.deviceFingerprint, label: '设备指纹' })
                                setBlockDialogOpen(true)
                              }}
                              title="忽略/拉黑此设备"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleDeleteUsage(record.id)}
                              title="删除记录"
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device" className="space-y-6">
          {/* 设备统计卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总连接次数</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deviceStats?.totalConnections || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">独立设备数</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deviceStats?.uniqueDevices || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均连接次数/设备</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {deviceStats?.summary.averageConnectionsPerDevice || '0'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 设备连接记录表格 */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>最近连接记录</CardTitle>
                    <CardDescription>
                      显示最近的设备连接记录
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索序列号/品牌/型号..."
                      className="pl-8"
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备序列号</TableHead>
                    <TableHead>设备品牌</TableHead>
                    <TableHead>设备型号</TableHead>
                    <TableHead>软件ID</TableHead>
                    <TableHead>用户设备指纹</TableHead>
                    <TableHead>连接时间</TableHead>
                    <TableHead className="w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : deviceStats?.recentConnections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    deviceStats?.recentConnections.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                              {showRawIds[record.id] ? record.deviceSerial : maskId(record.deviceSerial, 2, 2)}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0"
                              onClick={() => toggleRawId(record.id)}
                            >
                              {showRawIds[record.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{record.deviceBrand || '-'}</TableCell>
                        <TableCell>{record.deviceModel || '-'}</TableCell>
                        <TableCell>{record.softwareId}</TableCell>
                        <TableCell>
                          {record.userDeviceFingerprint ? (
                            <code className="text-xs">
                              {record.userDeviceFingerprint}
                            </code>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600"
                              onClick={() => {
                                setBlockTarget({ type: 'device', value: record.deviceSerial, label: record.deviceModel || '设备' })
                                setBlockDialogOpen(true)
                              }}
                              title="忽略/拉黑此设备"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleDeleteDevice(record.id)}
                              title="删除记录"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 拉黑确认对话框 */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              确认忽略/拉黑设备
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                您正在拉黑设备: 
                <span className="font-bold ml-1 text-foreground px-1 py-0.5 bg-slate-100 rounded">{blockTarget?.label} ({blockTarget?.value})</span>
              </p>
              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                拉黑后，系统将不再记录该设备的任何行为统计数据。您可以在 “系统设置 &gt; 登录日志” 中管理黑名单。
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">拉黑原因 (可选)</label>
                <Input 
                  placeholder="请输入原因"
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
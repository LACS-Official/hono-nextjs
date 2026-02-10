'use client'

import React, { useState, useEffect } from 'react'
import {
  User,
  Smartphone,
  BarChart3,
  RefreshCw,
  Download,
  Calendar
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
  }, [selectedSoftware, startDate, endDate])

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
          <Card>
            <CardHeader>
              <CardTitle>最近使用记录</CardTitle>
              <CardDescription>
                显示最近的软件使用记录
              </CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : usageStats?.recentUsage.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageStats?.recentUsage.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.softwareName}</TableCell>
                        <TableCell>{record.softwareVersion || '-'}</TableCell>
                        <TableCell>
                          <code className="text-xs">
                            {record.deviceFingerprint.substring(0, 16)}...
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{record.used}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(record.usedAt).format('YYYY-MM-DD HH:mm:ss')}
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
          <Card>
            <CardHeader>
              <CardTitle>最近连接记录</CardTitle>
              <CardDescription>
                显示最近的设备连接记录
              </CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : deviceStats?.recentConnections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    deviceStats?.recentConnections.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <code className="text-xs">{record.deviceSerial}</code>
                        </TableCell>
                        <TableCell>{record.deviceBrand || '-'}</TableCell>
                        <TableCell>{record.deviceModel || '-'}</TableCell>
                        <TableCell>{record.softwareId}</TableCell>
                        <TableCell>
                          {record.userDeviceFingerprint ? (
                            <code className="text-xs">
                              {record.userDeviceFingerprint.substring(0, 16)}...
                            </code>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm:ss')}
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
    </div>
  )
}
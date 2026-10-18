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
  EyeOff,
  Activity,
  TrendingUp,
  Clock,
  Globe2,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Users,
  Flame,
  ArrowRight,
  Wifi,
  Compass,
  CheckCircle2,
  Sparkles
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
import { Progress } from "@/components/ui/progress"
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
import { createClient } from '@/utils/supabase/client'

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

interface ComprehensiveStats {
  summary: {
    totalUsage: number
    uniqueUsedDevices: number
    totalConnections: number
    uniqueConnectedDevices: number
    averageUsagePerDevice: string
    averageConnectionsPerDevice: string
  }
  retention: {
    dau: number
    wau: number
    mau: number
    newDevicesToday: number
    returningDevicesToday: number
    day1Rate: number
    day3Rate: number
    day7Rate: number
    day30Rate: number
    churnAnalysis: {
      healthyActive: number
      atRisk: number
      churned: number
      healthyRate: number
      atRiskRate: number
      churnedRate: number
    }
  }
  heatmaps: {
    hourlyDistribution: Array<{ hour: string; hourNum: number; count: number }>
    peakHourText: string
    weeklyDistribution: Array<{ day: string; dayNum: number; count: number }>
  }
  funnel: {
    steps: Array<{
      name: string
      stage: string
      count: number
      conversionRate: number
      dropOffRate: number
      description: string
    }>
    overallConversionRate: number
  }
  geoProfile: {
    topProvinces: Array<{ province: string; count: number; percentage: number }>
    ispDistribution: Array<{ isp: string; count: number; percentage: number }>
  }
  trends: {
    usageTrend: Array<{ date: string; count: string | number }>
    connectionTrend: Array<{ date: string; count: number }>
  }
  brandDistribution: Array<{ brand: string; count: number }>
}

export default function UserBehaviorPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [compLoading, setCompLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [compStats, setCompStats] = useState<ComprehensiveStats | null>(null)
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

  // 获取综合深度统计数据 (留存、热力时段、漏斗、地域)
  const fetchComprehensiveStats = async () => {
    try {
      setCompLoading(true)
      const params = new URLSearchParams()
      if (selectedSoftware && selectedSoftware !== 'all') {
        params.append('softwareId', selectedSoftware)
      }
      if (startDate && endDate) {
        params.append('startDate', startDate)
        params.append('endDate', endDate)
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user-behavior/stats?${params}`, {
        credentials: 'include',
        headers
      })
      const res = await response.json()
      if (res.success && res.data) {
        setCompStats(res.data)
      }
    } catch (error) {
      console.error('Error fetching comprehensive stats:', error)
    } finally {
      setCompLoading(false)
    }
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

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user-behavior/usage?${params}`, {
        credentials: 'include',
        headers
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

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }

      const response = await fetch(`/api/user-behavior/device-connections?${params}`, {
        credentials: 'include',
        headers
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
        fetchComprehensiveStats()
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
        fetchComprehensiveStats()
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
      } else {
        toast({ variant: "destructive", title: "操作失败", description: result.error })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "错误", description: "请求失败" })
    }
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchComprehensiveStats()
    fetchUsageStats()
    fetchDeviceStats()
  }

  // 导出数据
  const handleExport = () => {
    toast({
      title: "数据导出",
      description: "已生成当前统计快照并准备导出...",
    })
  }

  useEffect(() => {
    fetchComprehensiveStats()
    fetchUsageStats()
    fetchDeviceStats()
  }, [selectedSoftware, startDate, endDate, usageSearch, deviceSearch])

  // 最大时段统计基数（用于等比渲染高度）
  const maxHourlyCount = Math.max(
    1,
    ...(compStats?.heatmaps.hourlyDistribution.map(h => h.count) || [1])
  )
  const maxWeeklyCount = Math.max(
    1,
    ...(compStats?.heatmaps.weeklyDistribution.map(w => w.count) || [1])
  )

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
            <BreadcrumbPage>用户行为统计与留存分析</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">用户行为统计与留存分析</h2>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
              零破坏升级
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            基于现有接口无感沉淀的留存队列、24h活跃时段、全链路业务转化漏斗与地域运营商画像
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[140px] text-xs h-9"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[140px] text-xs h-9"
          />
          <Select value={selectedSoftware} onValueChange={setSelectedSoftware}>
            <SelectTrigger className="w-[160px] text-xs h-9">
              <SelectValue placeholder="选择软件" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部软件</SelectItem>
              <SelectItem value="1">玩机管家</SelectItem>
              <SelectItem value="19">玩机管家安卓版</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || compLoading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading || compLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            导出
          </Button>
        </div>
      </div>

      {/* 标签页导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-xs font-medium">
            <Activity className="h-4 w-4" />
            综合深度分析与留存
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2 text-xs font-medium">
            <BarChart3 className="h-4 w-4" />
            软件使用记录流水
          </TabsTrigger>
          <TabsTrigger value="device" className="flex items-center gap-2 text-xs font-medium">
            <Smartphone className="h-4 w-4" />
            外部设备连接明细
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: 综合深度分析与留存 (NEW DEEP ANALYTICS TAB) */}
        {/* ============================================================== */}
        <TabsContent value="overview" className="space-y-6">
          {/* 1. 活跃度核心 KPI 卡片 */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-slate-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">今日活跃设备 (DAU)</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {compStats?.retention.dau ?? usageStats?.uniqueDevices ?? 0}
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
                  <span className="text-emerald-600 font-medium">
                    +{compStats?.retention.newDevicesToday ?? 0} 新增
                  </span>
                  <span>•</span>
                  <span>{compStats?.retention.returningDevicesToday ?? 0} 老客回访</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">周活跃 (WAU) / 月活跃 (MAU)</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {compStats?.retention.wau ?? 0}{' '}
                  <span className="text-sm font-normal text-muted-foreground">/ {compStats?.retention.mau ?? 0}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  月活健康粘性比 (DAU/MAU):{' '}
                  <span className="font-medium text-slate-800">
                    {compStats && compStats.retention.mau > 0
                      ? `${Math.round((compStats.retention.dau / compStats.retention.mau) * 100)}%`
                      : '0%'}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">累计独立设备 / 总使用</CardTitle>
                <Users className="h-4 w-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {compStats?.summary.uniqueUsedDevices ?? usageStats?.uniqueDevices ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  累计启动 {compStats?.summary.totalUsage ?? usageStats?.totalUsage ?? 0} 次 (人均{' '}
                  {compStats?.summary.averageUsagePerDevice ?? '0'} 次)
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">手机连接设备数 (USB/Net)</CardTitle>
                <Smartphone className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {compStats?.summary.uniqueConnectedDevices ?? deviceStats?.uniqueDevices ?? 0}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  累计连接 {compStats?.summary.totalConnections ?? deviceStats?.totalConnections ?? 0} 次 (人均{' '}
                  {compStats?.summary.averageConnectionsPerDevice ?? '0'} 台)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 2. 用户留存率矩阵与流失预警 */}
          <div className="grid gap-6 md:grid-cols-12">
            <Card className="md:col-span-7 shadow-sm border-slate-200/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      用户生命周期留存率矩阵 (Cohort Retention)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      追踪客户端设备在初次启动后持续回访的健康度比率
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">自动回溯</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">次日留存 (Day 1)</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {compStats?.retention.day1Rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">关键破冰指标</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">3日留存 (Day 3)</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {compStats?.retention.day3Rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">习惯形成期</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">7日留存 (Day 7)</span>
                    <span className="text-2xl font-bold text-violet-600">
                      {compStats?.retention.day7Rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">中周期粘性</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-lg">
                    <span className="text-xs text-muted-foreground block mb-1">30日留存 (Day 30)</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      {compStats?.retention.day30Rate ?? 0}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-1">核心忠实用户</span>
                  </div>
                </div>

                {/* 流失风险分布 */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-600">设备健康活跃状态分布</span>
                    <span className="text-muted-foreground">
                      活跃 {compStats?.retention.churnAnalysis.healthyActive ?? 0} / 预流失 {compStats?.retention.churnAnalysis.atRisk ?? 0} / 沉睡 {compStats?.retention.churnAnalysis.churned ?? 0}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${compStats?.retention.churnAnalysis.healthyRate ?? 10}%` }}
                      title={`健康活跃: ${compStats?.retention.churnAnalysis.healthyActive} 台 (${compStats?.retention.churnAnalysis.healthyRate}%)`}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${compStats?.retention.churnAnalysis.atRiskRate ?? 15}%` }}
                      title={`预流失风险 (7-30天未活跃): ${compStats?.retention.churnAnalysis.atRisk} 台 (${compStats?.retention.churnAnalysis.atRiskRate}%)`}
                    />
                    <div
                      className="bg-slate-300 h-full"
                      style={{ width: `${compStats?.retention.churnAnalysis.churnedRate ?? 75}%` }}
                      title={`长期沉睡 (>30天未活跃): ${compStats?.retention.churnAnalysis.churned} 台 (${compStats?.retention.churnAnalysis.churnedRate}%)`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> 健康活跃 (7天内活跃)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400" /> 预流失风险 (7-30天未活跃)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-slate-300" /> 沉睡用户 (&gt;30天未活跃)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. 全链路转化漏斗 */}
            <Card className="md:col-span-5 shadow-sm border-slate-200/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-purple-600" />
                      全链路业务转化漏斗 (Funnel)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      应用启动 ➔ 手机设备连接 ➔ VIP 卡密核销
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-purple-700 bg-purple-50">
                    总体转化率 {compStats?.funnel.overallConversionRate ?? 0}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {compStats?.funnel.steps.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {step.name}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {step.count} 台{' '}
                        <span className="text-muted-foreground font-normal text-[11px]">
                          ({step.conversionRate}%)
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={Math.min(100, step.conversionRate)} className="h-2.5" />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>{step.description}</span>
                      {idx > 0 && (
                        <span className="text-orange-600 font-medium">
                          阶段流失率 {step.dropOffRate}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 4. 24小时时段分布 & 星期周期趋势 */}
          <div className="grid gap-6 md:grid-cols-12">
            <Card className="md:col-span-8 shadow-sm border-slate-200/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      24 小时活跃时段热力分布 (Hourly Heatmap)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      查看用户在全天 24 小时各时段的启动与操作活跃高峰
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
                    高峰时段: {compStats?.heatmaps.peakHourText || '20:00 - 21:00'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-36 flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100">
                  {compStats?.heatmaps.hourlyDistribution.map((item, idx) => {
                    const heightPercent = Math.max(6, Math.round((item.count / maxHourlyCount) * 100))
                    const isPeak = item.count === maxHourlyCount && item.count > 0
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* 气泡提示 */}
                        <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10">
                          {item.hour}: {item.count}次
                        </div>
                        {/* 柱状条 */}
                        <div
                          className={`w-full rounded-t-sm transition-all duration-300 ${
                            isPeak
                              ? 'bg-amber-500 group-hover:bg-amber-600'
                              : 'bg-blue-400/80 group-hover:bg-blue-600'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1.5">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>23:00</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-4 shadow-sm border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  星期活跃周期 (Weekday Trend)
                </CardTitle>
                <CardDescription className="text-xs">
                  周末与工作日的用户活跃度比对
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-2">
                {compStats?.heatmaps.weeklyDistribution.map((w, idx) => {
                  const widthPercent = Math.max(4, Math.round((w.count / maxWeeklyCount) * 100))
                  const isWeekend = w.day === '周六' || w.day === '周日'
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-medium ${isWeekend ? 'text-amber-700 font-semibold' : 'text-slate-700'}`}>
                          {w.day} {isWeekend && <span className="text-[10px] text-amber-600">(周末)</span>}
                        </span>
                        <span className="text-muted-foreground">{w.count} 次</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isWeekend ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* 5. 地域分布与网络运营商画像 */}
          <div className="grid gap-6 md:grid-cols-12">
            <Card className="md:col-span-7 shadow-sm border-slate-200/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-teal-600" />
                      用户省份地域分布 (Top Regions)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      根据客户端请求 IP 自动解析的全国各省份装机热度
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">IP 自动识别</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {compStats?.geoProfile.topProvinces.slice(0, 7).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium flex items-center gap-2">
                        <span className={`h-4 w-4 rounded text-[10px] flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-800' :
                          idx === 1 ? 'bg-slate-200 text-slate-800' :
                          idx === 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        {item.province}
                      </span>
                      <span className="text-slate-700 font-semibold">
                        {item.count} 台 <span className="font-normal text-muted-foreground text-[11px]">({item.percentage}%)</span>
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-5 shadow-sm border-slate-200/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-cyan-600" />
                  网络运营商画像 (ISP Distribution)
                </CardTitle>
                <CardDescription className="text-xs">
                  分析客户端所处的网络接入商环境
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {compStats?.geoProfile.ispDistribution.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.isp}</span>
                      <span className="font-semibold text-slate-800">
                        {item.count} 台 ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs font-medium text-muted-foreground block mb-2">连接手机品牌 Top 5</span>
                  <div className="flex flex-wrap gap-1.5">
                    {compStats?.brandDistribution.slice(0, 5).map((b, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs py-0.5">
                        {b.brand}: <strong className="ml-1">{b.count}</strong>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: 软件使用记录明细 (EXISTING USAGE TAB) */}
        {/* ============================================================== */}
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
                  <CardTitle>最近使用记录流水</CardTitle>
                  <CardDescription>
                    显示客户端上报的原始设备使用快照
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
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {record.softwareVersion || 'v1.0.0'}
                          </Badge>
                        </TableCell>
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
                          <Badge variant="secondary">
                            {record.used} 次
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {dayjs(record.usedAt).format('YYYY-MM-DD HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                setBlockTarget({ type: 'device', value: record.deviceFingerprint, label: record.deviceFingerprint })
                                setBlockDialogOpen(true)
                              }}
                              title="忽略/拉黑此设备"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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

        {/* ============================================================== */}
        {/* TAB 3: 外部设备连接明细 (EXISTING DEVICE CONNECTIONS TAB) */}
        {/* ============================================================== */}
        <TabsContent value="device" className="space-y-6">
          {/* 设备连接统计卡片 */}
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
                <CardTitle className="text-sm font-medium">连接手机设备数</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
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
                  <CardTitle>手机连接记录流水</CardTitle>
                  <CardDescription>
                    显示客户端 USB / 网络连接识别到的安卓/iOS 实体机型
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索序列号或机型..."
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
                    <TableHead>品牌</TableHead>
                    <TableHead>型号</TableHead>
                    <TableHead>软件ID</TableHead>
                    <TableHead>宿主电脑指纹</TableHead>
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
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
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
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
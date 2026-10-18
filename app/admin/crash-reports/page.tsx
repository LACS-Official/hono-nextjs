'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ChevronRight,
  Terminal,
  Laptop,
  Cpu,
  Activity,
  Layers,
  Copy,
  Check,
  MoreHorizontal,
  Archive,
  Eye,
  SlidersHorizontal,
  AppWindow,
  Monitor
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface CrashGroup {
  crashHash: string
  softwareName: string
  errorType: string
  errorMessage: string
  crashModule: string | null
  status: 'unresolved' | 'investigating' | 'resolved' | 'ignored'
  sampleStack: string | null
  sampleDevice: string | null
  sampleGpu: string | null
  sampleOs: string | null
  occurrences: number
  affectedVersions: string[]
  affectedPlatforms: string[]
  firstSeenAt: string
  lastSeenAt: string
}

interface RawCrashReport {
  id: number
  softwareId: number | null
  softwareName: string
  appVersion: string
  osName: string
  osVersion: string | null
  deviceModel: string | null
  cpuArch: string | null
  gpuRenderer: string | null
  errorType: string
  errorMessage: string
  errorStack: string | null
  crashModule: string | null
  crashHash: string
  customData: any
  clientIp: string | null
  userId: string | null
  status: 'unresolved' | 'investigating' | 'resolved' | 'ignored'
  createdAt: string
}

interface CrashStatsSummary {
  totalCrashes: number
  todayCrashes: number
  unresolvedIssues: number
  investigatingIssues: number
  resolvedIssues: number
  ignoredIssues: number
  totalIssues: number
}

interface SoftwareFilterItem {
  softwareName: string
  versions: string[]
}

const statusConfig: Record<string, { label: string; badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline'; colorClass: string }> = {
  unresolved: { label: '待处理', badgeVariant: 'destructive', colorClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  investigating: { label: '排查中', badgeVariant: 'outline', colorClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  resolved: { label: '已修复', badgeVariant: 'default', colorClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  ignored: { label: '已忽略', badgeVariant: 'secondary', colorClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
}

export default function CrashReportsPage() {
  const { toast } = useToast()

  // 核心数据
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<CrashGroup[]>([])
  const [rawReports, setRawReports] = useState<RawCrashReport[]>([])
  const [stats, setStats] = useState<CrashStatsSummary>({
    totalCrashes: 0,
    todayCrashes: 0,
    unresolvedIssues: 0,
    investigatingIssues: 0,
    resolvedIssues: 0,
    ignoredIssues: 0,
    totalIssues: 0,
  })
  const [softwareFilters, setSoftwareFilters] = useState<SoftwareFilterItem[]>([])

  // 分页与筛选
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedSoftware, setSelectedSoftware] = useState<string>('all')
  const [selectedVersion, setSelectedVersion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 详情弹窗
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [activeIssue, setActiveIssue] = useState<CrashGroup | null>(null)
  const [activeReportHistory, setActiveReportHistory] = useState<RawCrashReport[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [copiedStack, setCopiedStack] = useState(false)

  // 加载统计与筛选项
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/telemetry/crash/stats')
      const json = await res.json()
      if (json.success && json.data) {
        setStats(json.data.summary)
        setSoftwareFilters(json.data.filters.softwareList || [])
      }
    } catch (err) {
      console.error('加载崩溃统计失败:', err)
    }
  }, [])

  // 加载主列表
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('mode', viewMode)
      params.set('page', String(page))
      params.set('limit', '20')

      if (selectedSoftware !== 'all') params.set('softwareName', selectedSoftware)
      if (selectedVersion !== 'all') params.set('appVersion', selectedVersion)
      if (selectedStatus !== 'all') params.set('status', selectedStatus)
      if (searchKeyword.trim()) params.set('search', searchKeyword.trim())

      const res = await fetch(`/api/admin/telemetry/crash?${params.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        if (viewMode === 'grouped') {
          setGroups(json.data.groups || [])
        } else {
          setRawReports(json.data.reports || [])
        }
        setTotalPages(json.data.pagination.totalPages || 1)
        setTotalCount(json.data.pagination.total || 0)
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: json.error || "获取崩溃日志列表失败",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message || "无法连接崩溃监控接口",
      })
    } finally {
      setLoading(false)
    }
  }, [viewMode, page, selectedSoftware, selectedVersion, selectedStatus, searchKeyword, toast])

  // 初始化加载
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // 当选择不同软件时，重置版本选择
  const availableVersions = React.useMemo(() => {
    if (selectedSoftware === 'all') {
      const allVers = new Set<string>()
      softwareFilters.forEach(s => s.versions.forEach(v => allVers.add(v)))
      return Array.from(allVers)
    }
    const found = softwareFilters.find(s => s.softwareName === selectedSoftware)
    return found ? found.versions : []
  }, [selectedSoftware, softwareFilters])

  // 更新问题状态
  const handleUpdateStatus = async (crashHash: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/telemetry/crash/${crashHash}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, applyToAllWithSameHash: true }),
      })
      const json = await res.json()
      if (json.success) {
        toast({
          title: "状态已更新",
          description: json.message || `已标记为 [${statusConfig[newStatus]?.label || newStatus}]`,
        })
        fetchReports()
        fetchStats()
        if (activeIssue && activeIssue.crashHash === crashHash) {
          setActiveIssue(prev => prev ? { ...prev, status: newStatus as any } : null)
        }
      } else {
        toast({
          variant: "destructive",
          title: "更新失败",
          description: json.error || "未能更新状态",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求错误",
        description: err.message,
      })
    }
  }

  // 删除问题组
  const handleDeleteGroup = async (crashHash: string) => {
    if (!confirm('确定要删除该问题组的所有崩溃记录吗？此操作无法撤销。')) return

    try {
      const res = await fetch(`/api/admin/telemetry/crash/${crashHash}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast({
          title: "删除成功",
          description: json.message || "该问题组的崩溃记录已清理",
        })
        fetchReports()
        fetchStats()
        if (detailModalOpen) setDetailModalOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: json.error,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求错误",
        description: err.message,
      })
    }
  }

  // 批量清理操作
  const handleBatchCleanup = async (action: 'clear_resolved' | 'clear_old') => {
    const confirmText = action === 'clear_resolved'
      ? '确定要清空所有已标记为【已修复】的崩溃记录吗？'
      : '确定要清理 30 天前的历史崩溃记录吗？'
    if (!confirm(confirmText)) return

    try {
      const res = await fetch('/api/admin/telemetry/crash/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, daysOld: 30 }),
      })
      const json = await res.json()
      if (json.success) {
        toast({
          title: "清理完成",
          description: json.message,
        })
        fetchReports()
        fetchStats()
      } else {
        toast({
          variant: "destructive",
          title: "清理失败",
          description: json.error,
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message,
      })
    }
  }

  // 查看问题详情并拉取发生历史
  const handleOpenDetail = async (issue: CrashGroup) => {
    setActiveIssue(issue)
    setDetailModalOpen(true)
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/admin/telemetry/crash/${issue.crashHash}`)
      const json = await res.json()
      if (json.success && json.data) {
        setActiveReportHistory(json.data.reports || [])
      }
    } catch (err) {
      console.error('加载发生历史失败:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // 复制堆栈信息
  const handleCopyStack = (stackText: string) => {
    navigator.clipboard.writeText(stackText)
    setCopiedStack(true)
    toast({ title: "堆栈信息已复制到剪贴板" })
    setTimeout(() => setCopiedStack(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航与页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Breadcrumb className="mb-2">
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
                <BreadcrumbPage>客户端崩溃监控</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                客户端崩溃日志监控
              </h1>
              <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-0.5">
                实时聚合客户端异常堆栈、系统版本与硬件环境，助力快速定位排查缺陷
              </p>
            </div>
          </div>
        </div>

        {/* 顶部快捷操作 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats()
              fetchReports()
            }}
            disabled={loading}
            className="h-8 rounded-lg text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                维护清理
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => handleBatchCleanup('clear_resolved')}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                清空已标记修复的记录
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBatchCleanup('clear_old')} className="text-red-600 dark:text-red-400">
                <Trash2 className="mr-2 h-4 w-4" />
                清理 30 天前历史崩溃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI 核心指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">累计崩溃上报</CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              {stats.totalCrashes.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              涵盖全平台客户端异常
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">今日新增崩溃</CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              {stats.todayCrashes.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              过去 24 小时上报日志
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">待排查问题组</CardTitle>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Bug className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-red-600 dark:text-red-400">
              {stats.unresolvedIssues.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              共 {stats.totalIssues} 个独立异常特征
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">已修复与忽略</CardTitle>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
              {stats.resolvedIssues.toLocaleString()}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              已归档 / 修复标记
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选与模式切换工具栏 */}
      <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* 筛选选择器 */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* 软件筛选 */}
            <Select
              value={selectedSoftware}
              onValueChange={(val) => {
                setSelectedSoftware(val)
                setSelectedVersion('all')
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs">
                <SelectValue placeholder="全部软件" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">全部软件</SelectItem>
                {softwareFilters.map(item => (
                  <SelectItem key={item.softwareName} value={item.softwareName}>
                    {item.softwareName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 版本筛选 */}
            <Select
              value={selectedVersion}
              onValueChange={(val) => {
                setSelectedVersion(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px] h-8 rounded-lg text-xs">
                <SelectValue placeholder="全部版本" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">全部版本</SelectItem>
                {availableVersions.map(ver => (
                  <SelectItem key={ver} value={ver}>
                    v{ver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 状态筛选 */}
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                setSelectedStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="unresolved">待处理</SelectItem>
                <SelectItem value="investigating">排查中</SelectItem>
                <SelectItem value="resolved">已修复</SelectItem>
                <SelectItem value="ignored">已忽略</SelectItem>
              </SelectContent>
            </Select>

            {/* 关键词搜索 */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索错误信息、堆栈或设备..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1)
                    fetchReports()
                  }
                }}
                className="h-8 pl-8 rounded-lg text-xs"
              />
            </div>

            {(selectedSoftware !== 'all' || selectedVersion !== 'all' || selectedStatus !== 'all' || searchKeyword) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSoftware('all')
                  setSelectedVersion('all')
                  setSelectedStatus('all')
                  setSearchKeyword('')
                  setPage(1)
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                重置筛选
              </Button>
            )}
          </div>

          {/* 模式切换 (聚合 / 流水) */}
          <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-xl self-start lg:self-auto">
            <button
              onClick={() => {
                setViewMode('grouped')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-[#202022] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#6e6e73] dark:text-[#a1a1a6] hover:text-foreground'
              }`}
            >
              按问题聚合 ({stats.totalIssues})
            </button>
            <button
              onClick={() => {
                setViewMode('list')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#202022] text-[#1d1d1f] dark:text-[#f5f5f7] shadow-sm'
                  : 'text-[#6e6e73] dark:text-[#a1a1a6] hover:text-foreground'
              }`}
            >
              原始流水明细 ({stats.totalCrashes})
            </button>
          </div>
        </div>
      </Card>

      {/* 视图内容区 */}
      {viewMode === 'grouped' ? (
        // 1. 聚合问题卡片视图
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mb-2" />
              <span className="text-xs">加载崩溃数据中...</span>
            </div>
          ) : groups.length === 0 ? (
            <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">未发现匹配的崩溃报告</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                当前筛选条件下没有记录，客户端运行状态良好或尚未产生崩溃异常。
              </p>
            </Card>
          ) : (
            groups.map((group) => {
              const statusCfg = statusConfig[group.status] || statusConfig.unresolved
              return (
                <Card
                  key={group.crashHash}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm hover:border-black/15 dark:hover:border-white/20 transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* 左侧主要信息 */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 状态标签 */}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusCfg.colorClass}`}>
                          {statusCfg.label}
                        </span>

                        {/* 软件名称 */}
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {group.softwareName}
                        </Badge>

                        {/* 崩溃次数高亮 */}
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15 border-none text-[11px] font-mono">
                          {group.occurrences} 次崩溃
                        </Badge>

                        {/* 影响版本 */}
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span>版本:</span>
                          {group.affectedVersions.slice(0, 3).map((v) => (
                            <span key={v} className="bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded font-mono text-[10px]">
                              v{v}
                            </span>
                          ))}
                          {group.affectedVersions.length > 3 && (
                            <span className="text-[10px]">+{group.affectedVersions.length - 3}</span>
                          )}
                        </div>
                      </div>

                      {/* 错误标题与模块定位 */}
                      <div>
                        <div className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
                          <span className="text-red-600 dark:text-red-400 font-mono">{group.errorType}</span>
                          {group.crashModule && (
                            <span className="text-xs text-muted-foreground font-mono bg-black/[0.03] dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                              {group.crashModule}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#48484a] dark:text-[#aeaeb2] mt-1 line-clamp-2 font-mono leading-relaxed bg-black/[0.02] dark:bg-white/[0.02] p-2 rounded-lg border border-black/[0.03] dark:border-white/[0.04]">
                          {group.errorMessage}
                        </p>
                      </div>

                      {/* 平台环境与时间标签 */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#86868b] dark:text-[#86868b]">
                        <span className="flex items-center gap-1">
                          <Monitor className="h-3.5 w-3.5" />
                          {group.affectedPlatforms.join(', ') || '多平台'}
                        </span>
                        {group.sampleDevice && (
                          <span className="flex items-center gap-1">
                            <Laptop className="h-3.5 w-3.5" />
                            {group.sampleDevice}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          最后发生: {dayjs(group.lastSeenAt).fromNow()}
                        </span>
                      </div>
                    </div>

                    {/* 右侧操作按钮 */}
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                      <Button
                        size="sm"
                        onClick={() => handleOpenDetail(group)}
                        className="h-8 rounded-lg text-xs bg-[#0071e3] hover:bg-[#0077ed] text-white"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        分析堆栈详情
                      </Button>

                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg px-2.5">
                              修改状态
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(group.crashHash, 'unresolved')}>
                              <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                              标为待处理
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(group.crashHash, 'investigating')}>
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                              标为排查中
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(group.crashHash, 'resolved')}>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                              标为已修复
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(group.crashHash, 'ignored')}>
                              <span className="w-2 h-2 rounded-full bg-slate-400 mr-2" />
                              标为忽略
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteGroup(group.crashHash)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              删除本组记录
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        // 2. 原始日志流水视图 (Table)
        <Card className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#161618] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-black/[0.05] dark:border-white/[0.06]">
                  <TableHead className="text-xs">发生时间</TableHead>
                  <TableHead className="text-xs">软件与版本</TableHead>
                  <TableHead className="text-xs">异常类型 / 模块</TableHead>
                  <TableHead className="text-xs">错误摘要</TableHead>
                  <TableHead className="text-xs">系统与设备</TableHead>
                  <TableHead className="text-xs">客户端 IP</TableHead>
                  <TableHead className="text-xs">状态</TableHead>
                  <TableHead className="text-xs text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                      加载数据中...
                    </TableCell>
                  </TableRow>
                ) : rawReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                      暂无原始崩溃日志记录
                    </TableCell>
                  </TableRow>
                ) : (
                  rawReports.map((report) => (
                    <TableRow key={report.id} className="border-b border-black/[0.03] dark:border-white/[0.04]">
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {dayjs(report.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                          {report.softwareName}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          v{report.appVersion}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-xs font-mono text-red-600 dark:text-red-400 font-medium">
                          {report.errorType}
                        </span>
                        {report.crashModule && (
                          <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                            {report.crashModule}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[280px] truncate text-muted-foreground">
                        {report.errorMessage}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        <div>{report.osName} {report.osVersion}</div>
                        {report.deviceModel && <div className="text-[10px]">{report.deviceModel}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {report.clientIp || 'unknown'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusConfig[report.status]?.colorClass}`}>
                          {statusConfig[report.status]?.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            handleOpenDetail({
                              crashHash: report.crashHash,
                              softwareName: report.softwareName,
                              errorType: report.errorType,
                              errorMessage: report.errorMessage,
                              crashModule: report.crashModule,
                              status: report.status,
                              sampleStack: report.errorStack,
                              sampleDevice: report.deviceModel,
                              sampleGpu: report.gpuRenderer,
                              sampleOs: report.osName,
                              occurrences: 1,
                              affectedVersions: [report.appVersion],
                              affectedPlatforms: [report.osName],
                              firstSeenAt: report.createdAt,
                              lastSeenAt: report.createdAt,
                            })
                          }}
                          className="h-7 text-xs px-2"
                        >
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* 分页控制栏 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <div>共 {totalCount} 条记录，第 {page} / {totalPages} 页</div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-7 text-xs px-2.5 rounded-lg"
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 堆栈与上下文详情弹窗 */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl rounded-3xl max-h-[88vh] overflow-y-auto">
          {activeIssue && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs font-mono">
                    {activeIssue.softwareName}
                  </Badge>
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusConfig[activeIssue.status]?.colorClass}`}>
                    {statusConfig[activeIssue.status]?.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    累计崩溃 {activeIssue.occurrences} 次
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-red-600 dark:text-red-400 font-mono break-all">
                  {activeIssue.errorType}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono mt-1 break-all">
                  {activeIssue.errorMessage}
                </DialogDescription>
              </DialogHeader>

              {/* 关键硬件环境与统计参数 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">影响版本</span>
                  <span className="font-mono font-medium">{activeIssue.affectedVersions.join(', ') || '通用'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">平台操作系统</span>
                  <span className="font-medium">{activeIssue.affectedPlatforms.join(', ') || '全部'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">首次出现</span>
                  <span className="text-muted-foreground">{dayjs(activeIssue.firstSeenAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">最近发生</span>
                  <span className="text-muted-foreground">{dayjs(activeIssue.lastSeenAt).format('YYYY-MM-DD HH:mm')}</span>
                </div>
              </div>

              {/* 崩溃堆栈代码展示区 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>调用栈追踪 (Error Stack Trace)</span>
                  </div>
                  {activeIssue.sampleStack && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyStack(activeIssue.sampleStack!)}
                      className="h-6 text-[11px] px-2 rounded-md"
                    >
                      {copiedStack ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copiedStack ? '已复制' : '复制堆栈'}
                    </Button>
                  )}
                </div>

                <div className="relative rounded-2xl bg-[#090d16] text-[#e6edf3] p-4 font-mono text-xs overflow-x-auto max-h-[300px] border border-black/10 dark:border-white/10 selection:bg-blue-500/30">
                  <pre className="whitespace-pre leading-relaxed">
                    {activeIssue.sampleStack || '（客户端未提供详细堆栈，仅上报了错误标题与模块）'}
                  </pre>
                </div>
              </div>

              {/* 发生历史列表 */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-foreground flex items-center justify-between">
                  <span>最近崩溃实例明细 (最多展示前 50 条)</span>
                  {historyLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                </div>

                <div className="border border-black/[0.05] dark:border-white/[0.06] rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px] h-8 bg-black/[0.01] dark:bg-white/[0.02]">
                        <TableHead className="py-1">时间</TableHead>
                        <TableHead className="py-1">版本</TableHead>
                        <TableHead className="py-1">设备与GPU</TableHead>
                        <TableHead className="py-1">客户端IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeReportHistory.map((h) => (
                        <TableRow key={h.id} className="text-xs h-9">
                          <TableCell className="font-mono text-[11px] text-muted-foreground py-1.5">
                            {dayjs(h.createdAt).format('MM-DD HH:mm:ss')}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] py-1.5">v{h.appVersion}</TableCell>
                          <TableCell className="text-[11px] py-1.5 text-muted-foreground">
                            {h.deviceModel || h.gpuRenderer || '默认配置'}
                          </TableCell>
                          <TableCell className="font-mono text-[11px] py-1.5 text-muted-foreground">
                            {h.clientIp}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 弹窗底部操作 */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">更新此问题状态:</span>
                  <Button
                    size="sm"
                    variant={activeIssue.status === 'investigating' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(activeIssue.crashHash, 'investigating')}
                    className="h-7 text-xs rounded-lg"
                  >
                    排查中
                  </Button>
                  <Button
                    size="sm"
                    variant={activeIssue.status === 'resolved' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(activeIssue.crashHash, 'resolved')}
                    className="h-7 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    已修复
                  </Button>
                  <Button
                    size="sm"
                    variant={activeIssue.status === 'ignored' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(activeIssue.crashHash, 'ignored')}
                    className="h-7 text-xs rounded-lg"
                  >
                    忽略
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDetailModalOpen(false)}
                  className="h-7 text-xs"
                >
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

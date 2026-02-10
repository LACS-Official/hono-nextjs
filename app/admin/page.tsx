'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  AppWindow,
  Bell,
  Key,
  User,
  RefreshCw,
  Plus,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  Database,
  Activity,
  TrendingUp,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// 统计数据接口
interface DashboardStats {
  software: {
    total: number
    active: number
    inactive: number
    recentlyAdded: number
    categories: Array<{ category: string; count: number }>
  }
  activationCodes: {
    total: number
    used: number
    available: number
    expired: number
    recentlyGenerated: number
    recentlyUsed: number
    usageRate: number
  }
  userBehavior: {
    totalUsage: number
    recentUsage: number
    uniqueDevices: number
    popularSoftware: Array<{ softwareName: string; totalUsed: number }>
  }
  system: {
    status: 'healthy' | 'degraded' | 'error'
    checks: {
      database: boolean
      apiResponse: boolean
      timestamp: string
    }
    uptime: number
    memory: any
    version: string
  }
  lastUpdated: string
}

// 活动记录接口
interface ActivityItem {
  id: string
  type: 'software_created' | 'software_updated' | 'activation_code_generated' | 'activation_code_used' | 'software_activated'
  title: string
  description: string
  timestamp: string
  metadata?: any
}

interface ActivitiesData {
  activities: ActivityItem[]
  total: number
  timeRange: {
    start: string
    end: string
    days: number
  }
  lastUpdated: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<ActivitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取仪表板数据
  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 获取Supabase会话
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('用户未登录')
      }

      // 并行获取统计数据和活动记录
      const [statsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }),
        fetch('/api/admin/dashboard/activities?limit=10&days=7', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      ])

      if (!statsResponse.ok) {
        throw new Error(`统计数据获取失败: ${statsResponse.status}`)
      }

      if (!activitiesResponse.ok) {
        throw new Error(`活动记录获取失败: ${activitiesResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const activitiesData = await activitiesResponse.json()

      if (statsData.success) {
        setStats(statsData.data)
      } else {
        throw new Error(statsData.error || '统计数据获取失败')
      }

      if (activitiesData.success) {
        setActivities(activitiesData.data)
      } else {
        throw new Error(activitiesData.error || '活动记录获取失败')
      }

    } catch (error) {
      console.error('获取仪表板数据失败:', error)
      setError(error instanceof Error ? error.message : '数据获取失败')
      
      // 如果是认证错误，重定向到登录页面
      if (error instanceof Error && error.message.includes('未登录')) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 处理快速操作
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-software':
        router.push('/admin/software/new')
        break
      case 'create-activation-code':
        router.push('/admin/activation-codes/new')
        break
      case 'manage-software':
        router.push('/admin/software')
        break
      case 'manage-announcements':
        router.push('/admin/announcements')
        break
      case 'manage-activation-codes':
        router.push('/admin/activation-codes')
        break
      case 'manage-donors':
        router.push('/admin/donors')
        break
      default:
        break
    }
  }

  // 获取活动类型的图标和颜色
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'software_created':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'software_updated':
        return <AppWindow className="h-4 w-4 text-blue-500" />
      case 'activation_code_generated':
        return <Key className="h-4 w-4 text-purple-500" />
      case 'activation_code_used':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'software_activated':
        return <User className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return time.toLocaleDateString()
  }

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}天 ${hours}小时`
    if (hours > 0) return `${hours}小时 ${minutes}分钟`
    return `${minutes}分钟`
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="space-y-6 pt-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-4 h-[400px] rounded-xl" />
          <Skeleton className="col-span-3 h-[400px] rounded-xl" />
        </div>
      </div>
    )
  }

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
               <Button size="sm" variant="outline" onClick={fetchDashboardData}>重试</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API管理仪表板</h2>
          <p className="text-muted-foreground mt-1">
            实时监控您的API系统状态和使用情况
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 主要统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">软件总数</CardTitle>
            <AppWindow className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.software.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
               活跃: {stats?.software.active || 0} | 停用: {stats?.software.inactive || 0}
            </p>
            {stats?.software.recentlyAdded ? (
                <div className="mt-4">
                   <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100/80">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      最近7天新增 {stats.software.recentlyAdded}
                   </Badge>
                </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">激活码总数</CardTitle>
            <Key className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activationCodes.total || 0}</div>
             <p className="text-xs text-muted-foreground mt-1">
                可用: {stats?.activationCodes.available || 0} | 已用: {stats?.activationCodes.used || 0}
             </p>
            {stats?.activationCodes.usageRate !== undefined && (
              <div className="mt-4 space-y-2">
                <Progress 
                    value={stats.activationCodes.usageRate} 
                    className="h-2" 
                    indicatorColor={stats.activationCodes.usageRate > 80 ? "bg-orange-500" : "bg-primary"}
                />
                <p className="text-xs text-muted-foreground text-right">
                  使用率 {stats.activationCodes.usageRate}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总使用次数</CardTitle>
            <User className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userBehavior.totalUsage || 0}</div>
             <p className="text-xs text-muted-foreground mt-1">
                 设备: {stats?.userBehavior.uniqueDevices || 0} | 最近7天: {stats?.userBehavior.recentUsage || 0}
             </p>
            {stats?.userBehavior.recentUsage ? (
              <div className="mt-4">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100/80">
                      <Trophy className="mr-1 h-3 w-3" />
                      近期活跃
                   </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <div className="space-y-1">
                <CardTitle className="text-sm font-medium">系统状态</CardTitle>
                <div className="flex items-center gap-2">
                    <span className={`relative flex h-2 w-2`}>
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          stats?.system.status === 'healthy' ? 'bg-green-400' : stats?.system.status === 'degraded' ? 'bg-orange-400' : 'bg-red-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          stats?.system.status === 'healthy' ? 'bg-green-500' : stats?.system.status === 'degraded' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></span>
                    </span>
                    <span className={`text-xs font-semibold ${
                        stats?.system.status === 'healthy' ? 'text-green-500' : stats?.system.status === 'degraded' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                        {stats?.system.status === 'healthy' ? '健康' : stats?.system.status === 'degraded' ? '降级' : '异常'}
                    </span>
                </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col gap-1 mb-4">
                  <div className="text-xs text-muted-foreground">运行时间</div>
                  <div className="text-sm font-bold">
                     {stats?.system.uptime ? formatUptime(stats.system.uptime) : '未知'}
                  </div>
             </div>
             
             <Separator className="my-2"/>
             
            <div className="flex justify-between text-xs mt-2">
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3 text-muted-foreground" />
                数据库: {stats?.system.checks.database ? <span className="text-green-500">正常</span> : <span className="text-red-500">异常</span>}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                API: {stats?.system.checks.apiResponse ? <span className="text-green-500">正常</span> : <span className="text-red-500">异常</span>}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 快速操作 & 热门软件 */}
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    快速操作
                </CardTitle>
                <Button variant="link" className="text-xs h-auto p-0" onClick={() => router.push('/admin/software')}>
                    查看全部
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button className="w-full justify-start" onClick={() => handleQuickAction('create-software')}>
                    <AppWindow className="mr-2 h-4 w-4" />
                    新增软件
                </Button>
                 <Button variant="secondary" className="w-full justify-start" onClick={() => handleQuickAction('create-activation-code')}>
                    <Key className="mr-2 h-4 w-4" />
                    生成激活码
                </Button>
                 <Button variant="outline" className="w-full justify-start" onClick={() => handleQuickAction('manage-software')}>
                    <AppWindow className="mr-2 h-4 w-4" />
                    管理软件
                </Button>
                 <Button variant="outline" className="w-full justify-start" onClick={() => handleQuickAction('manage-announcements')}>
                    <Bell className="mr-2 h-4 w-4" />
                    管理公告
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => handleQuickAction('manage-donors')}>
                    <Heart className="mr-2 h-4 w-4" />
                    捐赠人员管理
                </Button>
             </div>

             {/* 热门软件 */}
             {stats?.userBehavior.popularSoftware && stats.userBehavior.popularSoftware.length > 0 && (
                 <>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="flex items-center font-semibold text-sm">
                            <Trophy className="mr-2 h-4 w-4 text-orange-500" />
                            热门软件
                        </h4>
                        <div className="space-y-2">
                            {stats.userBehavior.popularSoftware.slice(0, 3).map((item, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                                    <div className="flex items-center gap-3">
                                        <Badge variant={index === 0 ? "default" : "secondary"} className={`
                                            h-5 w-5 flex items-center justify-center rounded-full p-0
                                            ${index === 0 ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                        `}>
                                            {index + 1}
                                        </Badge>
                                        <span className="text-sm font-medium">{item.softwareName}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{item.totalUsed} 次使用</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 </>
             )}
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card className="col-span-3">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        最近活动
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">最近7天</span>
                </div>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[300px] w-full pr-4">
                    {activities && activities.activities.length > 0 ? (
                        <div className="space-y-4">
                            {activities.activities.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                     <div className="mt-1 bg-muted p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                                         {getActivityIcon(item.type)}
                                     </div>
                                     <div className="space-y-1 overflow-hidden">
                                         <div className="flex items-center justify-between gap-2">
                                             <p className="text-sm font-medium leading-none truncate">{item.title}</p>
                                             <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                 {formatTime(item.timestamp)}
                                             </span>
                                         </div>
                                         <p className="text-xs text-muted-foreground line-clamp-2">
                                             {item.description}
                                         </p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                            <Clock className="h-8 w-8 mb-2 opacity-50" />
                            <p>暂无最近活动</p>
                        </div>
                    )}
                 </ScrollArea>
            </CardContent>
        </Card>
      </div>

      <div className="text-center">
            <p className="text-xs text-muted-foreground">
                 数据更新时间: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : '未知'}
            </p>
      </div>
    </div>
  )
}
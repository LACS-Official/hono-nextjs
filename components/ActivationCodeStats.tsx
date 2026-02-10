'use client'

import { useState, useEffect } from 'react'
import {
  Key,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import {
  activationCodeApi,
  type ActivationCodeStats as StatsType,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ActivationCodeStatsProps {
  onRefresh?: () => void
  refreshTrigger?: number
}

export default function ActivationCodeStats({ onRefresh, refreshTrigger }: ActivationCodeStatsProps) {
  const [stats, setStats] = useState<StatsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const statsData = await activationCodeApi.getActivationCodeStats()
      setStats(statsData)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { if (refreshTrigger) loadStats() }, [refreshTrigger])

  const handleRefresh = () => {
    loadStats()
    onRefresh?.()
  }

  if (loading) {
    return (
      <Card className="border-none shadow-sm bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-500 font-medium">正在加载统计信息...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error || '加载统计信息失败'}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>重试</Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/30 border-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">总激活码</CardTitle>
            <Key className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50/30 border-green-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-700">已使用</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.used}</div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/30 border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-indigo-700">有效未使用</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50/30 border-red-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">已过期</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计详情 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">使用情况分析</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 text-slate-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">使用率</span>
                <span className="text-blue-600">{stats.usageRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats.usageRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">过期率</span>
                <span className={stats.expirationRate > 20 ? 'text-red-600' : 'text-slate-600'}>
                  {stats.expirationRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.expirationRate} className="h-2 bg-slate-100" indicatorClassName={stats.expirationRate > 20 ? 'bg-red-500' : 'bg-orange-400'} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">有效率</span>
                <span className="text-green-600">{((stats.active / stats.total) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(stats.active / stats.total) * 100} className="h-2" indicatorClassName="bg-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">系统健康提示</CardTitle>
            <CardDescription>基于当前激活码状态的建议</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 space-y-2">
               {stats.expirationRate < 10 && stats.usageRate > 30 ? (
                 <div className="flex items-center gap-2 text-green-700 font-medium">
                   <CheckCircle2 className="h-4 w-4" /> 状态良好: 使用率正常，过期率低
                 </div>
               ) : stats.expirationRate >= 10 ? (
                 <div className="flex items-center gap-2 text-amber-700 font-medium">
                   <AlertTriangle className="h-4 w-4" /> 建议: 过期率偏高，请清理失效激活码
                 </div>
               ) : (
                 <div className="flex items-center gap-2 text-blue-700 font-medium">
                   <TrendingUp className="h-4 w-4" /> 提示: 系统运行平稳
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              <div className="flex flex-col p-3 border border-slate-100 rounded-lg">
                <span className="text-slate-500">有效未使用</span>
                <span className="text-lg font-bold text-indigo-600">{stats.active}</span>
              </div>
              <div className="flex flex-col p-3 border border-slate-100 rounded-lg">
                <span className="text-slate-500">总未使用</span>
                <span className="text-lg font-bold text-slate-700">{stats.unused}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

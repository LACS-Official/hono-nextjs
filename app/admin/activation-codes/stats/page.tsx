'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Key,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

import { Button } from "@/components/ui/button"
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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'

import {
  activationCodeApi,
  type ActivationCodeStats,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

export default function ActivationCodeStatsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<ActivationCodeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载统计信息
  const loadStats = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await activationCodeApi.getActivationCodeStats()
      setStats(data)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      console.error('加载统计信息失败:', apiError.message)
      toast({
        variant: "destructive",
        title: "加载失败",
        description: apiError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  // 计算百分比
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <ErrorBoundaryWrapper>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>网络错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadStats}>重试</Button>
        </div>
      </ErrorBoundaryWrapper>
    )
  }

  return (
    <ErrorBoundaryWrapper>
      <div className="space-y-6 pb-24">
        {/* 面包屑导航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/activation-codes">激活码管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>统计</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              激活码统计
            </h2>
            <p className="text-muted-foreground">
              查看激活码的使用情况和统计信息
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>

        {stats && (
          <>
            {/* 总体统计 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总激活码数</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已使用</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.used}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">未使用</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.unused}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已过期</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">有效激活码</CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </CardContent>
              </Card>
            </div>

            {/* 使用率分析 */}
            <Card>
              <CardHeader>
                <CardTitle>使用率分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">激活码使用率</span>
                    <span className="text-muted-foreground">
                      {getPercentage(stats.used, stats.total)}% ({stats.used}/{stats.total})
                    </span>
                  </div>
                  <Progress value={getPercentage(stats.used, stats.total)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">激活码过期率</span>
                    <span className="text-muted-foreground">
                      {getPercentage(stats.expired, stats.total)}% ({stats.expired}/{stats.total})
                    </span>
                  </div>
                  <Progress 
                    value={getPercentage(stats.expired, stats.total)} 
                    className="h-2"
                  />
                </div>

                {/* 统计说明 */}
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertTitle>统计说明</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>总激活码数</strong>：系统中所有激活码的总数量</li>
                      <li><strong>已使用</strong>：已经被激活使用的激活码数量</li>
                      <li><strong>未使用</strong>：尚未被使用且仍在有效期内的激活码数量</li>
                      <li><strong>已过期</strong>：超过有效期的激活码数量</li>
                      <li><strong>有效激活码</strong>：未使用且未过期的激活码数量</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* 健康度评估 */}
            <Card>
              <CardHeader>
                <CardTitle>健康度评估</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stats.total === 0 ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>暂无数据</AlertTitle>
                    <AlertDescription>
                      系统中还没有激活码,建议创建一些激活码来开始使用。
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {getPercentage(stats.expired, stats.total) > 50 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>过期率过高</AlertTitle>
                        <AlertDescription>
                          当前过期率为 {getPercentage(stats.expired, stats.total)}%,建议清理过期激活码或调整有效期策略。
                        </AlertDescription>
                      </Alert>
                    )}

                    {getPercentage(stats.used, stats.total) > 80 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">使用率良好</AlertTitle>
                        <AlertDescription className="text-green-700">
                          当前使用率为 {getPercentage(stats.used, stats.total)}%,激活码使用情况良好。
                        </AlertDescription>
                      </Alert>
                    )}

                    {stats.active === 0 && stats.total > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>无可用激活码</AlertTitle>
                        <AlertDescription>
                          当前没有有效的激活码,建议创建新的激活码。
                        </AlertDescription>
                      </Alert>
                    )}

                    {stats.active > 0 && getPercentage(stats.expired, stats.total) <= 30 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">系统状态良好</AlertTitle>
                        <AlertDescription className="text-green-700">
                          当前有 {stats.active} 个有效激活码,过期率控制在合理范围内。
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => router.push('/admin/activation-codes/new')}>
                    <Key className="mr-2 h-4 w-4" />
                    创建激活码
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/admin/activation-codes')}>
                    查看激活码列表
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ErrorBoundaryWrapper>
  )
}

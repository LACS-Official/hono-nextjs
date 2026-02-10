'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Eye,
  TrendingUp,
  AppWindow,
  Download,
  RefreshCw,
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
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface ViewCountStats {
  statistics: Array<{
    id: number
    name: string
    nameEn?: string
    category?: string
    viewCount: number
    createdAt: string
    updatedAt: string
  }>
  summary: {
    totalSoftware: number
    totalViews: number
    averageViews: number
    maxViews: number
    minViews: number
  }
  metadata: {
    queryParams: any
    generatedAt: string
  }
}

export default function SoftwareAnalytics() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [statsData, setStatsData] = useState<ViewCountStats | null>(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minViewCount: '',
    maxViewCount: ''
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:29351'

  // 获取统计数据
  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        format: 'json',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount }),
        ...(filters.maxViewCount && { maxViewCount: filters.maxViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/admin/software/view-count?${params}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })
      const data = await response.json()

      if (data.success) {
        setStatsData(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "无法加载统计数据",
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 导出CSV
  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount }),
        ...(filters.maxViewCount && { maxViewCount: filters.maxViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/admin/software/view-count?${params}`, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `software-view-stats-${dayjs().format('YYYY-MM-DD')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast({
          title: "导出成功",
          description: "统计数据已导出为 CSV 文件",
        })
      } else {
        toast({
          variant: "destructive",
          title: "导出失败",
          description: "无法导出统计数据",
        })
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
      toast({
        variant: "destructive",
        title: "导出失败",
        description: "网络错误或服务器无响应",
      })
    }
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      minViewCount: '',
      maxViewCount: ''
    })
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 计算访问量分布
  const getViewCountDistribution = () => {
    if (!statsData) return []

    const ranges = [
      { label: '0-10', min: 0, max: 10, count: 0 },
      { label: '11-50', min: 11, max: 50, count: 0 },
      { label: '51-100', min: 51, max: 100, count: 0 },
      { label: '101-500', min: 101, max: 500, count: 0 },
      { label: '501-1000', min: 501, max: 1000, count: 0 },
      { label: '1000+', min: 1001, max: Infinity, count: 0 }
    ]

    statsData.statistics.forEach(item => {
      const range = ranges.find(r => item.viewCount >= r.min && item.viewCount <= r.max)
      if (range) range.count++
    })

    return ranges
  }

  const distribution = getViewCountDistribution()

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
            <BreadcrumbPage>访问量分析</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          软件访问量分析
        </h2>
        <p className="text-muted-foreground">
          详细的访问量统计分析和数据导出功能
        </p>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">最小访问量</label>
              <Input
                type="number"
                placeholder="最小值"
                value={filters.minViewCount}
                onChange={(e) => setFilters({ ...filters, minViewCount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">最大访问量</label>
              <Input
                type="number"
                placeholder="最大值"
                value={filters.maxViewCount}
                onChange={(e) => setFilters({ ...filters, maxViewCount: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" onClick={handleResetFilters}>
              重置
            </Button>
            <Button onClick={fetchStats}>
              应用筛选
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              导出CSV
            </Button>
            <Button variant="outline" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">软件总数</CardTitle>
              <AppWindow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {statsData.summary.totalSoftware}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总访问量</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsData.summary.totalViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均访问量</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(statsData.summary.averageViews)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最高访问量</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statsData.summary.maxViews.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 访问量分布和排行 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 访问量分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              访问量分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.map(range => (
              <div key={range.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{range.label} 次</span>
                  <span className="font-medium">{range.count} 个软件</span>
                </div>
                <Progress 
                  value={statsData ? (range.count / statsData.summary.totalSoftware) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 访问量排行 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              访问量排行 TOP 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">排名</TableHead>
                  <TableHead>软件名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>访问量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsData?.statistics.slice(0, 10).map((item, index) => {
                  const maxViews = statsData.summary.maxViews || 1
                  const percentage = (item.viewCount / maxViews) * 100
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"} className={index < 3 ? "bg-yellow-500" : ""}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.nameEn && (
                            <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">未分类</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-base">
                            {item.viewCount.toLocaleString()}
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 完整数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>完整统计数据</CardTitle>
          <CardDescription>
            所有软件的访问量统计信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">排名</TableHead>
                <TableHead>软件名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>访问量</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : statsData?.statistics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                statsData?.statistics.map((item, index) => {
                  const maxViews = statsData.summary.maxViews || 1
                  const percentage = (item.viewCount / maxViews) * 100
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? "default" : "secondary"} className={index < 3 ? "bg-yellow-500" : ""}>
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.nameEn && (
                            <div className="text-xs text-muted-foreground">{item.nameEn}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.category ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {item.category}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">未分类</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[120px]">
                          <div className="font-bold text-base">
                            {item.viewCount.toLocaleString()}
                          </div>
                          <Progress value={percentage} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dayjs(item.updatedAt).format('YYYY-MM-DD HH:mm')}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
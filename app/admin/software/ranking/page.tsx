'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Eye,
  TrendingUp,
  AppWindow,
  Search,
  RefreshCw,
  Crown,
  Medal,
  Flame
} from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface RankedSoftware {
  id: number
  name: string
  nameEn?: string
  description?: string
  currentVersion: string
  category?: string
  tags?: string[]
  viewCount: number
  rank: number
  officialWebsite?: string
  createdAt: string
  updatedAt: string
}

interface RankingData {
  data: RankedSoftware[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: {
    totalSoftware: number
    totalViews: number
    averageViews: number
  }
}

export default function SoftwareRanking() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    minViewCount: ''
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20
  })

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // 获取排行榜数据
  const fetchRanking = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.search && { search: filters.search }),
        ...(filters.minViewCount && { minViewCount: filters.minViewCount })
      })

      const response = await fetch(`${API_BASE_URL}/software/ranking?${params}`)
      const data = await response.json()

      if (data.success) {
        setRankingData(data)
        setPagination({
          current: data.pagination.page,
          pageSize: data.pagination.limit
        })
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: "无法加载排行榜数据",
        })
      }
    } catch (error) {
      console.error('Error fetching ranking:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />
    return <span className="font-bold text-muted-foreground">#{rank}</span>
  }

  // 获取访问量颜色
  const getViewCountColor = (viewCount: number, maxViews: number) => {
    const ratio = viewCount / maxViews
    if (ratio > 0.8) return 'bg-red-500'
    if (ratio > 0.6) return 'bg-orange-500'
    if (ratio > 0.4) return 'bg-yellow-500'
    if (ratio > 0.2) return 'bg-green-500'
    return 'bg-blue-500'
  }

  // 搜索处理
  const handleSearch = () => {
    fetchRanking(1, pagination.pageSize)
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchRanking(pagination.current, pagination.pageSize)
  }

  useEffect(() => {
    fetchRanking()
  }, [])

  const maxViews = rankingData?.data[0]?.viewCount || 1

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
            <BreadcrumbPage>访问量排行榜</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          软件访问量排行榜
        </h2>
        <p className="text-muted-foreground">
          根据软件详情页面的访问次数进行排名,实时更新
        </p>
      </div>

      {/* 统计卡片 */}
      {rankingData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">软件总数</CardTitle>
              <AppWindow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {rankingData.summary.totalSoftware}
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
                {rankingData.summary.totalViews.toLocaleString()}
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
                {Math.round(rankingData.summary.averageViews)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">搜索软件</label>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索软件名称"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button variant="outline" size="icon" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Select
                value={filters.category}
                onValueChange={(value) => {
                  setFilters({ ...filters, category: value })
                  fetchRanking(1, pagination.pageSize)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部分类</SelectItem>
                  <SelectItem value="开发工具">开发工具</SelectItem>
                  <SelectItem value="浏览器">浏览器</SelectItem>
                  <SelectItem value="图像处理">图像处理</SelectItem>
                  <SelectItem value="社交通讯">社交通讯</SelectItem>
                  <SelectItem value="办公软件">办公软件</SelectItem>
                  <SelectItem value="系统工具">系统工具</SelectItem>
                  <SelectItem value="多媒体">多媒体</SelectItem>
                  <SelectItem value="游戏">游戏</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">最小访问量</label>
              <Input
                type="number"
                placeholder="最小访问量"
                value={filters.minViewCount}
                onChange={(e) => {
                  setFilters({ ...filters, minViewCount: e.target.value })
                  fetchRanking(1, pagination.pageSize)
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">操作</label>
              <Button variant="outline" onClick={handleRefresh} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 排行榜表格 */}
      <Card>
        <CardHeader>
          <CardTitle>排行榜</CardTitle>
          <CardDescription>
            {rankingData && `共 ${rankingData.pagination.total} 个软件`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">排名</TableHead>
                <TableHead>软件信息</TableHead>
                <TableHead className="text-center">访问量</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : rankingData?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                rankingData?.data.map((record) => {
                  const percentage = (record.viewCount / maxViews) * 100
                  const colorClass = getViewCountColor(record.viewCount, maxViews)
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {getRankIcon(record.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-12 w-12 ${colorClass} text-white`}>
                            <AvatarFallback className={`${colorClass} text-white`}>
                              {record.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-base">{record.name}</div>
                            {record.nameEn && (
                              <div className="text-xs text-muted-foreground">{record.nameEn}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              版本: {record.currentVersion}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2 min-w-[150px]">
                          <div className={`text-xl font-bold text-center ${
                            record.rank === 1 ? 'text-red-600' :
                            record.rank === 2 ? 'text-orange-600' :
                            record.rank === 3 ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {record.viewCount.toLocaleString()}
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <div className="text-xs text-center text-muted-foreground">
                            占比 {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.category ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                            {record.category}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">未分类</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.tags && record.tags.length > 0 ? (
                            <>
                              {record.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {record.tags.length > 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="text-xs cursor-help">
                                        +{record.tags.length - 3}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{record.tags.slice(3).join(', ')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">无标签</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.updatedAt).toLocaleDateString('zh-CN')}
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

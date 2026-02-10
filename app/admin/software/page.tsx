'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Search,
  Filter,
  Grid,
  List as ListIcon,
  Download,
  Home,
  Layers,
  BarChart2,
  MoreHorizontal
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useToast } from "@/hooks/use-toast"
import ResponsiveSoftwareGrid from '@/components/ResponsiveSoftwareGrid'
import { SoftwareManagementSkeleton } from '@/components/SkeletonScreen'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'
import type { Software } from '@/utils/software-api'

interface SoftwareStats {
  total: number
  active: number
  inactive: number
  totalViews: number
  averageViews: number
  categories: { [key: string]: number }
}

interface PaginationState {
  current: number
  pageSize: number
  total: number
}

interface Filters {
  search: string
  category: string
  isActive: string
}

export default function SoftwareManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [software, setSoftware] = useState<Software[]>([])
  const [stats, setStats] = useState<SoftwareStats | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    isActive: ''
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [softwareToDelete, setSoftwareToDelete] = useState<number | null>(null)

  // 根据屏幕尺寸自动切换视图模式
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'table') {
        setViewMode('card')
      }
      // 不自动切换回表格，让用户自己决定
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [viewMode])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // 获取软件统计信息
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/software?limit=1000`)
      const data = await response.json()

      if (data.success && data.data.software) {
        const allSoftware = data.data.software
        const totalViews = allSoftware.reduce((sum: number, s: Software) => sum + (s.viewCount || 0), 0)
        const stats: SoftwareStats = {
          total: allSoftware.length,
          active: allSoftware.filter((s: Software) => s.isActive).length,
          inactive: allSoftware.filter((s: Software) => !s.isActive).length,
          totalViews,
          averageViews: allSoftware.length > 0 ? Math.round(totalViews / allSoftware.length) : 0,
          categories: {}
        }

        allSoftware.forEach((s: Software) => {
          if (s.category) {
            stats.categories[s.category] = (stats.categories[s.category] || 0) + 1
          }
        })

        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // 获取软件列表
  const fetchSoftware = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.isActive && { isActive: filters.isActive })
      })

      const response = await fetch(`${API_BASE_URL}/software?${params}`)
      const data = await response.json()

      if (data.success) {
        setSoftware(data.data.software)
        setPagination({
          current: data.data.pagination.page,
          pageSize: data.data.pagination.limit,
          total: data.data.pagination.total
        })
      } else {
        toast({ title: '获取软件列表失败', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error fetching software:', error)
      toast({ title: '获取软件列表失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // 删除软件
  const handleDelete = async () => {
    if (!softwareToDelete) return
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
        }
      })

      const data = await response.json()

      if (data.success) {
        toast({ title: '删除成功' })
        fetchSoftware(pagination.current, pagination.pageSize)
        fetchStats()
      } else {
        toast({ title: data.error || '删除失败', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error deleting software:', error)
      toast({ title: '删除失败', description: '请稍后重试', variant: 'destructive' })
    } finally {
        setDeleteDialogOpen(false)
        setSoftwareToDelete(null)
    }
  }

  const confirmDelete = (id: number) => {
      setSoftwareToDelete(id)
      setDeleteDialogOpen(true)
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      toast({ title: '请选择要删除的软件', variant: 'destructive' })
      return
    }

    try {
      const promises = selectedRowKeys.map(id =>
        fetch(`${API_BASE_URL}/software/id/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
          }
        })
      )

      await Promise.all(promises)
      toast({ title: `成功删除 ${selectedRowKeys.length} 个软件` })
      setSelectedRowKeys([])
      fetchSoftware(pagination.current, pagination.pageSize)
      fetchStats()
    } catch (error) {
      console.error('Error batch deleting:', error)
      toast({ title: '批量删除失败', variant: 'destructive' })
    } finally {
        setBatchDeleteDialogOpen(false)
    }
  }

  // 搜索处理
  const handleSearch = () => {
      // 实际上 Input 的 onChange 已经更新了 filters.search，
      // 这里只需要触发 fetchSoftware
      // 但是为了避免频繁请求，通常配合 useEffect 或者 debounce，这里简单处理
      fetchSoftware(1, pagination.pageSize)
  }

  // 筛选处理
  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value }
    setFilters(newFilters)
    // 需要在这里立即触发fetch，因为setState是异步的，或者用useEffect监听filters变化
    // 为了简单，我们手动传递新的filters给fetchSoftware，但 fetchSoftware 目前读取的是 state
    // 所以由于闭包问题，这里最简单的办法是利用 useEffect 监听 filters 变化自动请求，或者重构 fetchSoftware 接收 filters 参数
    // 这里采用: 更新 state -> 在 useEffect 中触发 (下面添加 useEffect)
  }

  // 监听 filters 变化自动刷新 (可选，如果不想输入一个字就刷新，可以只监听 category 和 isActive)
  useEffect(() => {
      fetchSoftware(1, pagination.pageSize)
  }, [filters.category, filters.isActive])


  // 刷新数据
  const handleRefresh = () => {
    fetchSoftware(pagination.current, pagination.pageSize)
    fetchStats()
  }

  // 导出数据
  const handleExport = () => {
    toast({ title: '导出功能开发中...', description: "敬请期待" })
  }

  const handleSoftwareAction = {
    view: (software: Software) => router.push(`/admin/software/${software.id}`),
    edit: (software: Software) => router.push(`/admin/software/${software.id}/edit`),
    delete: (id: number) => confirmDelete(id),
    viewStats: (software: Software) => router.push(`/admin/software/${software.id}/analytics`)
  }

  useEffect(() => {
    fetchSoftware()
    fetchStats()
  }, [])

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <ErrorBoundaryWrapper
      onError={(error, errorInfo) => {
        console.error('Software page error:', error, errorInfo)
      }}
    >
      <div className="space-y-6">
          {/* 面包屑导航 */}
          <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>软件管理</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* 页面标题 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">软件管理</h2>
              <p className="text-muted-foreground mt-1">
                管理系统中的所有软件信息，包括版本控制和下载链接管理
              </p>
            </div>
            <div className="flex items-center gap-2">
                 <Link href="/admin/software/new">
                     <Button>
                         <Plus className="mr-2 h-4 w-4" />
                         新增软件
                     </Button>
                 </Link>
            </div>
          </div>

          {/* 统计卡片 */}
          {loading && !stats ? (
            <SoftwareManagementSkeleton viewMode={viewMode} />
          ) : stats && ( // 只要有stats就显示，loading时可以用骨架屏覆盖下面的列表，或者局部loading
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">软件总数</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">启用软件</CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-500/20" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总访问量</CardTitle>
                    <Eye className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.totalViews}</div>
                  </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">平均访问量</CardTitle>
                        <BarChart2 className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.averageViews}</div>
                    </CardContent>
                </Card>
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
              <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                  <div className="relative w-full sm:w-[250px]">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="搜索软件名称或描述"
                          className="pl-8"
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                  </div>
                  <Select
                      value={filters.category}
                      onValueChange={(value) => handleFilterChange('category', value)}
                  >
                      <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">全部分类</SelectItem>
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
                  <Select
                      value={filters.isActive}
                      onValueChange={(value) => handleFilterChange('isActive', value)}
                  >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">全部状态</SelectItem>
                          <SelectItem value="true">启用</SelectItem>
                          <SelectItem value="false">禁用</SelectItem>
                      </SelectContent>
                  </Select>
                   <Button variant="ghost" size="icon" onClick={() => fetchSoftware(1, pagination.pageSize)}>
                        <Search className="h-4 w-4" />
                   </Button>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-end">
                   <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'table' | 'card')}>
                        <ToggleGroupItem value="card" aria-label="Card View">
                            <Grid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="table" aria-label="Table View">
                            <ListIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                   </ToggleGroup>
                   
                   {selectedRowKeys.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={() => setBatchDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            批量删除 ({selectedRowKeys.length})
                        </Button>
                   )}

                   <Button variant="outline" size="icon" onClick={handleRefresh}>
                       <RefreshCw className={loading ? "animate-spin" : ""} />
                   </Button>
                   <Button variant="outline" size="icon" onClick={handleExport}>
                       <Download className="h-4 w-4" />
                   </Button>
              </div>
          </div>

          <div className="bg-card rounded-lg border">
            {viewMode === 'table' ? (
                // 表格视图
                <div className="p-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>软件名称</TableHead>
                                <TableHead>描述</TableHead>
                                <TableHead>分类</TableHead>
                                <TableHead>详情</TableHead>
                                <TableHead className="text-center">访问量</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8} className="h-12 text-center">
                                            <div className="h-4 bg-muted animate-pulse rounded" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : software.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        暂无数据
                                    </TableCell>
                                </TableRow>
                            ) : (
                                software.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Badge variant="outline">#{item.id}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            {item.nameEn && <div className="text-xs text-muted-foreground">{item.nameEn}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-[200px] truncate text-muted-foreground" title={item.description}>
                                                {item.description || "暂无描述"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{item.category || "未分类"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs">
                                                    <span className="font-semibold">当前:</span> {item.currentVersion}
                                                </div>
                                                {item.filetype && (
                                                     <div className="text-xs text-muted-foreground">
                                                        类型: {item.filetype}
                                                     </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-bold text-orange-500">{item.viewCount}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.isActive ? "default" : "destructive"} className={item.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                                                {item.isActive ? '启用' : '禁用'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleSoftwareAction.view(item)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        查看详情
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSoftwareAction.edit(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        编辑
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSoftwareAction.viewStats(item)}>
                                                        <BarChart2 className="mr-2 h-4 w-4" />
                                                        统计数据
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSoftwareAction.delete(item.id)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        删除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                // 卡片视图
                <div className="p-4">
                     <ResponsiveSoftwareGrid
                        software={software}
                        loading={loading}
                        onEdit={handleSoftwareAction.edit}
                        onDelete={handleSoftwareAction.delete}
                        onView={handleSoftwareAction.view}
                        onViewStats={handleSoftwareAction.viewStats}
                     />
                </div>
            )}
          </div>

           {/* 分页 */}
           <div className="flex justify-center">
              <Pagination>
                  <PaginationContent>
                      <PaginationItem>
                          <PaginationPrevious
                              onClick={() => pagination.current > 1 && fetchSoftware(pagination.current - 1, pagination.pageSize)}
                              className={pagination.current <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                      </PaginationItem>
                      
                       {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5 && pagination.current > 3) {
                              pageNum = pagination.current - 2 + i;
                          }
                          if (pageNum > totalPages) return null;
                          
                          return (
                              <PaginationItem key={pageNum}>
                                  <PaginationLink
                                      isActive={pagination.current === pageNum}
                                      onClick={() => fetchSoftware(pageNum, pagination.pageSize)}
                                      className="cursor-pointer"
                                  >
                                      {pageNum}
                                  </PaginationLink>
                              </PaginationItem>
                          )
                      })}

                      {totalPages > 5 && (
                          <PaginationItem>
                              <PaginationEllipsis />
                          </PaginationItem>
                      )}

                      <PaginationItem>
                          <PaginationNext
                              onClick={() => pagination.current < totalPages && fetchSoftware(pagination.current + 1, pagination.pageSize)}
                              className={pagination.current >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                      </PaginationItem>
                  </PaginationContent>
              </Pagination>
          </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该软件及其所有版本历史。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除?</AlertDialogTitle>
            <AlertDialogDescription>
              您正在尝试删除 {selectedRowKeys.length} 个软件。此操作将永久删除这些软件及其所有版本历史。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              批量删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorBoundaryWrapper>
  )
}
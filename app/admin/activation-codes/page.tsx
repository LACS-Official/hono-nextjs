'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock,
  Key as KeyIcon,
  BarChart,
  XCircle,
  RotateCcw
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  activationCodeApi,
  type ActivationCode,
  type ActivationCodeStats,
  type ActivationCodeStatus,
  getActivationCodeStatusText,
  formatDate,
  getDaysUntilExpiration,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

export default function ActivationCodesPage() {
  const router = useRouter()
  const { toast } = useToast()

  // 状态管理
  const [codes, setCodes] = useState<ActivationCode[]>([])
  const [stats, setStats] = useState<ActivationCodeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false)
  const [codeToDelete, setCodeToDelete] = useState<ActivationCode | null>(null)

  // 加载激活码列表
  const loadActivationCodes = async (page = currentPage, limit = pageSize, status = statusFilter) => {
    setLoading(true)
    setError(null)

    try {
      const apiStatus = status === 'all' ? 'all' : status as ActivationCodeStatus
      const response = await activationCodeApi.getActivationCodes(page, limit, apiStatus)
      setCodes(response.codes)
      setTotal(response.pagination.total)
      setCurrentPage(response.pagination.page)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      toast({
        variant: "destructive",
        title: "加载失败",
        description: apiError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // 加载统计信息
  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const statsData = await activationCodeApi.getActivationCodeStats()
      setStats(statsData)
    } catch (error) {
      console.error('加载统计信息失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    loadActivationCodes()
    loadStats()
  }, [])

  // 状态筛选变化
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
    loadActivationCodes(1, pageSize, value)
  }

  // 搜索功能
  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault()
      // 前端过滤演示，实际应调用API
  }

  // 过滤激活码 (前端过滤)
  const filteredCodes = codes.filter(code => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      code.code.toLowerCase().includes(term) ||
      code.productInfo?.name?.toLowerCase().includes(term) ||
      code.metadata?.customerEmail?.toLowerCase().includes(term)
    )
  })

  // 查看详情
  const handleViewDetail = (code: ActivationCode) => {
    router.push(`/admin/activation-codes/${code.id}`)
  }

  // 确认删除
  const confirmDelete = (code: ActivationCode) => {
    setCodeToDelete(code)
    setDeleteDialogOpen(true)
  }

  // 执行删除
  const handleDelete = async () => {
    if (!codeToDelete) return

    try {
      await activationCodeApi.deleteActivationCode(codeToDelete.id)
      toast({
        title: "删除成功",
        description: "激活码已成功删除",
      })
      loadActivationCodes()
      loadStats()
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      toast({
        variant: "destructive",
        title: "删除失败",
        description: apiError.message,
      })
    } finally {
      setDeleteDialogOpen(false)
      setCodeToDelete(null)
    }
  }

  // 执行清理
  const handleCleanupExpired = async () => {
    try {
      const result = await activationCodeApi.cleanupExpiredCodes()
      toast({
        title: "清理完成",
        description: result.message,
      })
      loadActivationCodes()
      loadStats()
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      toast({
        variant: "destructive",
        title: "清理失败",
        description: apiError.message,
      })
    } finally {
      setCleanupDialogOpen(false)
    }
  }

  // 获取状态 Badge 样式
  const getStatusBadgeVariant = (record: ActivationCode) => {
      const days = getDaysUntilExpiration(record.expiresAt)
      if (record.isUsed) return "default" // 已使用
      if (days <= 0) return "destructive" // 已过期
      return "secondary" // 正常
  }

  const getStatusBadgeClass = (record: ActivationCode) => {
      const days = getDaysUntilExpiration(record.expiresAt)
      if (record.isUsed) return "bg-green-100 text-green-800 hover:bg-green-100/80"
      if (days <= 0) return "bg-red-100 text-red-800 hover:bg-red-100/80" 
      return "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">激活码管理</h2>
          <p className="text-muted-foreground mt-1">
            管理系统激活码，包括生成、查看、删除和统计功能
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/activation-codes/stats')}>
                <BarChart className="mr-2 h-4 w-4" />
                统计
            </Button>
            <Button variant="outline" onClick={() => { loadActivationCodes(); loadStats(); }}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
            </Button>
            <Button onClick={() => router.push('/admin/activation-codes/new')}>
                <Plus className="mr-2 h-4 w-4" />
                新增
            </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statsLoading ? (
            Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : stats ? (
            <>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总激活码</CardTitle>
                        <KeyIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已使用</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.used}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">有效</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">已过期</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">使用率</CardTitle>
                        <BarChart className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.usageRate}%</div>
                    </CardContent>
                </Card>
            </>
        ) : null}
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                      placeholder="搜索激活码、产品或邮箱..." 
                      className="pl-8" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="active">有效</SelectItem>
                      <SelectItem value="used">已使用</SelectItem>
                      <SelectItem value="expired">已过期</SelectItem>
                      <SelectItem value="unused">未使用</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setCleanupDialogOpen(true)}>
             <XCircle className="mr-2 h-4 w-4" />
             清理过期
          </Button>
      </div>

      {/* 表格 */}
      <div className="rounded-md border bg-card">
          <Table>
              <TableHeader>
                  <TableRow>
                      <TableHead>激活码</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="hidden md:table-cell">产品信息</TableHead>
                      <TableHead className="hidden lg:table-cell">客户信息</TableHead>
                      <TableHead className="hidden xl:table-cell">创建/过期</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                       Array(5).fill(0).map((_, i) => (
                           <TableRow key={i}>
                               <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                               <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                               <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-[100px]" /></TableCell>
                               <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                               <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-[120px]" /></TableCell>
                               <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                           </TableRow>
                       ))
                  ) : filteredCodes.length === 0 ? (
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                              暂无数据
                          </TableCell>
                      </TableRow>
                  ) : (
                      filteredCodes.map((code) => (
                          <TableRow key={code.id}>
                              <TableCell className="font-mono font-medium">
                                  <div className="flex items-center gap-2">
                                      {code.code}
                                      {/* 添加复制功能图标，如果需要 */}
                                  </div>
                              </TableCell>
                              <TableCell>
                                  <Badge className={getStatusBadgeClass(code)} variant="secondary">
                                      {getActivationCodeStatusText(code)}
                                  </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                  <div>
                                      <div className="font-medium">{code.productInfo?.name || "未设置"}</div>
                                      {code.productInfo?.version && (
                                          <div className="text-xs text-muted-foreground">v{code.productInfo.version}</div>
                                      )}
                                  </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                  {code.metadata?.customerEmail ? (
                                      <div className="flex flex-col">
                                          <span>{code.metadata.customerEmail}</span>
                                          {code.metadata.licenseType && (
                                              <span className="text-xs text-muted-foreground">{code.metadata.licenseType}</span>
                                          )}
                                      </div>
                                  ) : (
                                      <span className="text-muted-foreground text-xs">未设置</span>
                                  )}
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                  <div className="flex flex-col gap-1">
                                      <div className="text-xs">创建: {formatDate(code.createdAt)}</div>
                                      <div className="text-xs">过期: {formatDate(code.expiresAt)}</div>
                                  </div>
                              </TableCell>
                              <TableCell className="text-right">
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">打开菜单</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(code.code)}>
                                              <Copy className="mr-2 h-4 w-4" />
                                              复制激活码
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleViewDetail(code)}>
                                              <Eye className="mr-2 h-4 w-4" />
                                              查看详情
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => confirmDelete(code)} className="text-destructive focus:text-destructive">
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

      {/* 分页 */}
      <div className="flex justify-center">
          <Pagination>
              <PaginationContent>
                  <PaginationItem>
                      <PaginationPrevious 
                          onClick={() => currentPage > 1 && loadActivationCodes(currentPage - 1)} 
                          className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                  </PaginationItem>
                  
                  {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                      // 简化的分页逻辑，显示前5页或窗口页
                      let pageNum = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                      }
                      if (pageNum > totalPages) return null;
                      
                      return (
                          <PaginationItem key={pageNum}>
                              <PaginationLink 
                                  isActive={currentPage === pageNum}
                                  onClick={() => loadActivationCodes(pageNum)}
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
                          onClick={() => currentPage < totalPages && loadActivationCodes(currentPage + 1)} 
                          className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                  </PaginationItem>
              </PaginationContent>
          </Pagination>
      </div>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除?</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除激活码 <span className="font-mono font-bold">{codeToDelete?.code}</span>。此操作无法撤销。
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

       {/* 清理弹窗 */}
       <AlertDialog open={cleanupDialogOpen} onOpenChange={setCleanupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>清理过期激活码</AlertDialogTitle>
            <AlertDialogDescription>
              确定要清理所有已过期的激活码吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanupExpired} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认清理
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

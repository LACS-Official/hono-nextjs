'use client'

import React, { useState, useEffect } from 'react'
import {
  LogOut,
  Search,
  Eye,
  Filter,
  RefreshCw,
  X
} from 'lucide-react'
import dayjs from 'dayjs'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useToast } from "@/hooks/use-toast"

interface DeviceInfo {
  device: {
    model: string
    type: string
    vendor: string
  }
  os: {
    name: string
    version: string
  }
  browser: {
    name: string
    version: string
  }
  engine: {
    name: string
    version: string
  }
}

interface NetworkInfo {
  language: string
  referer: string
  networkType: string
  carrier: string
}

interface LoginLog {
  id: string
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  deviceInfo: DeviceInfo
  networkInfo: NetworkInfo
  loginTime: string
  sessionId: string
  isActive: boolean
  createdAt: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LoginLogsResponse {
  success: boolean
  error?: string
  data: {
    logs: LoginLog[]
    pagination: Pagination
  }
}

interface FilterParams {
  email?: string
  ipAddress?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
}

const LoginLogsPage: React.FC = () => {
  const { toast } = useToast()
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  const [filterParams, setFilterParams] = useState<FilterParams>({})
  const [selectedLog, setSelectedLog] = useState<LoginLog | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false)
  const [logoutSessionId, setLogoutSessionId] = useState<string>('')

  // 临时筛选值
  const [tempEmail, setTempEmail] = useState('')
  const [tempIpAddress, setTempIpAddress] = useState('')
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [tempIsActive, setTempIsActive] = useState<string>('')

  // 获取登录日志列表
  const fetchLoginLogs = async (page: number = 1, limit: number = 20, filters?: FilterParams) => {
    setLoading(true)
    try {
      const url = new URL('/api/login-logs', window.location.origin)

      url.searchParams.set('page', page.toString())
      url.searchParams.set('limit', limit.toString())

      if (filters?.email) {
        url.searchParams.set('email', filters.email)
      }

      if (filters?.ipAddress) {
        url.searchParams.set('ipAddress', filters.ipAddress)
      }

      if (filters?.startDate) {
        url.searchParams.set('startDate', filters.startDate)
      }

      if (filters?.endDate) {
        url.searchParams.set('endDate', filters.endDate)
      }

      if (filters?.isActive !== undefined) {
        url.searchParams.set('isActive', filters.isActive.toString())
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: LoginLogsResponse = await response.json()

      if (data.success) {
        setLoginLogs(data.data.logs)
        setPagination(data.data.pagination)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: data.error || '获取登录日志失败',
        })
      }
    } catch (error: any) {
      console.error('获取登录日志失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: error.message || '网络错误',
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchLoginLogs(pagination.page, pagination.limit, filterParams)
  }, [pagination.page, pagination.limit])

  // 应用筛选
  const handleApplyFilters = () => {
    const newFilters: FilterParams = {}
    
    if (tempEmail) newFilters.email = tempEmail
    if (tempIpAddress) newFilters.ipAddress = tempIpAddress
    if (tempStartDate) newFilters.startDate = dayjs(tempStartDate).startOf('day').toISOString()
    if (tempEndDate) newFilters.endDate = dayjs(tempEndDate).endOf('day').toISOString()
    if (tempIsActive !== '') newFilters.isActive = tempIsActive === 'true'

    setFilterParams(newFilters)
    fetchLoginLogs(1, pagination.limit, newFilters)
  }

  // 重置筛选条件
  const handleResetFilters = () => {
    setTempEmail('')
    setTempIpAddress('')
    setTempStartDate('')
    setTempEndDate('')
    setTempIsActive('')
    setFilterParams({})
    fetchLoginLogs(1, pagination.limit, {})
  }

  // 处理强制登出
  const handleForceLogout = async () => {
    try {
      const response = await fetch(`/api/login-logs/logout/${logoutSessionId}`, {
        method: 'POST'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "操作成功",
          description: "强制登出成功",
        })
        fetchLoginLogs(pagination.page, pagination.limit, filterParams)
      } else {
        toast({
          variant: "destructive",
          title: "操作失败",
          description: data.error || '强制登出失败',
        })
      }
    } catch (error: any) {
      console.error('强制登出失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "强制登出失败",
      })
    } finally {
      setLogoutConfirmVisible(false)
      setLogoutSessionId('')
    }
  }

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
            <BreadcrumbPage>登录日志管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">登录日志管理</h1>
        <p className="text-muted-foreground mt-2">
          查看和管理用户登录日志,监控账户安全
        </p>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选条件
          </CardTitle>
          <CardDescription>根据条件筛选登录日志</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">账号搜索</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="按账号搜索"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">IP地址</label>
              <Input
                placeholder="按IP地址搜索"
                value={tempIpAddress}
                onChange={(e) => setTempIpAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">开始时间</label>
              <Input
                type="datetime-local"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">结束时间</label>
              <Input
                type="datetime-local"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">会话状态</label>
              <Select value={tempIsActive} onValueChange={setTempIsActive}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">活跃</SelectItem>
                  <SelectItem value="false">已登出</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                <X className="mr-2 h-4 w-4" />
                重置
              </Button>
              <Button variant="outline" onClick={() => fetchLoginLogs(pagination.page, pagination.limit, filterParams)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 登录日志表格 */}
      <Card>
        <CardHeader>
          <CardTitle>登录记录</CardTitle>
          <CardDescription>
            共 {pagination.total} 条记录,当前第 {pagination.page} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">登录账号</TableHead>
                  <TableHead className="w-[150px]">登录IP</TableHead>
                  <TableHead className="w-[120px]">设备类型</TableHead>
                  <TableHead className="w-[180px]">操作系统</TableHead>
                  <TableHead className="w-[180px]">浏览器</TableHead>
                  <TableHead className="w-[200px]">登录时间</TableHead>
                  <TableHead className="w-[100px]">会话状态</TableHead>
                  <TableHead className="w-[180px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : loginLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  loginLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.email}</TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge variant={log.deviceInfo.device.type === 'Unknown' ? 'secondary' : 'default'}>
                          {log.deviceInfo.device.type || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.deviceInfo.os.name} {log.deviceInfo.os.version}
                      </TableCell>
                      <TableCell>
                        {log.deviceInfo.browser.name} {log.deviceInfo.browser.version}
                      </TableCell>
                      <TableCell>
                        {dayjs(log.loginTime).format('YYYY-MM-DD HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.isActive ? 'default' : 'destructive'}>
                          {log.isActive ? '活跃' : '已登出'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log)
                              setDetailModalVisible(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setLogoutSessionId(log.sessionId)
                              setLogoutConfirmVisible(true)
                            }}
                            disabled={!log.isActive}
                          >
                            <LogOut className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                显示 {((pagination.page - 1) * pagination.limit) + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条,共 {pagination.total} 条
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 登录详情模态框 */}
      <Dialog open={detailModalVisible} onOpenChange={setDetailModalVisible}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>登录详情</DialogTitle>
            <DialogDescription>查看完整的登录信息</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">登录账号</p>
                  <p className="text-sm mt-1">{selectedLog.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">用户ID</p>
                  <p className="text-sm mt-1 font-mono">{selectedLog.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">登录IP</p>
                  <p className="text-sm mt-1">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">登录时间</p>
                  <p className="text-sm mt-1">{dayjs(selectedLog.loginTime).format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">会话ID</p>
                  <p className="text-sm mt-1 font-mono">{selectedLog.sessionId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">会话状态</p>
                  <Badge variant={selectedLog.isActive ? 'default' : 'destructive'} className="mt-1">
                    {selectedLog.isActive ? '活跃' : '已登出'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">设备信息</p>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">设备类型</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.device.type || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">设备型号</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.device.model || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">设备厂商</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.device.vendor || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">操作系统</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.os.name} {selectedLog.deviceInfo.os.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">浏览器</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.browser.name} {selectedLog.deviceInfo.browser.version}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">渲染引擎</p>
                    <p className="text-sm mt-1">{selectedLog.deviceInfo.engine.name} {selectedLog.deviceInfo.engine.version}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">网络信息</p>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">语言</p>
                    <p className="text-sm mt-1">{selectedLog.networkInfo.language || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">来源</p>
                    <p className="text-sm mt-1">{selectedLog.networkInfo.referer || 'Direct'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">网络类型</p>
                    <p className="text-sm mt-1">{selectedLog.networkInfo.networkType || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">运营商</p>
                    <p className="text-sm mt-1">{selectedLog.networkInfo.carrier || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">原始User-Agent</p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs font-mono break-all">{selectedLog.userAgent}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 强制登出确认对话框 */}
      <AlertDialog open={logoutConfirmVisible} onOpenChange={setLogoutConfirmVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认强制登出</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要强制登出该设备吗?该操作将立即终止此会话,用户需要重新登录。
              <p className="text-destructive mt-2">注意:此操作不可撤销,请谨慎操作!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default LoginLogsPage

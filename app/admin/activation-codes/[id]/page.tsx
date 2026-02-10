'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Copy,
  Trash2,
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Package,
  Info
} from 'lucide-react'

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
import { useToast } from "@/hooks/use-toast"
import { DetailSkeleton } from '@/components/SkeletonScreen'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'

import {
  activationCodeApi,
  type ActivationCode,
  type ActivationCodeApiError,
  getActivationCodeStatusText,
  getActivationCodeStatusColor
} from '@/utils/activation-codes-api'

export default function ActivationCodeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string

  const [code, setCode] = useState<ActivationCode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 加载激活码详情
  const loadActivationCode = async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const data = await activationCodeApi.getActivationCodeById(id)
      setCode(data)
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      setError(apiError.message)
      console.error('加载激活码详情失败:', apiError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivationCode()
  }, [id])

  // 复制激活码
  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code.code)
      toast({
        title: "复制成功",
        description: "激活码已复制到剪贴板",
      })
    }
  }

  // 删除激活码
  const handleDelete = async () => {
    if (!code) return
    
    setDeleting(true)
    try {
      await activationCodeApi.deleteActivationCode(code.id)
      toast({
        title: "删除成功",
        description: "激活码已被删除",
      })
      router.push('/admin/activation-codes')
    } catch (error) {
      const apiError = error as ActivationCodeApiError
      toast({
        variant: "destructive",
        title: "删除失败",
        description: apiError.message,
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // 获取状态图标
  const getStatusIcon = (code: ActivationCode) => {
    if (code.isUsed) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }

    const now = new Date()
    const expiresAt = new Date(code.expiresAt)

    if (expiresAt < now) {
      return <AlertCircle className="h-5 w-5 text-destructive" />
    }

    return <Clock className="h-5 w-5 text-blue-500" />
  }

  // 获取状态颜色 (用于 Badge)
  const getStatusVariant = (code: ActivationCode): "default" | "secondary" | "destructive" => {
    const color = getActivationCodeStatusColor(code)
    if (color === 'green') return 'default'
    if (color === 'red') return 'destructive'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="space-y-6">
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
              <BreadcrumbPage>激活码详情</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <DetailSkeleton />
      </div>
    )
  }

  if (error && !code) {
    return (
      <ErrorBoundaryWrapper>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>网络错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={loadActivationCode}>重试</Button>
        </div>
      </ErrorBoundaryWrapper>
    )
  }

  if (!code) {
    return (
      <ErrorBoundaryWrapper>
        <div className="space-y-6">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>激活码不存在</AlertTitle>
            <AlertDescription>
              未找到指定的激活码,可能已被删除或ID不正确
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/admin/activation-codes')}>
            返回列表
          </Button>
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
              <BreadcrumbPage>激活码详情</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 页面头部 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">激活码详情</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(code)}
                <Badge variant={getStatusVariant(code)}>
                  {getActivationCodeStatusText(code)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
            <Button variant="outline" onClick={handleCopyCode}>
              <Copy className="mr-2 h-4 w-4" />
              复制激活码
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          </div>
        </div>

        {/* 基础信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              基础信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">激活码</p>
                <div className="flex items-center gap-2">
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                    {code.code}
                  </code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyCode}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">状态</p>
                <div className="flex items-center gap-2">
                  {getStatusIcon(code)}
                  <Badge variant={getStatusVariant(code)}>
                    {getActivationCodeStatusText(code)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  创建时间
                </p>
                <p className="text-sm">{formatDate(code.createdAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  过期时间
                </p>
                <p className="text-sm">{formatDate(code.expiresAt)}</p>
              </div>
              {code.isUsed && code.usedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    使用时间
                  </p>
                  <p className="text-sm">{formatDate(code.usedAt)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 产品信息 */}
        {code.productInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                产品信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">产品名称</p>
                  <p className="text-sm">{code.productInfo.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">产品版本</p>
                  <p className="text-sm">{code.productInfo.version}</p>
                </div>
              </div>
              {code.productInfo.features && code.productInfo.features.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">包含功能</p>
                    <div className="flex flex-wrap gap-2">
                      {code.productInfo.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 元数据信息 */}
        {code.metadata && Object.keys(code.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                元数据信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {code.metadata.customerEmail && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">客户邮箱</p>
                    <p className="text-sm">{String(code.metadata.customerEmail)}</p>
                  </div>
                )}
                {code.metadata.licenseType && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">许可证类型</p>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {String(code.metadata.licenseType)}
                    </Badge>
                  </div>
                )}
                {code.metadata.purchaseId && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">订单ID</p>
                    <p className="text-sm">{String(code.metadata.purchaseId)}</p>
                  </div>
                )}
                {code.metadata.customerId && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">客户ID</p>
                    <p className="text-sm">{String(code.metadata.customerId)}</p>
                  </div>
                )}
              </div>
              {code.metadata.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">备注</p>
                    <p className="text-sm leading-relaxed">{String(code.metadata.notes)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 删除确认对话框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除激活码 <code className="font-mono">{code.code}</code> 吗？
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    此操作无法撤销
                  </AlertDescription>
                </Alert>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "删除中..." : "删除"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ErrorBoundaryWrapper>
  )
}

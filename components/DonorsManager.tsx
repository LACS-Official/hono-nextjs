'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Heart,
  User,
  Calendar,
  RefreshCw,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

// 捐赠人员数据接口
interface Donor {
  id: number
  name: string
  donationDate: string
  createdAt: string
}

// 表单验证 schema
const donorFormSchema = z.object({
  name: z.string().min(1, '请输入捐赠人姓名').max(255, '姓名不能超过255个字符'),
  donationDate: z.string().min(1, '请选择捐赠日期'),
})

type DonorFormValues = z.infer<typeof donorFormSchema>

export default function DonorsManager() {
  const { toast } = useToast()
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)

  const form = useForm<DonorFormValues>({
    resolver: zodResolver(donorFormSchema),
    defaultValues: {
      name: '',
      donationDate: '',
    },
  })

  // 获取捐赠人员列表
  const fetchDonors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/donors')
      const data = await response.json()

      if (data.success) {
        setDonors(data.data)
      } else {
        toast({
          variant: "destructive",
          title: "获取失败",
          description: data.error || '获取捐赠人员列表失败',
        })
      }
    } catch (error) {
      console.error('获取捐赠人员列表失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setLoading(false)
    }
  }

  // 新增捐赠人员
  const handleAddDonor = async (values: DonorFormValues) => {
    try {
      setSubmitting(true)
      
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: values.name,
          donationDate: values.donationDate
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "添加成功",
          description: "捐赠人员已成功添加",
        })
        setIsModalVisible(false)
        form.reset()
        fetchDonors() // 刷新列表
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: data.error || '添加捐赠人员失败',
        })
      }
    } catch (error) {
      console.error('添加捐赠人员失败:', error)
      toast({
        variant: "destructive",
        title: "请求失败",
        description: "网络错误或服务器无响应",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDonors()
  }, [])

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
            <BreadcrumbPage>捐赠人员管理</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            捐赠人员管理
          </h2>
          <p className="text-muted-foreground">
            管理和记录捐赠人员信息
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchDonors} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setIsModalVisible(true)}>
            <Plus className="mr-2 h-4 w-4" />
            新增捐赠人员
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <Alert>
        <Heart className="h-4 w-4" />
        <AlertDescription>
          总计捐赠人员：<span className="font-bold text-blue-600">{donors.length}</span> 人
        </AlertDescription>
      </Alert>

      {/* 捐赠人员列表 */}
      <Card>
        <CardHeader>
          <CardTitle>捐赠人员列表</CardTitle>
          <CardDescription>
            所有捐赠人员的记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">序号</TableHead>
                <TableHead>捐赠人姓名</TableHead>
                <TableHead>捐赠日期</TableHead>
                <TableHead>添加时间</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : donors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无捐赠人员记录
                  </TableCell>
                </TableRow>
              ) : (
                donors.map((donor, index) => (
                  <TableRow key={donor.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{donor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span>{dayjs(donor.donationDate).format('YYYY年MM月DD日')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dayjs(donor.createdAt).format('YYYY-MM-DD HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Heart className="mr-1 h-3 w-3" />
                        已记录
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增捐赠人员对话框 */}
      <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              新增捐赠人员
            </DialogTitle>
            <DialogDescription>
              添加新的捐赠人员记录
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddDonor)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>捐赠人姓名</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="请输入捐赠人姓名"
                          className="pl-9"
                          maxLength={255}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="donationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>捐赠日期</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={dayjs().format('YYYY-MM-DD')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalVisible(false)
                    form.reset()
                  }}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      添加
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

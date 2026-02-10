'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  ArrowLeft, 
  Save, 
  Key, 
  Info, 
  User, 
  Package, 
  FileText,
  RefreshCw 
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    Checkbox
} from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  activationCodeApi,
  type CreateActivationCodeRequest,
  type ActivationCodeApiError
} from '@/utils/activation-codes-api'

const formSchema = z.object({
  expirationDays: z.coerce.number().min(1, "有效期至少1天").max(3650, "有效期不能超过3650天"),
  licenseType: z.string().min(1, "请选择许可证类型"),
  productName: z.string().min(1, "请输入产品名称"),
  productVersion: z.string().min(1, "请输入产品版本"),
  features: z.array(z.string()).min(1, "请选择至少一个功能"),
  customerEmail: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
  customerId: z.string().optional(),
  purchaseId: z.string().optional(),
  notes: z.string().max(500, "备注不能超过500字").optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NewActivationCodePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      expirationDays: 365,
      licenseType: 'standard',
      productName: '玩机管家',
      productVersion: '1.0.0',
      features: ['basic'],
      customerEmail: '',
      customerId: '',
      purchaseId: '',
      notes: ''
    },
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)

    try {
      const request: CreateActivationCodeRequest = {
        expirationDays: values.expirationDays,
        metadata: {
          customerEmail: values.customerEmail || undefined,
          licenseType: values.licenseType,
          purchaseId: values.purchaseId || undefined,
          customerId: values.customerId || undefined,
          notes: values.notes || undefined
        },
        productInfo: {
          name: values.productName,
          version: values.productVersion,
          features: values.features
        }
      }

      const result = await activationCodeApi.createActivationCode(request)

      toast({
        title: "激活码创建成功",
        description: "激活码已成功创建并可以使用",
      })

      // 跳转到详情页面或列表页面
      router.push(`/admin/activation-codes/${result.id}`)

    } catch (error) {
      const apiError = error as ActivationCodeApiError
      toast({
        variant: "destructive",
        title: "创建失败",
        description: apiError.message,
      })
    } finally {
      setLoading(false)
    }
  }

  // 预设的许可证类型
  const licenseTypes = [
    { value: 'standard', label: '标准版' },
    { value: 'premium', label: '高级版' },
    { value: 'enterprise', label: '企业版' },
    { value: 'trial', label: '试用版' },
    { value: 'educational', label: '教育版' }
  ]

  // 预设的产品功能 （改为 Select Options 而不是 Checkbox 以方便选择）
  const productFeatures = [
    { value: 'basic', label: '基础功能' },
    { value: 'advanced', label: '高级功能' },
    { value: 'sync', label: '同步功能' },
    { value: 'backup', label: '备份功能' },
    { value: 'analytics', label: '分析功能' },
    { value: 'api', label: 'API访问' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                  <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-2xl font-bold tracking-tight">创建激活码</h2>
          </div>
          <p className="text-muted-foreground ml-14">
             填写以下信息来创建新的激活码
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 基础信息 */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">基础信息</h3>
                    </div>
                    <Separator />
                    <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="expirationDays"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>有效期 (天)</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center">
                                            <Input type="number" {...field} className="rounded-r-none" />
                                            <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">天</div>
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        激活码的有效期，超过此时间后将无法使用
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="licenseType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>许可证类型</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="选择许可证类型" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {licenseTypes.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* 客户信息 */}
                <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">客户信息</h3>
                    </div>
                    <Separator />
                    <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="customerEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户邮箱</FormLabel>
                                    <FormControl>
                                        <Input placeholder="customer@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>客户ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="客户唯一标识" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="purchaseId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>订单ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="关联的订单或购买记录ID" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                 {/* 产品信息 */}
                 <div className="space-y-4">
                     <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">产品信息</h3>
                    </div>
                    <Separator />
                     <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="productName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>产品名称</FormLabel>
                                    <FormControl>
                                        <Input placeholder="玩机管家" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="productVersion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>产品版本</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1.0.0" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel>包含功能</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border p-4 rounded-md">
                                        {productFeatures.map((item) => (
                                            <FormItem
                                                key={item.value}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value?.includes(item.value)}
                                                        onCheckedChange={(checked) => {
                                                            return checked
                                                                ? field.onChange([...field.value, item.value])
                                                                : field.onChange(
                                                                    field.value?.filter(
                                                                        (value) => value !== item.value
                                                                    )
                                                                )
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormLabel className="font-normal cursor-pointer">
                                                    {item.label}
                                                </FormLabel>
                                            </FormItem>
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                     </div>
                </div>

                 {/* 备注信息 */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-medium">备注信息</h3>
                    </div>
                    <Separator />
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>备注</FormLabel>
                                <FormControl>
                                    <Textarea 
                                        placeholder="添加关于此激活码的备注信息..." 
                                        className="min-h-[100px]"
                                        {...field} 
                                    />
                                </FormControl>
                                <FormDescription>最多500个字符</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>创建提示</AlertTitle>
                    <AlertDescription>
                        激活码创建后将自动生成唯一的激活码字符串，您可以将其分发给客户使用。
                    </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        取消
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        创建激活码
                    </Button>
                </div>
            </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  )
}

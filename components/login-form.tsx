'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useLoginLog } from '@/hooks/useLoginLog';

const formSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
})

type FormValues = z.infer<typeof formSchema>

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast()
  const supabase = createClient();
  const { recordLoginLog } = useLoginLog();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // 这里的类型断言是为了避免复杂的 Supabase Auth 返回类型处理
  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      // 1. 检查是否被拉黑
      try {
        const blockCheck = await fetch('/api/auth/check-blocked');
        const blockResult = await blockCheck.json();
        if (blockResult.success && blockResult.blocked) {
          toast({
            variant: "destructive",
            title: "访问受限",
            description: blockResult.reason || "您的 IP 或设备已被禁止登录",
          });
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('检查黑名单失败，继续登录流程', e);
      }

      // 2. 执行登录
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast({
            variant: "destructive",
            title: "登录失败",
            description: "请检查您的邮箱和密码",
        })
        return;
      }

      // 记录登录日志
      await recordLoginLog();
      
      toast({
          title: "登录成功",
          description: "正在跳转...",
      })
      router.push('/admin');
    } catch (error) {
        toast({
            variant: "destructive",
            title: "错误",
            description: "登录过程中发生错误",
        })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">LACS Admin</CardTitle>
            <CardDescription>
                管理员控制台登录
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onFinish)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>邮箱</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="name@example.com" className="pl-9" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>密码</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="password" placeholder="请输入密码" className="pl-9" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登录
                </Button>
            </form>
            </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
             <p>安全提示：请使用管理员账号登录</p>
        </CardFooter>
      </Card>
    </div>
  );
}
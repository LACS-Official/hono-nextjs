'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Loader2,
  Mail,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Smartphone,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

interface LoginFormProps {
  entranceCode?: string
}

export default function LoginForm({ entranceCode }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<'credentials' | 'two_factor'>('credentials');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState('');

  const [lockoutState, setLockoutState] = useState<{
    isLocked: boolean
    reason?: string
    remainingSeconds?: number
  }>({ isLocked: false });

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

  // 1. 若携带安全入口代码，持久化至 Cookie，有效期 2 小时
  useEffect(() => {
    if (entranceCode) {
      document.cookie = `lacs_entrance_pass=${encodeURIComponent(entranceCode)}; path=/; max-age=7200; SameSite=Lax`
    }
  }, [entranceCode])

  // 2. 初始化检测封禁与防爆破锁定状态
  const checkLockoutStatus = async () => {
    try {
      const res = await fetch('/api/auth/check-blocked');
      const data = await res.json();
      if (data.success && data.blocked) {
        setLockoutState({
          isLocked: true,
          reason: data.reason,
          remainingSeconds: data.remainingSeconds ?? 900,
        });
      } else {
        setLockoutState({ isLocked: false });
      }
    } catch (e) {
      console.error('检查登录安全状态失败:', e);
    }
  };

  useEffect(() => {
    checkLockoutStatus();
  }, []);

  // 3. 锁定倒计时定时器
  useEffect(() => {
    if (!lockoutState.isLocked || !lockoutState.remainingSeconds || lockoutState.remainingSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setLockoutState((prev) => {
        if (!prev.remainingSeconds || prev.remainingSeconds <= 1) {
          clearInterval(timer);
          checkLockoutStatus();
          return { isLocked: false };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutState.isLocked, lockoutState.remainingSeconds]);

  // 4. 第一步：提交密码认证
  const onFinish = async (values: FormValues) => {
    if (lockoutState.isLocked) {
      toast({
        variant: "destructive",
        title: "系统安全锁定中",
        description: lockoutState.reason || "当前 IP 处于防暴力破解锁定保护中，禁止尝试",
      });
      return;
    }

    setLoading(true);
    try {
      // 执行 Supabase 密码认证
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        // 密码错误：上报登录失败并由服务端累计失败次数
        try {
          const failRes = await fetch('/api/auth/record-login-failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: values.email }),
          });
          const failData = await failRes.json();

          if (failData.locked) {
            setLockoutState({
              isLocked: true,
              reason: failData.message,
              remainingSeconds: (failData.lockDurationMinutes || 15) * 60,
            });
            toast({
              variant: "destructive",
              title: "已触发防爆破锁定",
              description: failData.message,
            });
            return;
          } else {
            toast({
              variant: "destructive",
              title: "登录失败",
              description: failData.message || "请检查您的邮箱和密码",
            });
            return;
          }
        } catch {
          toast({
            variant: "destructive",
            title: "登录失败",
            description: "请检查您的邮箱和密码",
          });
          return;
        }
      }

      // 密码验证成功，先检测是否启用了 2FA 双因子认证
      try {
        const twoFaCheck = await fetch('/api/auth/2fa/status');
        const twoFaData = await twoFaCheck.json();

        if (twoFaData.success && twoFaData.enabled) {
          // 开启了 2FA：无缝过渡到第二步口令验证
          setAuthenticatedEmail(values.email);
          setLoginStep('two_factor');
          toast({
            title: "账号已启用 2FA 保护",
            description: "请输入手机身份验证器中的 6 位动态口令",
          });
          return;
        }
      } catch (e) {
        console.warn('[2FA Status Check Error]:', e);
      }

      // 未启用 2FA 时，直接成功登录进入后台
      fetch('/api/auth/record-login-success', { method: 'POST' }).catch(() => {});
      await recordLoginLog();

      toast({
        title: "登录成功",
        description: "正在进入管理控制台...",
      });
      router.push('/admin');
    } catch {
      toast({
        variant: "destructive",
        title: "错误",
        description: "登录过程中发生未知异常",
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. 第二步：提交 2FA 动态口令 / 备用恢复码验证
  const onVerifyTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) {
      toast({
        variant: "destructive",
        title: "请输入验证码",
        description: useBackupCode ? "请输入 8 位应急备用恢复码" : "请输入 6 位动态验证码",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authenticatedEmail,
          code: twoFactorCode.trim(),
        }),
      });
      const data = await res.json();

      if (data.success && data.verified) {
        // 2FA 验证成功
        fetch('/api/auth/record-login-success', { method: 'POST' }).catch(() => {});
        await recordLoginLog();

        toast({
          title: "2FA 双因子安全认证成功",
          description: data.message || "登录成功，正在进入控制台...",
        });
        router.push('/admin');
      } else {
        // 2FA 验证失败，计入防爆破次数
        if (data.locked) {
          setLockoutState({
            isLocked: true,
            reason: data.error,
            remainingSeconds: data.remainingSeconds || 900,
          });
          toast({
            variant: "destructive",
            title: "已触发防爆破锁定",
            description: data.error,
          });
        } else {
          toast({
            variant: "destructive",
            title: "口令校验未通过",
            description: data.error || "动态验证码错误或已过期",
          });
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: "无法连接 2FA 验证服务，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-black/40 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-black/[0.08] dark:border-white/[0.1] rounded-3xl overflow-hidden backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-2">
            {entranceCode ? (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 text-[11px] px-2.5 py-0.5 rounded-full font-mono">
                <ShieldCheck className="h-3 w-3 mr-1 inline" /> 1Panel 安全入口已校验
              </Badge>
            ) : (
              <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 text-[11px] px-2.5 py-0.5 rounded-full">
                <Lock className="h-3 w-3 mr-1 inline" /> 领创管理中枢
              </Badge>
            )}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {loginStep === 'credentials' ? 'LACS Admin' : '2FA 双因子安全验证'}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {loginStep === 'credentials'
              ? '管理员控制台身份认证'
              : `正在为 ${authenticatedEmail || '管理员'} 校验动态身份凭据`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 防爆破锁定告警横幅 */}
          {lockoutState.isLocked && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:text-red-400 space-y-2 text-left">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldAlert className="h-4 w-4" />
                <span>安全防护已锁定</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {lockoutState.reason || '连续登录失败超过 3 次，该 IP 已被系统安全锁定 15 分钟，防止暴力破解。'}
              </p>
              {lockoutState.remainingSeconds !== undefined && lockoutState.remainingSeconds > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium pt-1">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  <span>
                    剩余解锁倒计时：{Math.floor(lockoutState.remainingSeconds / 60)} 分 {lockoutState.remainingSeconds % 60} 秒
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 阶段 1：账号与密码输入 */}
          {/* ========================================================================= */}
          {loginStep === 'credentials' && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFinish)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">管理员邮箱</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="admin@lacs.cc"
                            className="pl-10 h-10 rounded-xl"
                            disabled={loading || lockoutState.isLocked}
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">访问密码</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="请输入密码"
                            className="pl-10 h-10 rounded-xl"
                            disabled={loading || lockoutState.isLocked}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20"
                  disabled={loading || lockoutState.isLocked}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {lockoutState.isLocked ? '安全锁定中' : '登录控制台'}
                </Button>
              </form>
            </Form>
          )}

          {/* ========================================================================= */}
          {/* 阶段 2：2FA TOTP 6位动态口令验证 */}
          {/* ========================================================================= */}
          {loginStep === 'two_factor' && (
            <form onSubmit={onVerifyTwoFactor} className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="h-4 w-4" />
                  <span>Google / 微软身份验证器</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {useBackupCode
                    ? '请输入绑定时保存的 8 位应急备用恢复码（如 a1b2-c3d4）'
                    : '打开手机上的 Authenticator App，输入当前 6 位动态验证码'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder={useBackupCode ? "xxxx-xxxx" : "000000"}
                    autoFocus
                    maxLength={useBackupCode ? 12 : 6}
                    disabled={loading || lockoutState.isLocked}
                    className="h-12 text-center font-mono text-xl tracking-[0.25em] font-bold rounded-xl bg-white dark:bg-[#161618] border-black/10 dark:border-white/10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-500/20"
                disabled={loading || lockoutState.isLocked}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {lockoutState.isLocked ? '安全锁定中' : '确认并进入控制台'}
              </Button>

              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setUseBackupCode(!useBackupCode)}
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>{useBackupCode ? "使用 6 位动态口令" : "手机丢失？使用备用恢复码"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('credentials');
                    setTwoFactorCode('');
                  }}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>返回重新输入密码</span>
                </button>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-1.5 text-center text-xs text-muted-foreground border-t border-black/[0.04] dark:border-white/[0.05] pt-4">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 inline" />
            <span>防爆破机制：连续失败 3 次将自动锁定 IP 15 分钟</span>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
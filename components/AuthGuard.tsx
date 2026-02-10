'use client'

import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { ReactNode } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps): JSX.Element {
  const { user, loading, login } = useAuth()

  // 加载状态
  if (loading) {
    return (fallback || (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="text-slate-600 font-medium">正在验证身份...</p>
        </div>
      </div>
    )) as JSX.Element
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
        <Card className="max-w-md w-full shadow-lg border-slate-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">访问受限</CardTitle>
            <CardDescription className="text-slate-500 mt-2">
              您当前未登录或会话已过期，需要登录才能访问此管理页面。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-600 italic font-medium">定制系统联系微信: LACS177</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 text-base font-bold" onClick={login}>
              立即登录
            </Button>
          </CardFooter>
        </Card>
      </div>
    ) as JSX.Element
  }

  // 已登录
  return <>{children}</> as JSX.Element
}

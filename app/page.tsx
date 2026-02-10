'use client'

import { useState, useEffect } from 'react'
import {
  Rocket,
  CheckCircle2,
  Database,
  ShieldCheck,
  Zap,
  ChevronRight,
  Monitor,
  Key,
  Bell
} from 'lucide-react'
import Link from 'next/link'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [stats, setStats] = useState({
    totalSoftware: 0,
    totalActivationCodes: 0,
    totalAnnouncements: 0,
    systemStatus: 'healthy'
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟加载统计数据
    const loadStats = async () => {
      try {
        // 这里可以调用实际的 API 获取统计数据
        setStats({
          totalSoftware: 12,
          totalActivationCodes: 156,
          totalAnnouncements: 8,
          systemStatus: 'healthy'
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50">
      <main className="container mx-auto px-4 py-16">
        {/* 页面头部 */}
        <div className="flex flex-col items-center text-center space-y-8 mb-16">
          <div className="p-6 bg-blue-500 rounded-3xl shadow-xl shadow-blue-200">
            <Rocket className="h-16 w-16 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              <span className="text-blue-600">领创</span> 一站式管理系统
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
              基于 Next.js + Hono 构建的现代化 API 服务器，提供软件管理、激活码系统和公告管理功能。
            </p>
          </div>

          <div className="inline-flex items-center gap-2 p-1 px-4 rounded-full bg-red-50 text-red-600 text-lg font-medium border border-red-100 italic">
            定制系统请联系微信: <span className="font-bold underline">LACS177</span>
            <Badge variant="destructive" className="ml-2">备注: 定制管理系统</Badge>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg">
              <Link href="/admin">
                进入管理后台 <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg bg-white">
              了解更多
            </Button>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mb-12">
          <Alert className="bg-green-50 border-green-200 py-6">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <AlertTitle className="text-green-800 text-lg font-bold">系统运行正常</AlertTitle>
            <AlertDescription className="text-green-700 text-base">
              所有服务正常运行，API 响应正常负载均衡中
            </AlertDescription>
          </Alert>
        </div>

        {/* 统计指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="h-1 bg-blue-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">总软件数量</CardTitle>
              <Monitor className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">{stats.totalSoftware}</div>
              <p className="text-xs text-slate-500 mt-1">+2 本月新增</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="h-1 bg-purple-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">总激活码</CardTitle>
              <Key className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">{stats.totalActivationCodes}</div>
              <p className="text-xs text-slate-500 mt-1">+15 今日生成</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="h-1 bg-emerald-500 w-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">系统公告数</CardTitle>
              <Bell className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">{stats.totalAnnouncements}</div>
              <p className="text-xs text-slate-500 mt-1">2 条待读</p>
            </CardContent>
          </Card>
        </div>

        {/* 功能特性网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-200/60 shadow-sm hover:border-blue-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>软件管理</CardTitle>
              <CardDescription>完整的生命周期管理系统</CardDescription>
            </CardHeader>
            <CardContent className="text-slate-600">
              <ul className="space-y-2 list-disc list-inside">
                <li>软件信息 CRUD 操作</li>
                <li>版本历史与差异比对</li>
                <li>多语言更新日志支持</li>
                <li>分渠道下载链接管理</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0 text-blue-600" asChild>
                <Link href="/admin/software">立即管理</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:border-purple-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <ShieldCheck className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>激活码系统</CardTitle>
              <CardDescription>严密的授权与验证模块</CardDescription>
            </CardHeader>
            <CardContent className="text-slate-600">
              <ul className="space-y-2 list-disc list-inside">
                <li>批量生成与导出</li>
                <li>过期时间精准控制</li>
                <li>设备绑定与重置功能</li>
                <li>详尽的使用统计报表</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0 text-purple-600" asChild>
                <Link href="/admin/activation-codes">立即管理</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:border-emerald-200 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>公告与横幅</CardTitle>
              <CardDescription>高效的内容直达能力</CardDescription>
            </CardHeader>
            <CardContent className="text-slate-600">
              <ul className="space-y-2 list-disc list-inside">
                <li>全局/单应用公告推送</li>
                <li>网站横幅与轮播图展示</li>
                <li>富文本编辑与即时生效</li>
                <li>历史版本一键回滚</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="px-0 text-emerald-600" asChild>
                <Link href="/admin/websites">立即管理</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2024 - 2026 领创一站式管理系统. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-blue-600 transition-colors">隐私政策</a>
            <a href="#" className="hover:text-blue-600 transition-colors">服务条款</a>
            <a href="#" className="hover:text-blue-600 transition-colors">联系我们</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

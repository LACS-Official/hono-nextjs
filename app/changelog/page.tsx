'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Wrench,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Tag,
  Rocket,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowUpRight
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Aurora from "@/components/animations/Aurora"
import { changelogData, type ChangelogRelease } from "@/lib/changelog-data"

export default function ChangelogPage() {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    'v1.3.0': true,
    'v1.2.3': true,
    'v1.2.0': true,
    'v1.1.0': true,
    'v1.0.0': true,
  })

  const toggleExpand = (version: string) => {
    setExpandedVersions(prev => ({ ...prev, [version]: !prev[version] }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    changelogData.forEach(r => { all[r.version] = true })
    setExpandedVersions(all)
  }

  const collapseAll = () => {
    setExpandedVersions({ 'v1.3.0': true })
  }

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 极光背景层 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Aurora 
          colorStops={['#020617', '#0f172a', '#1e1b4b']} 
          blend={0.6}
          amplitude={1.2}
          speed={0.4}
        />
      </div>

      {/* 顶部导航 */}
      <header className="relative z-10 border-b border-white/5 bg-[#020617]/40 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>返回主页</span>
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              版本更新日志
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/aboutus">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white">
                关于我们
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" variant="outline" className="text-xs border-white/10 hover:bg-white/10 text-slate-300 rounded-xl">
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-16 max-w-5xl">
        {/* Hero 标题 */}
        <div className="text-center space-y-4 mb-16">
          <Badge className="px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="h-3 w-3 mr-1 inline" /> 架构演进与版本发布时间轴
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            领创全栈平台更新日志
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
            遵循严格的 SemVer 2.0.0 语义化版本规范。记录从初始架构闭环到企业级智能化运营中枢的全部功能升级与安全演化。
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs border-white/10 text-slate-300 hover:bg-white/5">
              展开全部历史
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs border-white/10 text-slate-300 hover:bg-white/5">
              仅看最新版本
            </Button>
          </div>
        </div>

        {/* 时间轴容器 */}
        <div className="relative border-l border-white/10 ml-4 md:ml-32 pl-6 md:pl-10 space-y-12">
          {changelogData.map((release, index) => {
            const isExpanded = !!expandedVersions[release.version]

            return (
              <motion.div
                key={release.version}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* 时间轴圆点 */}
                <div className={`absolute -left-[31px] md:-left-[47px] top-1.5 h-4 w-4 rounded-full border-2 transition-all ${
                  release.isLatest 
                    ? 'bg-blue-500 border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-125' 
                    : 'bg-slate-900 border-slate-600 group-hover:border-blue-400'
                }`} />

                {/* 左侧悬挂日期（大屏） */}
                <div className="hidden md:block absolute -left-36 top-1 text-right w-24">
                  <span className="font-mono text-xs text-slate-400 font-medium">
                    {release.date}
                  </span>
                </div>

                {/* 卡片主体 */}
                <Card className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  release.isLatest
                    ? 'bg-gradient-to-b from-blue-950/20 via-slate-900/60 to-slate-900/80 border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}>
                  <div className="p-6 md:p-8 space-y-4">
                    {/* 卡片头部 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-2xl font-black tracking-tight text-white font-mono">
                          {release.version}
                        </span>
                        {release.isLatest && (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[11px] px-2 py-0.5">
                            当前最新稳定版
                          </Badge>
                        )}
                        <span className="md:hidden text-xs font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {release.date}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-slate-400 hover:text-white self-start sm:self-auto"
                        onClick={() => toggleExpand(release.version)}
                      >
                        {isExpanded ? (
                          <>收起详情 <ChevronUp className="h-3.5 w-3.5 ml-1" /></>
                        ) : (
                          <>展开更新明细 <ChevronDown className="h-3.5 w-3.5 ml-1" /></>
                        )}
                      </Button>
                    </div>

                    {/* 主题标签与概括 */}
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        {release.tagline}
                      </h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {release.summary}
                      </p>
                    </div>

                    {/* 展开内容 */}
                    {isExpanded && (
                      <div className="pt-4 space-y-6 border-t border-white/5 mt-4">
                        {/* 新增功能 */}
                        {release.features.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" />
                              新增功能与模块 (Features)
                            </h4>
                            <ul className="grid gap-2 text-xs text-slate-300">
                              {release.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-2.5 leading-relaxed bg-white/[0.015] p-2 rounded-lg border border-white/[0.04]">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 优化与修复 */}
                        {release.improvements.length > 0 && (
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5" />
                              系统调优与安全修复 (Improvements & Fixes)
                            </h4>
                            <ul className="grid gap-2 text-xs text-slate-400">
                              {release.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 shrink-0 mt-1.5" />
                                  <span>{imp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </main>

      {/* 底部 Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-12 mt-20">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div>
            <span>领创软件工作室 © 2024 - 2026. 保留所有权利。</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">主页</Link>
            <Link href="/aboutus" className="hover:text-white transition-colors">关于我们</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

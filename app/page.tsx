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
  Bell,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

import { Button } from "@/components/ui/button"
import Aurora from "@/components/animations/Aurora"
import TrueFocus from "@/components/animations/TrueFocus"
import SpotlightCard from "@/components/animations/SpotlightCard"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function HomePage() {
  const [stats, setStats] = useState({
    totalSoftware: 12,
    totalActivationCodes: 156,
    totalAnnouncements: 8,
    systemStatus: 'healthy'
  })

  const ContactQR = () => (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 space-y-8">
      <div className="relative group p-4 bg-white rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.3)] transition-all duration-700 hover:scale-105 hover:shadow-[0_0_80px_rgba(59,130,246,0.5)]">
        <img 
          src="https://img-g.lacs.cc/file/qrcode/1771514433478_IMG_20260219_231455.webp" 
          alt="领创企业微信" 
          className="w-80 h-80 md:w-[450px] md:h-[450px] rounded-[2.5rem] object-cover"
        />
        <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-blue-500/10 pointer-events-none group-hover:border-blue-500/30 transition-colors" />
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
          扫码联系企业微信
        </h3>
        <p className="text-slate-400 text-lg font-medium opacity-80">
          定制管理系统 / 软件外包 / 合作咨询
        </p>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 极光背景层 */}
      <div className="absolute inset-0 z-0">
        <Aurora 
          colorStops={['#020617', '#0f172a', '#1e1b4b']} 
          blend={0.6}
          amplitude={1.2}
          speed={0.5}
        />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-[#020617]/40 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              领创互联网业务一站式管理系统
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">核心功能</a>
            <a href="#stats" className="hover:text-white transition-colors">实时概况</a>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-24 pb-32 text-center lg:pt-32">

          <div className="mb-10 min-h-[140px] flex items-center justify-center">
            <TrueFocus 
              sentence="领创互联网业务一站式管理系统"
              blurAmount={6}
              borderColor="#3b82f6"
              className="text-5xl md:text-7xl font-black tracking-tighter text-white"
              animationDuration={0.6}
            />
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-12 font-medium"
          >
            基于 Next.js + Hono 的高性能后台架构。为开发者提供从软件分发、授权验证到内容直达的全链路数字化管理方案。
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex items-center gap-3 p-1 px-4 h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-colors">
                  <span className="text-slate-500 text-sm">点我定制同款</span>
                  <span className="text-white font-bold italic">LACS177</span>
                  <Badge className="bg-blue-500/20 text-blue-400 border-none hover:bg-blue-500/30">
                    微信咨询
                  </Badge>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] md:max-w-3xl bg-[#020617]/95 backdrop-blur-3xl border-white/10 rounded-[4rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <DialogHeader className="sr-only">
                  <DialogTitle>联系我们</DialogTitle>
                </DialogHeader>
                <ContactQR />
              </DialogContent>
            </Dialog>
          </motion.div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="container mx-auto px-6 py-24 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: '管控组件', value: stats.totalSoftware, suffix: '+', icon: Monitor, color: 'text-blue-500' },
              { label: '活跃授权', value: stats.totalActivationCodes, suffix: '', icon: Key, color: 'text-indigo-500' },
              { label: '下发公告', value: stats.totalAnnouncements, suffix: ' 条', icon: Bell, color: 'text-emerald-500' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
              >
                <div className={`p-3 rounded-2xl bg-white/5 w-fit mb-6 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-4xl font-bold text-white mb-2 flex items-baseline">
                  {stat.value}
                  <small className="text-slate-500 text-lg ml-1 font-normal">{stat.suffix}</small>
                </div>
                <p className="text-slate-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 text-left">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">更专业的<br /><span className="text-blue-500">数字化底座</span></h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                摆脱千篇一律的通用模板，我们为每一个管理细节注入深思熟虑的交互。
              </p>
            </div>
            <div className="flex gap-4 p-4 rounded-3xl bg-green-500/5 border border-green-500/20">
              <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
              <div>
                <h4 className="text-white font-bold text-sm">Cluster Status: Healthy</h4>
                <p className="text-slate-500 text-xs mt-1">负载均衡节点: 12个正常 / 0个故障</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Database className="w-7 h-7 text-blue-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">组件化管理</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                从软件 CRUD 到多端版本分发，提供极简的发布体验与多版本历史差异比对，支持多平台下载链接。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500" /> 全球 CDN 下载同步</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500" /> 多语言发行日志支持</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-blue-500" /> 渠道包独立管理</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(99, 102, 241, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-indigo-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">动态激活码矩阵</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                支持端侧设备指纹精准绑定，提供批量生成、过期控制与一键设备重置，严密的授权验证机制。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500" /> 硬件特征防重合算法</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500" /> 批量导出与格式自定义</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500" /> 分组分类隔离管理</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">全端公告系统</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                集成富文本编辑的公告下发系统，支持全屏 Banner、底部滚动条。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> 实时热更新即时生效</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> 单软件/全局精准推送</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> 历史版本秒级回滚</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Monitor className="w-7 h-7 text-amber-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">行为追踪与统计</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                深度记录用户使用习惯与设备连接详情，多维度图表化展示业务增长趋势。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-amber-500" /> 实时在线连接监控</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-amber-500" /> 设备指纹唯一性溯源</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-amber-500" /> 异常请求智能预警</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(239, 68, 68, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-red-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">安全准入管理</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                集成的黑名单系统，一键忽略异常设备记录。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" /> 黑名单数据库级拦截</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" /> 登录审计流水记录</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" /> 敏感操作日志留存</li>
              </ul>
            </SpotlightCard>

            <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.15)">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                  <Key className="w-7 h-7 text-purple-400" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">全局参数控制</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                灵活的系统配置台，支持远程动态调整业务逻辑参数。
              </p>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500" /> 无需重启即时热更</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500" /> 系统资源负载看板</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-purple-500" /> 自定义变量扩展性</li>
              </ul>
            </SpotlightCard>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/40 py-16">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <a href="https://lacs.cc" target="_blank" rel="noopener noreferrer">
            领创工作室官网
            </a>
                       <p className="text-slate-500 text-sm max-w-sm">
                领创软件工作室出品。2024 - 2026. <br />
                一站式数字化管理系统，致力于打造极致的管理体验。
              </p>
          </div>
          
          <div className="flex gap-10 text-sm font-medium">
            <div className="flex flex-col gap-4">
              <span className="text-white">支持</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-500 hover:text-white transition-colors">微信客服</button>
                </DialogTrigger>
                <DialogContent className="max-w-[90vw] md:max-w-3xl bg-[#020617]/95 backdrop-blur-3xl border-white/10 rounded-[4rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                  <DialogHeader className="sr-only">
                    <DialogTitle>联系客服</DialogTitle>
                  </DialogHeader>
                  <ContactQR />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


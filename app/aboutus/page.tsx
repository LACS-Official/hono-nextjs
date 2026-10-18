'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Globe,
  Users,
  FolderKanban,
  Contact,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  QrCode
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ContactInfo {
  id: number
  title: string
  desc: string
  icon: string
  action: string
  link: string
}

interface GroupChat {
  id: number
  name: string
  limit: string
  groupNumber: string
  qrcode: string
  joinLink: string
}

interface MediaPlatform {
  id: number
  name: string
  logo: string
  account: string
  qrcode: string
  link: string
}

interface Project {
  id: number
  categoryName: string
  title: string
  description: string
  platform: string
  link: string
  icon: string
}

interface SubSite {
  id: number
  name: string
  domain: string
  description: string
  logo: string
  isShowInAboutUs: boolean
  isActive: boolean
}

export default function AboutUsPublicPage() {
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [groups, setGroups] = useState<GroupChat[]>([])
  const [media, setMedia] = useState<MediaPlatform[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [subsites, setSubsites] = useState<SubSite[]>([])
  const [loading, setLoading] = useState(true)

  // QR Code preview
  const [previewQr, setPreviewQr] = useState<{ title: string; image: string } | null>(null)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [cRes, gRes, mRes, pRes, sRes] = await Promise.all([
          fetch('/api/info-management/contact-info').then(r => r.json()).catch(() => ({})),
          fetch('/api/info-management/group-chats').then(r => r.json()).catch(() => ({})),
          fetch('/api/info-management/media-platforms').then(r => r.json()).catch(() => ({})),
          fetch('/api/info-management/projects').then(r => r.json()).catch(() => ({})),
          fetch('/api/info-management/sub-sites').then(r => r.json()).catch(() => ({})),
        ])

        if (cRes.success && cRes.data) setContacts(cRes.data)
        if (gRes.success && gRes.data) setGroups(gRes.data)
        if (mRes.success && mRes.data) setMedia(mRes.data)
        if (pRes.success && pRes.data) setProjects(pRes.data)
        if (sRes.success && sRes.data) setSubsites(sRes.data.filter((s: SubSite) => s.isShowInAboutUs && s.isActive))
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117] text-foreground">
      {/* 顶部简易导航栏 */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] dark:border-white/[0.08] bg-white/70 dark:bg-black/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              LC
            </span>
            <span>领创开放平台</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs">
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主视觉 Hero */}
      <section className="py-16 md:py-24 text-center px-4 max-w-4xl mx-auto space-y-4">
        <Badge variant="secondary" className="px-3 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Sparkles className="h-3 w-3 mr-1 inline" /> 关于我们与生态矩阵
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          技术驱动，开源领创
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          致力于为数码极客与开发者提供稳定、高效的玩机软件分发、系统运维与自动化中枢平台。
        </p>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-24 space-y-16">
        {/* 旗下精选项目 */}
        {projects.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-blue-600" />
                  精选生态项目
                </h2>
                <p className="text-xs text-muted-foreground">自主研发与维护的核心产品与开源工具</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((proj) => (
                <Card key={proj.id} className="hover:shadow-md transition-all hover:border-blue-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">{proj.title}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          {proj.categoryName || proj.platform}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-600 hover:underline pt-1">
                        了解详情 <ArrowRight className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 旗下站点矩阵 */}
        {subsites.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-600" />
                旗下站点矩阵
              </h2>
              <p className="text-xs text-muted-foreground">互联互通的跨域应用与服务平台</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {subsites.map((site) => (
                <Card key={site.id} className="p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Globe className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="font-semibold text-sm">{site.name}</div>
                    </div>
                    {site.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{site.description}</p>
                    )}
                  </div>
                  <div className="pt-3 border-t mt-3">
                    <a
                      href={site.domain.startsWith('http') ? site.domain : `https://${site.domain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {site.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 交流社群 & 官方群聊 */}
        {groups.length > 0 && (
          <section className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                官方交流社群
              </h2>
              <p className="text-xs text-muted-foreground">加入开发者与极客讨论组，获取一手动态与答疑</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id} className="p-4 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="font-semibold text-sm">{group.name}</div>
                    {group.groupNumber && (
                      <div className="text-xs text-muted-foreground font-mono">
                        群号：{group.groupNumber}
                      </div>
                    )}
                    {group.limit && (
                      <Badge variant="secondary" className="text-[10px]">
                        规模：{group.limit}
                      </Badge>
                    )}
                  </div>

                  <div className="pt-3 border-t mt-3 flex items-center gap-2">
                    {group.joinLink && (
                      <a href={group.joinLink} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs h-7">
                          一键加入
                        </Button>
                      </a>
                    )}
                    {group.qrcode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7 px-2"
                        onClick={() => setPreviewQr({ title: group.name, image: group.qrcode })}
                      >
                        <QrCode className="h-3.5 w-3.5 mr-1" /> 二维码
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* 媒体平台与联系方式 */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* 媒体平台 */}
          {media.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-rose-500" />
                自媒体矩阵
              </h2>
              <div className="space-y-2">
                {media.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.account}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {m.qrcode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => setPreviewQr({ title: m.name, image: m.qrcode })}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {m.link && (
                        <a href={m.link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            关注
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 联系方式 */}
          {contacts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Contact className="h-5 w-5 text-amber-500" />
                商务与技术联络
              </h2>
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl border bg-card flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.desc}</div>
                    </div>
                    {c.link && (
                      <a href={c.link} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="secondary" className="h-7 text-xs">
                          {c.action || '联系我们'}
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* 二维码预览弹窗 */}
      <Dialog open={previewQr !== null} onOpenChange={(open) => !open && setPreviewQr(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader>
            <DialogTitle>{previewQr?.title || '扫描二维码'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center justify-center">
            {previewQr?.image && (
              <img
                src={previewQr.image}
                alt={previewQr.title}
                className="w-48 h-48 object-contain rounded-xl border p-2 bg-white"
              />
            )}
            <p className="text-xs text-muted-foreground mt-3">使用微信或对应 App 扫码查看</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  RefreshCw,
  Download,
  ExternalLink,
  Star,
  GitFork,
  Tag,
  Calendar,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCode
} from 'lucide-react'

// 注册 dayjs 插件
dayjs.extend(relativeTime)

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  ACCELERATION_SOURCES,
  AccelerationSource,
  GithubRelease,
  GithubRepoDetails,
  parseGithubRepo
} from '@/lib/github-constants'
import { createClient } from '@/utils/supabase/client'

interface GithubSyncModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  softwareId: number
  softwareName?: string
  initialRepo?: string
  initialProxyPrefix?: string
  initialSourceId?: string
  onSyncComplete?: () => void
  onApplyRepoInfo?: (repoInfo: {
    description?: string
    officialWebsite?: string
    tags?: string[]
    filetype?: string
  }) => void
}

export default function GithubSyncModal({
  open,
  onOpenChange,
  softwareId,
  softwareName,
  initialRepo = '',
  initialProxyPrefix = 'https://ghproxy.net/',
  initialSourceId = 'ghproxy_net',
  onSyncComplete,
  onApplyRepoInfo
}: GithubSyncModalProps) {
  const { toast } = useToast()

  // 状态定义
  const [repoInput, setRepoInput] = useState(initialRepo)
  const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId)
  const [customProxyPrefix, setCustomProxyPrefix] = useState('')
  const [useProxyAsOfficial, setUseProxyAsOfficial] = useState(true)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [applyRepoInfoToSoftware, setApplyRepoInfoToSoftware] = useState(true)
  const [assetFilter, setAssetFilter] = useState('')

  // 数据状态
  const [fetching, setFetching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [repoDetails, setRepoDetails] = useState<GithubRepoDetails | null>(null)
  const [releases, setReleases] = useState<GithubRelease[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [syncSummary, setSyncSummary] = useState<{
    syncedCount: number
    updatedCount: number
    skippedCount: number
    message: string
  } | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  // 当前生效的加速前缀
  const currentPrefix =
    selectedSourceId === 'custom'
      ? customProxyPrefix
      : ACCELERATION_SOURCES.find(s => s.id === selectedSourceId)?.prefix || ''

  // 同步初始化值
  useEffect(() => {
    if (open) {
      if (initialRepo && !repoInput) {
        setRepoInput(initialRepo)
      }
      if (initialSourceId) {
        setSelectedSourceId(initialSourceId)
      }
      if (initialProxyPrefix && initialSourceId === 'custom') {
        setCustomProxyPrefix(initialProxyPrefix)
      }
      setSyncSummary(null)
    }
  }, [open, initialRepo, initialProxyPrefix, initialSourceId])

  // 当弹窗打开且有仓库地址时，自动拉取数据
  useEffect(() => {
    if (open && initialRepo && !repoDetails && !fetching) {
      handleFetchGithubData(initialRepo)
    }
  }, [open, initialRepo])

  // 拉取 GitHub 数据
  const handleFetchGithubData = async (customRepo?: string) => {
    const targetRepo = (customRepo || repoInput).trim()
    if (!targetRepo) {
      toast({
        variant: 'destructive',
        title: '请输入仓库地址',
        description: '例如: owner/repo 或 https://github.com/owner/repo',
      })
      return
    }

    const parsed = parseGithubRepo(targetRepo)
    if (!parsed) {
      toast({
        variant: 'destructive',
        title: '仓库地址格式错误',
        description: '请使用类似 owner/repo 或完整 GitHub URL 格式',
      })
      return
    }

    setFetching(true)
    setSyncSummary(null)

    try {
      const params = new URLSearchParams({
        repo: `${parsed.owner}/${parsed.repo}`,
        proxyPrefix: currentPrefix,
        sourceId: selectedSourceId,
        softwareId: softwareId.toString(),
      })

      if (assetFilter.trim()) {
        params.set('assetFilter', assetFilter.trim())
      }

      const res = await fetch(`${API_BASE_URL}/software/github?${params.toString()}`)
      const json = await res.json()

      if (json.success && json.data) {
        setRepoDetails(json.data.repoDetails)
        setReleases(json.data.releases || [])

        // 默认全选未同步的版本，或仅选最新版本
        const unSyncedTags = (json.data.releases || [])
          .filter((r: GithubRelease) => !r.existsInDb)
          .map((r: GithubRelease) => r.tagName)

        setSelectedTags(unSyncedTags.length > 0 ? unSyncedTags : (json.data.releases[0] ? [json.data.releases[0].tagName] : []))

        toast({
          title: '拉取成功',
          description: `成功获取仓库信息与 ${json.data.releases?.length || 0} 个 Release 版本`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: '获取失败',
          description: json.error || '无法拉取 GitHub 仓库信息',
        })
      }
    } catch (err: any) {
      console.error('Fetch github error:', err)
      toast({
        variant: 'destructive',
        title: '请求失败',
        description: err.message || '网络异常或连接超时',
      })
    } finally {
      setFetching(false)
    }
  }

  // 复制链接反馈
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast({
      title: '链接已复制',
      description: '下载链接已成功写入剪贴板',
    })
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  // 切换单个版本选中
  const toggleSelectTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(t => t !== tagName))
    } else {
      setSelectedTags([...selectedTags, tagName])
    }
  }

  // 全选/反选
  const handleToggleSelectAll = () => {
    if (selectedTags.length === releases.length) {
      setSelectedTags([])
    } else {
      setSelectedTags(releases.map(r => r.tagName))
    }
  }

  // 执行同步
  const handleExecuteSync = async (options: { latestOnly?: boolean } = {}) => {
    if (!repoDetails && !repoInput) {
      toast({ variant: 'destructive', title: '缺少仓库信息' })
      return
    }

    const { latestOnly = false } = options

    if (!latestOnly && selectedTags.length === 0) {
      toast({
        variant: 'destructive',
        title: '请至少选择一个待同步版本',
      })
      return
    }

    setSyncing(true)

    try {
      // 获取 Supabase 鉴权凭据
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const parsed = parseGithubRepo(repoInput)
      const targetRepo = parsed ? `${parsed.owner}/${parsed.repo}` : repoInput

      const payload = {
        softwareId,
        repo: targetRepo,
        proxyPrefix: currentPrefix,
        sourceId: selectedSourceId,
        useProxyAsOfficial,
        selectedTagNames: latestOnly ? undefined : selectedTags,
        syncLatestOnly: latestOnly,
        assetFilter: assetFilter.trim() || undefined,
        overwriteExisting,
        applyRepoInfo: applyRepoInfoToSoftware,
      }

      const res = await fetch(`${API_BASE_URL}/software/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (json.success && json.data) {
        setSyncSummary({
          syncedCount: json.data.syncedCount,
          updatedCount: json.data.updatedCount || 0,
          skippedCount: json.data.skippedCount,
          message: json.message || '同步完成',
        })

        toast({
          title: '同步成功',
          description: json.message || `已同步完成版本历史`,
        })

        // 重新拉取以刷新列表状态
        handleFetchGithubData()

        // 触发外部刷新回调
        onSyncComplete?.()

        // 若开启了应用仓库信息并提供了回调
        if (applyRepoInfoToSoftware && repoDetails && onApplyRepoInfo) {
          onApplyRepoInfo({
            description: repoDetails.description || undefined,
            officialWebsite: repoDetails.homepage || repoDetails.htmlUrl,
            tags: repoDetails.topics,
          })
        }
      } else {
        toast({
          variant: 'destructive',
          title: '同步失败',
          description: json.error || '执行同步时发生错误',
        })
      }
    } catch (err: any) {
      console.error('Execute sync error:', err)
      toast({
        variant: 'destructive',
        title: '请求失败',
        description: err.message || '执行同步异常',
      })
    } finally {
      setSyncing(false)
    }
  }

  // 一键将仓库信息填入软件表单
  const handleApplyRepoInfo = () => {
    if (!repoDetails) return
    if (onApplyRepoInfo) {
      onApplyRepoInfo({
        description: repoDetails.description || undefined,
        officialWebsite: repoDetails.homepage || repoDetails.htmlUrl,
        tags: repoDetails.topics,
      })
      toast({
        title: '已应用仓库信息',
        description: '已自动填入软件简介、官方主页及标签',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] bg-white dark:bg-[#161617]">
        {/* 头部区 */}
        <DialogHeader className="p-6 pb-4 border-b border-black/[0.04] dark:border-white/[0.06] bg-[#fafafc] dark:bg-[#1c1c1e]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 dark:bg-[#2997ff]/15 flex items-center justify-center text-[#0071e3] dark:text-[#2997ff]">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  从 GitHub 同步 {softwareName ? `- ${softwareName}` : ''}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5">
                  关联 GitHub 仓库，自动获取版本 Release、资产下载链接与国内镜像加速
                </DialogDescription>
              </div>
            </div>
            {repoDetails && (
              <Badge variant="outline" className="rounded-full px-3 py-1 font-mono text-xs border-black/[0.08] dark:border-white/[0.1]">
                {repoDetails.fullName}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* 主滚动区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 仓库与加速源配置区 */}
          <div className="p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#202022] border border-black/[0.04] dark:border-white/[0.06] space-y-4">
            <div className="grid gap-4 md:grid-cols-12">
              {/* GitHub 仓库地址 */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-[#515154] dark:text-[#a1a1a6] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> GitHub 仓库地址
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="如: owner/repo 或 https://github.com/owner/repo"
                    value={repoInput}
                    onChange={e => setRepoInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleFetchGithubData()}
                    className="h-9 rounded-xl bg-white dark:bg-[#161617] border-black/[0.08] dark:border-white/[0.1] text-sm"
                  />
                  <Button
                    onClick={() => handleFetchGithubData()}
                    disabled={fetching}
                    size="sm"
                    className="h-9 rounded-xl px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition-transform active:scale-95"
                  >
                    {fetching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    拉取
                  </Button>
                </div>
              </div>

              {/* 加速源选择 */}
              <div className="md:col-span-6 space-y-1.5">
                <label className="text-xs font-semibold text-[#515154] dark:text-[#a1a1a6] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> 下载镜像加速源
                </label>
                <Select
                  value={selectedSourceId}
                  onValueChange={val => {
                    setSelectedSourceId(val)
                    if (val !== 'custom') {
                      const src = ACCELERATION_SOURCES.find(s => s.id === val)
                      if (src) setCustomProxyPrefix(src.prefix)
                    }
                  }}
                >
                  <SelectTrigger className="h-9 rounded-xl bg-white dark:bg-[#161617] border-black/[0.08] dark:border-white/[0.1] text-sm">
                    <SelectValue placeholder="选择加速源" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ACCELERATION_SOURCES.map(source => (
                      <SelectItem key={source.id} value={source.id} className="text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{source.name}</span>
                          {source.prefix && (
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {source.prefix}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 自定义加速源前缀输入 */}
            {selectedSourceId === 'custom' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-[#515154] dark:text-[#a1a1a6]">
                  自定义加速源前缀 (需以 http:// 或 https:// 开头)
                </label>
                <Input
                  placeholder="例如: https://my-ghproxy.example.com/"
                  value={customProxyPrefix}
                  onChange={e => setCustomProxyPrefix(e.target.value)}
                  className="h-9 rounded-xl bg-white dark:bg-[#161617] text-sm"
                />
              </div>
            )}

            {/* 附加偏好选项 */}
            <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Switch
                  id="proxyOfficial"
                  checked={useProxyAsOfficial}
                  onCheckedChange={setUseProxyAsOfficial}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
                <label htmlFor="proxyOfficial" className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  加速链接设为主下载源
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="overwrite"
                  checked={overwriteExisting}
                  onCheckedChange={setOverwriteExisting}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
                <label htmlFor="overwrite" className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  覆盖已存在的相同版本
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="applyRepo"
                  checked={applyRepoInfoToSoftware}
                  onCheckedChange={setApplyRepoInfoToSoftware}
                  className="data-[state=checked]:bg-[#0071e3]"
                />
                <label htmlFor="applyRepo" className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7] cursor-pointer">
                  同步简介与主页到软件
                </label>
              </div>
            </div>
          </div>

          {/* 同步结果提示卡片 */}
          {syncSummary && (
            <Alert className="rounded-2xl border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                同步执行完成
              </AlertTitle>
              <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                {syncSummary.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 仓库信息与 Release 列表展示 */}
          {repoDetails ? (
            <Tabs defaultValue="releases" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList className="rounded-xl p-1 bg-[#f5f5f7] dark:bg-[#202022]">
                  <TabsTrigger value="releases" className="rounded-lg text-xs font-medium px-3 py-1.5">
                    Release 版本 ({releases.length})
                  </TabsTrigger>
                  <TabsTrigger value="info" className="rounded-lg text-xs font-medium px-3 py-1.5">
                    仓库资料
                  </TabsTrigger>
                </TabsList>

                {onApplyRepoInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyRepoInfo}
                    className="h-8 rounded-full text-xs font-medium border-black/[0.08] dark:border-white/[0.1] hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    填入当前表单
                  </Button>
                )}
              </div>

              {/* Releases 列表视图 */}
              <TabsContent value="releases" className="space-y-4 m-0">
                {/* 顶部操作条 */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#f5f5f7]/60 dark:bg-[#202022]/60 text-xs">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSelectAll}
                      className="h-7 px-2.5 text-xs font-medium rounded-lg"
                    >
                      {selectedTags.length === releases.length ? '取消全选' : '全选所有版本'}
                    </Button>
                    <span className="text-[#86868b] dark:text-[#a1a1a6]">
                      已选中 <strong className="text-[#1d1d1f] dark:text-[#f5f5f7]">{selectedTags.length}</strong> / {releases.length} 个版本
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncing || releases.length === 0}
                      onClick={() => handleExecuteSync({ latestOnly: true })}
                      className="h-7 px-3 text-xs rounded-full font-medium"
                    >
                      仅同步最新版
                    </Button>
                    <Button
                      size="sm"
                      disabled={syncing || selectedTags.length === 0}
                      onClick={() => handleExecuteSync({ latestOnly: false })}
                      className="h-7 px-3.5 text-xs rounded-full font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm"
                    >
                      {syncing ? (
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Download className="w-3 h-3 mr-1" />
                      )}
                      批量同步勾选版本 ({selectedTags.length})
                    </Button>
                  </div>
                </div>

                {/* 列表内容 */}
                {releases.length === 0 ? (
                  <div className="text-center py-12 text-[#86868b] text-sm">
                    未在 GitHub 仓库中找到任何 Release 版本
                  </div>
                ) : (
                  <div className="space-y-3">
                    {releases.map((rel, idx) => {
                      const isSelected = selectedTags.includes(rel.tagName)
                      const isExpanded = !!expandedNotes[rel.tagName]
                      const primaryAsset = rel.primaryAsset || rel.assets[0]

                      return (
                        <div
                          key={rel.id}
                          className={`rounded-2xl border p-4 transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-[#0071e3]/30 shadow-sm'
                              : 'bg-white dark:bg-[#1c1c1e] border-black/[0.04] dark:border-white/[0.06] hover:border-black/[0.08]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`rel-${rel.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectTag(rel.tagName)}
                                className="mt-1 data-[state=checked]:bg-[#0071e3] data-[state=checked]:border-[#0071e3]"
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-base text-[#1d1d1f] dark:text-[#f5f5f7]">
                                    {rel.name || rel.tagName}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="rounded-full font-mono text-xs bg-black/5 dark:bg-white/10"
                                  >
                                    {rel.tagName}
                                  </Badge>

                                  {idx === 0 && (
                                    <Badge className="rounded-full text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                                      最新 Release
                                    </Badge>
                                  )}

                                  {rel.isPrerelease && (
                                    <Badge variant="outline" className="rounded-full text-[11px] text-amber-600 border-amber-400">
                                      预发布版
                                    </Badge>
                                  )}

                                  {rel.existsInDb ? (
                                    <Badge variant="outline" className="rounded-full text-[11px] text-emerald-600 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                                      系统已存在
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="rounded-full text-[11px] text-blue-600 border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                                      待同步
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-[#86868b] dark:text-[#a1a1a6]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {dayjs(rel.publishedAt).fromNow()} ({dayjs(rel.publishedAt).format('YYYY-MM-DD')})
                                  </span>
                                  <span>•</span>
                                  <span>{rel.assets.length} 个资产文件</span>
                                  <span>•</span>
                                  <a
                                    href={rel.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[#0071e3] flex items-center gap-0.5"
                                  >
                                    GitHub 原文 <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* 单版本同步按钮 */}
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={syncing}
                              onClick={() => {
                                setSelectedTags([rel.tagName])
                                handleExecuteSync({ latestOnly: false })
                              }}
                              className="h-8 px-3 rounded-full text-xs hover:bg-[#0071e3]/10 hover:text-[#0071e3]"
                            >
                              单独同步
                            </Button>
                          </div>

                          {/* 首选资产与加速链接预览 */}
                          {primaryAsset && (
                            <div className="mt-3 p-3 rounded-xl bg-[#f5f5f7] dark:bg-[#262628] border border-black/[0.03] dark:border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileCode className="w-4 h-4 text-[#0071e3] shrink-0" />
                                <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                                  {primaryAsset.name}
                                </span>
                                <Badge variant="secondary" className="rounded-md font-mono text-[10px] px-1.5 py-0 shrink-0">
                                  {primaryAsset.sizeFormatted}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(useProxyAsOfficial ? primaryAsset.acceleratedUrl : primaryAsset.downloadUrl)}
                                  className="h-7 px-2 text-[11px] rounded-lg"
                                >
                                  {copiedUrl === (useProxyAsOfficial ? primaryAsset.acceleratedUrl : primaryAsset.downloadUrl) ? (
                                    <Check className="w-3 h-3 text-emerald-500 mr-1" />
                                  ) : (
                                    <Copy className="w-3 h-3 mr-1" />
                                  )}
                                  复制链接
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  asChild
                                  className="h-7 px-2.5 text-[11px] rounded-lg"
                                >
                                  <a
                                    href={useProxyAsOfficial ? primaryAsset.acceleratedUrl : primaryAsset.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    下载测试
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* 更新日志折叠展开 */}
                          {rel.body && (
                            <div className="mt-2.5">
                              <button
                                type="button"
                                onClick={() => setExpandedNotes({ ...expandedNotes, [rel.tagName]: !isExpanded })}
                                className="text-xs text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] flex items-center gap-1 font-medium"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" /> 收起更新日志
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" /> 查看更新日志
                                  </>
                                )}
                              </button>
                              {isExpanded && (
                                <div className="mt-2 p-3 rounded-xl bg-[#fbfbfd] dark:bg-[#121213] border border-black/[0.04] dark:border-white/[0.06] text-xs text-[#515154] dark:text-[#a1a1a6] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                                  {rel.body}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* 仓库基本资料视图 */}
              <TabsContent value="info" className="space-y-4 m-0">
                <div className="p-5 rounded-2xl bg-[#f5f5f7] dark:bg-[#202022] border border-black/[0.04] dark:border-white/[0.06] space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">全名 / 标识</p>
                      <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {repoDetails.fullName}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">开源协议</p>
                      <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {repoDetails.license || '未指定'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">项目官网 / 主页</p>
                      {repoDetails.homepage ? (
                        <a
                          href={repoDetails.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#0071e3] hover:underline flex items-center gap-1"
                        >
                          {repoDetails.homepage} <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-sm text-[#86868b]">-</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-[#86868b] dark:text-[#a1a1a6]">GitHub 链接</p>
                      <a
                        href={repoDetails.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0071e3] hover:underline flex items-center gap-1"
                      >
                        {repoDetails.htmlUrl} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs text-[#515154] dark:text-[#a1a1a6]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>{repoDetails.stars.toLocaleString()} Stars</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <GitFork className="w-4 h-4" />
                      <span>{repoDetails.forks.toLocaleString()} Forks</span>
                    </div>
                  </div>

                  {repoDetails.description && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-medium text-[#86868b] dark:text-[#a1a1a6]">项目简介</p>
                      <p className="text-sm text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">
                        {repoDetails.description}
                      </p>
                    </div>
                  )}

                  {repoDetails.topics.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-medium text-[#86868b] dark:text-[#a1a1a6]">仓库主题标签</p>
                      <div className="flex flex-wrap gap-1.5">
                        {repoDetails.topics.map(t => (
                          <Badge key={t} variant="secondary" className="rounded-full text-xs font-medium">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-black/[0.08] dark:border-white/[0.1] bg-[#fafafc] dark:bg-[#1c1c1e]/50">
              <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mx-auto text-[#86868b]">
                <Download className="w-6 h-6" />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                准备拉取 GitHub 数据
              </h4>
              <p className="mt-1 text-xs text-[#86868b] dark:text-[#a1a1a6] max-w-sm mx-auto">
                输入 GitHub 仓库名并点击“拉取”按钮，系统将自动检索发布版本并生成加速下载链接
              </p>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <DialogFooter className="p-4 px-6 border-t border-black/[0.04] dark:border-white/[0.06] bg-[#fafafc] dark:bg-[#1c1c1e] flex items-center justify-between">
          <div className="text-xs text-[#86868b] dark:text-[#a1a1a6]">
            {repoDetails ? (
              <span>
                当前加速源: <strong className="text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">{ACCELERATION_SOURCES.find(s => s.id === selectedSourceId)?.name || '自定义'}</strong>
              </span>
            ) : (
              <span>支持全系列 GitHub 公开仓库与 Release 资源</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-5 text-xs font-medium"
            >
              关闭
            </Button>
            {releases.length > 0 && (
              <Button
                onClick={() => handleExecuteSync({ latestOnly: false })}
                disabled={syncing || selectedTags.length === 0}
                className="rounded-full px-6 text-xs font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm transition-transform active:scale-95"
              >
                {syncing && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                开始同步 ({selectedTags.length})
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

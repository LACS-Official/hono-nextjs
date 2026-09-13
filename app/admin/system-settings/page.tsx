'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Database,
  Shield,
  FileText,
  Bell,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  History,
  ShieldAlert,
  Monitor,
  Smartphone,
  Laptop,
  Globe,
  MoreHorizontal,
  Sliders,
  Mail,
  HardDrive,
  Activity,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Github,
  Copy,
  Check,
  ExternalLink,
  Key,
  Terminal,
  Zap
} from 'lucide-react'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dayjs from 'dayjs'

const categoryConfig: Record<string, { name: string; icon: React.ReactNode }> = {
  display: { name: '显示外观', icon: <Monitor className="h-4 w-4" /> },
  security: { name: '安全访问', icon: <Shield className="h-4 w-4" /> },
  api: { name: '网络API', icon: <Globe className="h-4 w-4" /> },
  notification: { name: '邮件通知', icon: <Bell className="h-4 w-4" /> },
  database: { name: '数据维护', icon: <Database className="h-4 w-4" /> },
  system: { name: '系统配置', icon: <Settings className="h-4 w-4" /> },
  logging: { name: '日志配置', icon: <FileText className="h-4 w-4" /> },
  other: { name: '其他配置', icon: <Settings className="h-4 w-4" /> }
}

interface SystemSetting {
  id: string
  category: string
  key: string
  value: string
  description: string
  type: string
  isSecret: boolean
  isRequired: boolean
  validationRules: any
  createdAt: string
  updatedAt: string
  updatedBy: string
}

interface AuditLog {
  id: string
  settingId: string
  action: string
  oldValue: string
  newValue: string
  reason: string
  userId: string
  timestamp: string
  settingKey: string
  settingCategory: string
}

interface LoginLog {
  id: string
  userId: string
  email: string
  ipAddress: string
  userAgent: string
  loginTime: string
  isActive: boolean
  deviceInfo: {
    device: { type: string; model: string; vendor: string }
    os: { name: string; version: string }
    browser: { name: string; version: string }
  }
}

interface AppConfigState {
  compactMode: boolean
  enableAnimations: boolean
  defaultPageSize: string
  maskSensitiveData: boolean
  systemTitle: string

  enableApiKeyAuth: boolean
  enableRateLimiting: boolean
  enableStrictUserAgent: boolean
  enableRequestSignature: boolean
  apiKeyExpirationHours: string
  jwtExpirationHours: string

  allowedOrigins: string[]

  // GitHub 与外部集成
  githubToken: string
  cronSecret: string

  mailProvider: string
  resendApiKey: string
  resendFrom: string
  smtpHost: string
  smtpPort: string
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  smtpFrom: string
  notifySuspiciousLogin: boolean
  notifyDailyDigest: boolean

  autoCleanupExpiredCodes: boolean
  logRetentionDays: string
}

const defaultAppConfig: AppConfigState = {
  compactMode: false,
  enableAnimations: true,
  defaultPageSize: '20',
  maskSensitiveData: true,
  systemTitle: '玩机管家管理后台',

  enableApiKeyAuth: true,
  enableRateLimiting: true,
  enableStrictUserAgent: false,
  enableRequestSignature: false,
  apiKeyExpirationHours: '24',
  jwtExpirationHours: '24',

  allowedOrigins: ['https://admin.lacs.cc', 'http://localhost:29351', 'http://localhost:3000'],

  githubToken: '',
  cronSecret: '',

  mailProvider: 'resend',
  resendApiKey: '',
  resendFrom: '玩机管家 <onboarding@resend.dev>',
  smtpHost: 'smtp.qq.com',
  smtpPort: '465',
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  notifySuspiciousLogin: true,
  notifyDailyDigest: false,

  autoCleanupExpiredCodes: true,
  logRetentionDays: '30'
}

export default function SystemSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('app-preferences')
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [dbHealthStatus, setDbHealthStatus] = useState<'checking' | 'healthy' | 'error'>('healthy')
  const [dbLatency, setDbLatency] = useState<number | null>(null)

  // 审计与登录日志
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loginLogsLoading, setLoginLogsLoading] = useState(false)
  
  // 对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [blockTarget, setBlockTarget] = useState<{ type: 'ip' | 'device'; value: string; label: string } | null>(null)
  const [blockReason, setBlockReason] = useState('')

  // 原始设置添加弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newSettingKey, setNewSettingKey] = useState('')
  const [newSettingCategory, setNewSettingCategory] = useState('system')
  const [newSettingValue, setNewSettingValue] = useState('')
  const [newSettingDesc, setNewSettingDesc] = useState('')
  const [newSettingType, setNewSettingType] = useState('string')

  // UI 配置状态
  const [appConfig, setAppConfig] = useState<AppConfigState>(defaultAppConfig)
  const [newOriginInput, setNewOriginInput] = useState('')

  // GitHub 测试与同步状态
  const [testingGithubToken, setTestingGithubToken] = useState(false)
  const [githubQuota, setGithubQuota] = useState<{
    hasToken: boolean
    limit: number
    remaining: number
    resetTime: string | null
    user: string | null
  } | null>(null)
  const [triggeringSync, setTriggeringSync] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const handleTestGithubToken = async (tokenOverride?: string) => {
    setTestingGithubToken(true)
    try {
      const res = await fetch('/api/system-settings/test-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenOverride !== undefined ? tokenOverride : appConfig.githubToken }),
      })
      const result = await res.json()
      if (result.success && result.data) {
        setGithubQuota(result.data)
        toast({
          title: "GitHub 配额检测成功",
          description: result.message || `当前剩余配额: ${result.data.remaining}/${result.data.limit}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "检测失败",
          description: result.error || "无法验证 GitHub Token",
        })
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: e.message || "无法连接 GitHub 验证服务",
      })
    } finally {
      setTestingGithubToken(false)
    }
  }

  const handleTriggerGithubSync = async () => {
    setTriggeringSync(true)
    try {
      const url = appConfig.cronSecret ? `/api/cron/github-sync?token=${encodeURIComponent(appConfig.cronSecret)}` : '/api/cron/github-sync'
      const res = await fetch(url)
      const result = await res.json()
      if (result.success) {
        const total = result.totalSoftware ?? result.total ?? 0
        const synced = result.syncedSoftware ?? result.successCount ?? 0
        const added = result.totalVersionsAdded ?? result.newVersionsCount ?? 0
        toast({
          title: "GitHub 批量同步执行完成",
          description: `扫描 ${total} 款关联 GitHub 的软件，已同步 ${synced} 款，入库 ${added} 个新版本`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "同步失败",
          description: result.error || "未能完成软件批量同步",
        })
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: e.message || "请求自动同步接口超时",
      })
    } finally {
      setTriggeringSync(false)
    }
  }

  const handleGenerateCronSecret = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let randomStr = ''
    for (let i = 0; i < 24; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    const generated = `lacs_cron_${randomStr}`
    setAppConfig(prev => ({ ...prev, cronSecret: generated }))
    toast({
      title: "已生成随机 Secret",
      description: "请点击「保存」以持久化并生效",
    })
  }

  const handleCopyText = (text: string, type: 'command' | 'secret') => {
    if (!text) return
    navigator.clipboard.writeText(text)
    if (type === 'command') {
      setCopiedCommand(true)
      setTimeout(() => setCopiedCommand(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
    toast({ title: "已复制到剪贴板" })
  }

  // 邮件测试与保存状态
  const [testEmailTarget, setTestEmailTarget] = useState('')
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [savingEmailSettings, setSavingEmailSettings] = useState(false)

  // 快捷预设填充
  const applySmtpPreset = (preset: 'qq' | '163' | 'gmail' | 'aliyun') => {
    switch (preset) {
      case 'qq':
        setAppConfig(prev => ({
          ...prev,
          smtpHost: 'smtp.qq.com',
          smtpPort: '465',
          smtpSecure: true,
        }))
        toast({ title: "已应用 QQ 邮箱参数预设", description: "主机: smtp.qq.com, 端口: 465, SSL 加密" })
        break
      case '163':
        setAppConfig(prev => ({
          ...prev,
          smtpHost: 'smtp.163.com',
          smtpPort: '465',
          smtpSecure: true,
        }))
        toast({ title: "已应用 163 邮箱参数预设", description: "主机: smtp.163.com, 端口: 465, SSL 加密" })
        break
      case 'gmail':
        setAppConfig(prev => ({
          ...prev,
          smtpHost: 'smtp.gmail.com',
          smtpPort: '465',
          smtpSecure: true,
        }))
        toast({ title: "已应用 Gmail 参数预设", description: "主机: smtp.gmail.com, 端口: 465, SSL 加密" })
        break
      case 'aliyun':
        setAppConfig(prev => ({
          ...prev,
          smtpHost: 'smtp.mxhichina.com',
          smtpPort: '465',
          smtpSecure: true,
        }))
        toast({ title: "已应用阿里云企业邮预设", description: "主机: smtp.mxhichina.com, 端口: 465, SSL 加密" })
        break
    }
  }

  // 批量保存所有邮件设置
  const handleSaveEmailSettings = async () => {
    setSavingEmailSettings(true)
    try {
      const itemsToSave = [
        { key: 'mail_provider', value: appConfig.mailProvider, desc: '发信通道模式', type: 'string' as const },
        { key: 'resend_api_key', value: appConfig.resendApiKey, desc: 'Resend API Key', type: 'string' as const },
        { key: 'resend_from', value: appConfig.resendFrom, desc: 'Resend 发件人', type: 'string' as const },
        { key: 'smtp_host', value: appConfig.smtpHost, desc: 'SMTP 主机', type: 'string' as const },
        { key: 'smtp_port', value: appConfig.smtpPort, desc: 'SMTP 端口', type: 'number' as const },
        { key: 'smtp_secure', value: String(appConfig.smtpSecure), desc: 'SMTP SSL加密', type: 'boolean' as const },
        { key: 'smtp_user', value: appConfig.smtpUser, desc: 'SMTP 账号', type: 'string' as const },
        { key: 'smtp_pass', value: appConfig.smtpPass, desc: 'SMTP 授权码', type: 'string' as const },
        { key: 'smtp_from', value: appConfig.smtpFrom, desc: 'SMTP 发信签名', type: 'string' as const },
        { key: 'notify_suspicious_login', value: String(appConfig.notifySuspiciousLogin), desc: '异地登录告警', type: 'boolean' as const },
      ]

      for (const item of itemsToSave) {
        await persistSettingItem(item.key, item.value, 'notification', item.desc, item.type)
      }

      toast({
        title: "邮件与通知设置已保存",
        description: "发信通道配置已成功更新并即时生效",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: err.message || "未能完全保存邮件设置，请重试",
      })
    } finally {
      setSavingEmailSettings(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim() || !testEmailTarget.includes('@')) {
      toast({
        variant: "destructive",
        title: "邮箱格式错误",
        description: "请输入接收测试邮件的有效邮箱地址",
      })
      return
    }

    setTestEmailSending(true)
    try {
      const res = await fetch('/api/system-settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: testEmailTarget.trim(),
          provider: appConfig.mailProvider,
          resendApiKey: appConfig.resendApiKey,
          resendFrom: appConfig.resendFrom,
          smtpHost: appConfig.smtpHost,
          smtpPort: appConfig.smtpPort,
          smtpSecure: appConfig.smtpSecure,
          smtpUser: appConfig.smtpUser,
          smtpPass: appConfig.smtpPass,
          smtpFrom: appConfig.smtpFrom,
        }),
      })
      const result = await res.json()

      if (result.success) {
        toast({
          title: "测试邮件发送成功！",
          description: result.message || "测试邮件已成功投递至您的收件箱",
        })
      } else {
        toast({
          variant: "destructive",
          title: "发信测试未通过",
          description: result.error || "发信失败，请检查通道密钥与发件人域名配置",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: err.message || "网络错误，无法连接发信测试服务",
      })
    } finally {
      setTestEmailSending(false)
    }
  }

  // 从 localStorage 与数据库同步初始配置
  useEffect(() => {
    try {
      const localCompact = localStorage.getItem('admin_compact_mode')
      const localAnim = localStorage.getItem('admin_enable_animations')
      const localPageSize = localStorage.getItem('admin_default_page_size')
      const localMask = localStorage.getItem('admin_mask_sensitive_data')
      const localTitle = localStorage.getItem('admin_system_title')

      setAppConfig(prev => ({
        ...prev,
        compactMode: localCompact !== null ? localCompact === 'true' : prev.compactMode,
        enableAnimations: localAnim !== null ? localAnim === 'true' : prev.enableAnimations,
        defaultPageSize: localPageSize || prev.defaultPageSize,
        maskSensitiveData: localMask !== null ? localMask === 'true' : prev.maskSensitiveData,
        systemTitle: localTitle || prev.systemTitle,
      }))
    } catch {}
  }, [])

  // 数据库记录同步至 appConfig
  useEffect(() => {
    if (settings.length === 0) return

    setAppConfig(prev => {
      const next = { ...prev }
      settings.forEach(s => {
        switch (s.key) {
          case 'compact_mode':
            next.compactMode = s.value === 'true'
            break
          case 'enable_animations':
            next.enableAnimations = s.value === 'true'
            break
          case 'default_page_size':
            next.defaultPageSize = s.value || '20'
            break
          case 'mask_sensitive_data':
            next.maskSensitiveData = s.value === 'true'
            break
          case 'system_title':
            next.systemTitle = s.value || prev.systemTitle
            break
          case 'enable_api_key_auth':
            next.enableApiKeyAuth = s.value === 'true'
            break
          case 'enable_rate_limiting':
            next.enableRateLimiting = s.value === 'true'
            break
          case 'enable_strict_user_agent':
            next.enableStrictUserAgent = s.value === 'true'
            break
          case 'enable_request_signature':
            next.enableRequestSignature = s.value === 'true'
            break
          case 'api_key_expiration_hours':
            next.apiKeyExpirationHours = s.value || '24'
            break
          case 'jwt_expiration_hours':
            next.jwtExpirationHours = s.value || '24'
            break
          case 'allowed_origins':
            try {
              next.allowedOrigins = s.value ? s.value.split(',').map(v => v.trim()).filter(Boolean) : prev.allowedOrigins
            } catch {}
            break
          case 'mail_provider':
            next.mailProvider = s.value || 'resend'
            break
          case 'resend_api_key':
            next.resendApiKey = s.value || ''
            break
          case 'resend_from':
            next.resendFrom = s.value || '玩机管家 <onboarding@resend.dev>'
            break
          case 'smtp_host':
            next.smtpHost = s.value || 'smtp.qq.com'
            break
          case 'smtp_port':
            next.smtpPort = s.value || '465'
            break
          case 'smtp_secure':
            next.smtpSecure = s.value === 'true'
            break
          case 'smtp_user':
            next.smtpUser = s.value || ''
            break
          case 'smtp_pass':
            next.smtpPass = s.value || ''
            break
          case 'smtp_from':
            next.smtpFrom = s.value || ''
            break
          case 'notify_suspicious_login':
            next.notifySuspiciousLogin = s.value === 'true'
            break
          case 'notify_daily_digest':
            next.notifyDailyDigest = s.value === 'true'
            break
          case 'auto_cleanup_expired_codes':
            next.autoCleanupExpiredCodes = s.value === 'true'
            break
          case 'log_retention_days':
            next.logRetentionDays = s.value || '30'
            break
          case 'github_token':
            next.githubToken = s.value || ''
            break
          case 'cron_secret':
            next.cronSecret = s.value || ''
            break
        }
      })
      return next
    })
  }, [settings])

  // 本地持久化与即时生效
  const applyFrontendSetting = (key: string, value: any) => {
    try {
      switch (key) {
        case 'compact_mode':
          localStorage.setItem('admin_compact_mode', String(value))
          window.dispatchEvent(new CustomEvent('admin_setting_change', { detail: { key: 'compact_mode', value } }))
          break
        case 'enable_animations':
          localStorage.setItem('admin_enable_animations', String(value))
          if (!value) {
            document.documentElement.classList.add('reduce-motion')
          } else {
            document.documentElement.classList.remove('reduce-motion')
          }
          break
        case 'default_page_size':
          localStorage.setItem('admin_default_page_size', String(value))
          break
        case 'mask_sensitive_data':
          localStorage.setItem('admin_mask_sensitive_data', String(value))
          break
        case 'system_title':
          localStorage.setItem('admin_system_title', String(value))
          document.title = String(value)
          window.dispatchEvent(new CustomEvent('admin_setting_change', { detail: { key: 'system_title', value } }))
          break
      }
    } catch {}
  }

  // 保存设置并即时同步到后端与运行时
  const persistSettingItem = async (
    key: string,
    value: string,
    category: string,
    description: string,
    type: 'string' | 'boolean' | 'number' = 'string'
  ) => {
    setSavingKey(key)
    applyFrontendSetting(key, value === 'true' ? true : value === 'false' ? false : value)

    try {
      const existing = settings.find(s => s.key === key)
      let res: Response

      if (existing) {
        res = await fetch(`/api/system-settings/${existing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value,
            description: description || existing.description,
            type,
          })
        })
      } else {
        res = await fetch('/api/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            key,
            value,
            description,
            type,
            isRequired: false,
            isSecret: false,
          })
        })
      }

      const result = await res.json()
      if (result.success) {
        toast({
          title: "配置已生效",
          description: `${description} 已更新并同步至系统`,
        })
        fetchSettings()
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "配置更新失败",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "请求异常",
        description: "网络错误或后端数据库无响应",
      })
    } finally {
      setSavingKey(null)
    }
  }

  const fetchSettings = async () => {
    setLoading(true)
    try {
      let url = '/api/system-settings?page=1&limit=100'
      if (searchText) {
        url += '&search=' + encodeURIComponent(searchText)
      }
      if (selectedCategory && selectedCategory !== 'all') {
        url += '&category=' + encodeURIComponent(selectedCategory)
      }
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setSettings(result.data.settings || [])
      }
    } catch (error) {
      console.error('获取系统设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true)
    try {
      const response = await fetch('/api/system-settings/audit-log')
      const result = await response.json()
      if (result.success) {
        setAuditLogs(result.data.auditLogs || [])
      }
    } catch (error) {
      console.error('获取审计日志失败:', error)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  const fetchLoginLogs = async () => {
    setLoginLogsLoading(true)
    try {
      const response = await fetch('/api/login-logs?page=1&limit=50')
      const result = await response.json()
      if (result.success) {
        setLoginLogs(result.data.logs || [])
      }
    } catch (error) {
      console.error('获取登录日志失败:', error)
    } finally {
      setLoginLogsLoading(false)
    }
  }

  const handleDeleteSetting = async (id: string) => {
    try {
      const response = await fetch(`/api/system-settings/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) {
        toast({ title: "删除成功", description: "配置项已移除" })
        fetchSettings()
      } else {
        toast({ variant: "destructive", title: "删除失败", description: result.error })
      }
    } catch {
      toast({ variant: "destructive", title: "请求失败", description: "服务器无响应" })
    }
  }

  const handleBlockAction = async () => {
    if (!blockTarget) return
    try {
      const response = await fetch('/api/system-settings/blocked-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: blockTarget.type,
          value: blockTarget.value,
          reason: blockReason || '管理员手动拉黑'
        })
      })
      const result = await response.json()
      if (result.success) {
        toast({
          title: "拉黑成功",
          description: `已拦截目标: ${blockTarget.label}`,
        })
        setBlockDialogOpen(false)
        setBlockTarget(null)
        setBlockReason('')
      } else {
        toast({ variant: "destructive", title: "拉黑失败", description: result.error })
      }
    } catch {
      toast({ variant: "destructive", title: "请求失败", description: "服务器无响应" })
    }
  }

  const handleCreateRawSetting = async () => {
    if (!newSettingKey.trim()) {
      toast({ variant: "destructive", title: "输入错误", description: "键名不能为空" })
      return
    }
    try {
      const res = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newSettingCategory,
          key: newSettingKey.trim(),
          value: newSettingValue,
          description: newSettingDesc,
          type: newSettingType,
          isRequired: false,
          isSecret: false,
        })
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "已新增配置", description: newSettingKey })
        setCreateModalOpen(false)
        setNewSettingKey('')
        setNewSettingValue('')
        setNewSettingDesc('')
        fetchSettings()
      } else {
        toast({ variant: "destructive", title: "新增失败", description: result.error })
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "请求异常", description: e.message })
    }
  }

  const checkDatabaseHealth = async () => {
    setDbHealthStatus('checking')
    const start = Date.now()
    try {
      const res = await fetch('/api/system-settings?limit=1')
      const data = await res.json()
      const latency = Date.now() - start
      setDbLatency(latency)
      if (data.success) {
        setDbHealthStatus('healthy')
        toast({
          title: "数据库连通正常",
          description: `响应延迟: ${latency}ms`,
        })
      } else {
        setDbHealthStatus('error')
      }
    } catch {
      setDbHealthStatus('error')
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0) fetchAuditLogs()
    if (activeTab === 'login-logs' && loginLogs.length === 0) fetchLoginLogs()
  }, [activeTab])

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4 text-blue-500" />
      case 'tablet': return <Laptop className="h-4 w-4 text-purple-500" />
      default: return <Monitor className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1400px] mx-auto">
      {/* 顶部导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>系统设置</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.05] dark:border-white/[0.08] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            系统设置
          </h2>
          <p className="text-xs text-[#6e6e73] dark:text-[#a1a1a6] mt-1">
            管理界面显示、接口鉴权、安全防护、网络跨域及系统维护参数
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            配置即时同步
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
            className="rounded-xl h-8 text-xs px-3"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 主 Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-black/[0.03] dark:bg-white/[0.05] p-1 rounded-2xl flex flex-wrap h-auto gap-1 border border-black/[0.03] dark:border-white/[0.05]">
          <TabsTrigger
            value="app-preferences"
            className="rounded-xl px-4 py-2 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e20] data-[state=active]:text-[#0071e3] dark:data-[state=active]:text-[#2997ff] data-[state=active]:shadow-sm"
          >
            <Sliders className="mr-1.5 h-3.5 w-3.5" />
            基础设置
          </TabsTrigger>
          <TabsTrigger
            value="login-logs"
            className="rounded-xl px-4 py-2 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e20] data-[state=active]:text-[#0071e3] dark:data-[state=active]:text-[#2997ff] data-[state=active]:shadow-sm"
          >
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
            登录日志
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-xl px-4 py-2 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e20] data-[state=active]:text-[#0071e3] dark:data-[state=active]:text-[#2997ff] data-[state=active]:shadow-sm"
          >
            <History className="mr-1.5 h-3.5 w-3.5" />
            审计日志
          </TabsTrigger>
          <TabsTrigger
            value="raw-settings"
            className="rounded-xl px-4 py-2 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e1e20] data-[state=active]:text-[#0071e3] dark:data-[state=active]:text-[#2997ff] data-[state=active]:shadow-sm"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            底层键值表
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* 一行双卡片网格布局 (grid-cols-1 lg:grid-cols-2) */}
        {/* ========================================================================= */}
        <TabsContent value="app-preferences" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            
            {/* 卡片 1: 显示与界面外观 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Monitor className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      显示与界面
                    </CardTitle>
                    <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                      调整页面信息密度、过渡动效与表格参数
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {/* 紧凑列表 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">紧凑布局模式</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">缩小表格行高与边距，增加单屏数据量</div>
                  </div>
                  <Switch
                    checked={appConfig.compactMode}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, compactMode: val }))
                      persistSettingItem('compact_mode', String(val), 'display', '紧凑布局模式', 'boolean')
                    }}
                  />
                </div>

                {/* 界面动效 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">界面过渡动效</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">开启页面与弹窗微动效，关闭可减小图形负载</div>
                  </div>
                  <Switch
                    checked={appConfig.enableAnimations}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, enableAnimations: val }))
                      persistSettingItem('enable_animations', String(val), 'display', '界面过渡动效', 'boolean')
                    }}
                  />
                </div>

                {/* 默认分页条数 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">默认每页条数</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">数据列表初次拉取的默认数量</div>
                  </div>
                  <Select
                    value={appConfig.defaultPageSize}
                    onValueChange={(val) => {
                      setAppConfig(prev => ({ ...prev, defaultPageSize: val }))
                      persistSettingItem('default_page_size', val, 'display', '默认每页条数', 'number')
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="10">10 条</SelectItem>
                      <SelectItem value="20">20 条</SelectItem>
                      <SelectItem value="50">50 条</SelectItem>
                      <SelectItem value="100">100 条</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 敏感信息脱敏 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">敏感信息掩码</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">默认隐藏 API Key 与 Token 凭证</div>
                  </div>
                  <Switch
                    checked={appConfig.maskSensitiveData}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, maskSensitiveData: val }))
                      persistSettingItem('mask_sensitive_data', String(val), 'display', '敏感信息掩码', 'boolean')
                    }}
                  />
                </div>

                {/* 系统标题 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2.5">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">系统标识标题</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">后台导航与网页标签页标题</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={appConfig.systemTitle}
                      onChange={(e) => setAppConfig(prev => ({ ...prev, systemTitle: e.target.value }))}
                      className="w-[160px] h-8 rounded-lg text-xs"
                      placeholder="系统标题"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs px-2.5"
                      onClick={() => persistSettingItem('system_title', appConfig.systemTitle, 'display', '系统标识标题', 'string')}
                      disabled={savingKey === 'system_title'}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 卡片 2: 安全与访问控制 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      安全与访问控制
                    </CardTitle>
                    <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                      接口密钥鉴权、调用频率限制与防重放签名保护
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {/* API Key 鉴权 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">API Key 强制验证</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">生成激活码等写操作必须在 Header 携带有效 Key</div>
                  </div>
                  <Switch
                    checked={appConfig.enableApiKeyAuth}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, enableApiKeyAuth: val }))
                      persistSettingItem('enable_api_key_auth', String(val), 'security', 'API Key 强制验证', 'boolean')
                    }}
                  />
                </div>

                {/* 速率限制 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">接口频率限制</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">限制单个 IP 每分钟的最高请求频次</div>
                  </div>
                  <Switch
                    checked={appConfig.enableRateLimiting}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, enableRateLimiting: val }))
                      persistSettingItem('enable_rate_limiting', String(val), 'security', '接口频率限制', 'boolean')
                    }}
                  />
                </div>

                {/* 严格 User-Agent 校验 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">严格 User-Agent 校验</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">仅放行正版桌面客户端的 UA 请求</div>
                  </div>
                  <Switch
                    checked={appConfig.enableStrictUserAgent}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, enableStrictUserAgent: val }))
                      persistSettingItem('enable_strict_user_agent', String(val), 'security', '严格 User-Agent 校验', 'boolean')
                    }}
                  />
                </div>

                {/* HMAC 请求签名 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">HMAC 请求签名验证</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">要求请求附带防重放时间戳及随机数验签</div>
                  </div>
                  <Switch
                    checked={appConfig.enableRequestSignature}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, enableRequestSignature: val }))
                      persistSettingItem('enable_request_signature', String(val), 'security', 'HMAC 请求签名验证', 'boolean')
                    }}
                  />
                </div>

                {/* 会话有效时长 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">管理员登录会话时长</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">登录凭据 Token 的有效保持周期</div>
                  </div>
                  <Select
                    value={appConfig.jwtExpirationHours}
                    onValueChange={(val) => {
                      setAppConfig(prev => ({ ...prev, jwtExpirationHours: val }))
                      persistSettingItem('jwt_expiration_hours', val, 'security', '管理员登录会话时长', 'number')
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="12">12 小时</SelectItem>
                      <SelectItem value="24">24 小时</SelectItem>
                      <SelectItem value="72">3 天</SelectItem>
                      <SelectItem value="168">7 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 卡片 3: GitHub 凭证与自动化同步 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white">
                      <Github className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        GitHub 同步与自动化
                      </CardTitle>
                      <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        配置 GitHub API 访问令牌与 1Panel 计划任务密钥
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {githubQuota && (
                      <Badge variant="secondary" className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] border-0">
                        {githubQuota.hasToken ? `配额: ${githubQuota.remaining}/${githubQuota.limit}` : `匿名: ${githubQuota.remaining}/60`}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestGithubToken()}
                      disabled={testingGithubToken}
                      className="h-7 rounded-lg text-xs px-2.5"
                    >
                      <Activity className={`mr-1 h-3 w-3 ${testingGithubToken ? 'animate-spin' : ''}`} />
                      检测配额
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {/* GitHub 访问令牌 (Personal Access Token) */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                        GitHub API 访问令牌 (Token)
                        {appConfig.githubToken ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border-0">
                            已配置
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-300">
                            未配置 (限额 60次/h)
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                        用于拉取软件版本 Releases 与安装包。未配置限 60 次/小时，配置后达 5000 次/小时
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      type={appConfig.maskSensitiveData ? "password" : "text"}
                      value={appConfig.githubToken}
                      onChange={(e) => setAppConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                      placeholder="ghp_... 或 github_pat_..."
                      className="h-8 rounded-lg text-xs font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs px-2.5"
                      onClick={() => persistSettingItem('github_token', appConfig.githubToken, 'api', 'GitHub 访问令牌', 'string')}
                      disabled={savingKey === 'github_token'}
                    >
                      保存
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6e6e73] dark:text-[#a1a1a6] pt-0.5">
                    <a
                      href="https://github.com/settings/tokens/new?description=LACS-Software-Manager&scopes=public_repo"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#0071e3] hover:underline"
                    >
                      前往 GitHub 创建 Token (公有仓库无需勾选私有权限)
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {githubQuota && githubQuota.resetTime && (
                      <span className="font-mono text-[10px]">配额重置: {githubQuota.resetTime}</span>
                    )}
                  </div>
                </div>

                {/* 定时同步密钥 (Cron Secret) */}
                <div className="p-4 space-y-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      计划任务同步密钥 (Cron Secret)
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">
                      用于 1Panel、Linux crontab 等外部定时任务触发 `/api/cron/github-sync` 的安全鉴权凭据
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      type={appConfig.maskSensitiveData ? "password" : "text"}
                      value={appConfig.cronSecret}
                      onChange={(e) => setAppConfig(prev => ({ ...prev, cronSecret: e.target.value }))}
                      placeholder="例如 lacs_cron_xxxxxxxx"
                      className="h-8 rounded-lg text-xs font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs px-2"
                      onClick={handleGenerateCronSecret}
                      title="生成随机高强度密钥"
                    >
                      随机生成
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs px-2"
                      onClick={() => handleCopyText(appConfig.cronSecret, 'secret')}
                      disabled={!appConfig.cronSecret}
                    >
                      {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs px-2.5"
                      onClick={() => persistSettingItem('cron_secret', appConfig.cronSecret, 'security', '定时同步密钥 (Cron Secret)', 'string')}
                      disabled={savingKey === 'cron_secret'}
                    >
                      保存
                    </Button>
                  </div>
                </div>

                {/* 1Panel 定时任务指令指南 */}
                <div className="p-4 space-y-2 bg-black/[0.01] dark:bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-slate-500" />
                      1Panel 计划任务配置
                    </span>
                    <span className="text-[10px] text-muted-foreground">任务类型：Shell 脚本</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.06] text-[11px] font-mono break-all flex items-center justify-between gap-2">
                    <span className="text-[#333] dark:text-[#ccc]">
                      curl -s "https://admin.lacs.cc/api/cron/github-sync?token={appConfig.cronSecret || 'YOUR_CRON_SECRET'}"
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-[10px] shrink-0 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                      onClick={() => handleCopyText(`curl -s "https://admin.lacs.cc/api/cron/github-sync?token=${appConfig.cronSecret || 'YOUR_CRON_SECRET'}"`, 'command')}
                    >
                      {copiedCommand ? (
                        <span className="text-emerald-500 flex items-center gap-1">
                          <Check className="h-3 w-3" /> 已复制
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Copy className="h-3 w-3" /> 复制命令
                        </span>
                      )}
                    </Button>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    提示：在 1Panel 计划任务中设置执行周期为「每 2 小时」或「每天凌晨 3:00」，实现软件全自动入库。
                  </div>
                </div>

                {/* 手动全量同步触发 */}
                <div className="p-4 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">全量同步测试</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">立即对所有已关联 GitHub 的软件执行一次同步拉取</div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleTriggerGithubSync}
                    disabled={triggeringSync}
                    className="h-8 rounded-lg text-xs px-3 bg-[#0071e3] hover:bg-[#0077ed] text-white shrink-0"
                  >
                    {triggeringSync ? (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        立即执行同步
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 卡片 4: 邮件发信与通知 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        邮件发信与通知
                      </CardTitle>
                      <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        配置验证码发信服务、SMTP 参数与通道测试
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {appConfig.mailProvider === 'smtp' ? 'SMTP 协议' : 'Resend API'}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={handleSaveEmailSettings}
                      disabled={savingEmailSettings}
                      className="h-7 rounded-lg text-xs px-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white"
                    >
                      {savingEmailSettings ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          保存中
                        </>
                      ) : (
                        '保存配置'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {/* 发信通道 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">发信通道模式</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">选择使用 HTTP 接口还是标准 SMTP 协议</div>
                  </div>
                  <Select
                    value={appConfig.mailProvider}
                    onValueChange={(val) => {
                      setAppConfig(prev => ({ ...prev, mailProvider: val }))
                      persistSettingItem('mail_provider', val, 'notification', '发信通道模式', 'string')
                    }}
                  >
                    <SelectTrigger className="w-[125px] h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="resend">Resend API</SelectItem>
                      <SelectItem value="smtp">标准 SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Resend 模式下的配置 */}
                {appConfig.mailProvider === 'resend' && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2.5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">Resend API Key</div>
                        <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">格式如 re_xxxxxxxx</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type={appConfig.maskSensitiveData ? "password" : "text"}
                          value={appConfig.resendApiKey}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, resendApiKey: e.target.value }))}
                          placeholder="re_..."
                          className="w-[170px] h-8 rounded-lg text-xs font-mono"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs px-2.5"
                          onClick={() => persistSettingItem('resend_api_key', appConfig.resendApiKey, 'notification', 'Resend API Key', 'string')}
                          disabled={savingKey === 'resend_api_key'}
                        >
                          保存
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2.5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">发件人地址</div>
                        <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">发信人名称与邮箱 (免费沙箱仅能使用 onboarding@resend.dev)</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={appConfig.resendFrom}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, resendFrom: e.target.value }))}
                          placeholder='玩机管家 <onboarding@resend.dev>'
                          className="w-[190px] h-8 rounded-lg text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-xs px-2.5"
                          onClick={() => persistSettingItem('resend_from', appConfig.resendFrom, 'notification', 'Resend 发件人', 'string')}
                          disabled={savingKey === 'resend_from'}
                        >
                          保存
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* SMTP 模式下的配置 */}
                {appConfig.mailProvider === 'smtp' && (
                  <div className="p-4 space-y-3 bg-black/[0.01] dark:bg-white/[0.01]">
                    {/* 常用服务商预设 */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-1.5">
                      <span className="text-[11px] font-medium text-[#6e6e73] dark:text-[#a1a1a6]">常用服务商预设</span>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 rounded-md"
                          onClick={() => applySmtpPreset('qq')}
                        >
                          QQ 邮箱
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 rounded-md"
                          onClick={() => applySmtpPreset('163')}
                        >
                          163 邮箱
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 rounded-md"
                          onClick={() => applySmtpPreset('gmail')}
                        >
                          Gmail
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-[11px] px-2 rounded-md"
                          onClick={() => applySmtpPreset('aliyun')}
                        >
                          阿里云
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">SMTP 主机</label>
                        <Input
                          value={appConfig.smtpHost}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                          placeholder="smtp.qq.com"
                          className="h-8 rounded-lg text-xs font-mono"
                          onBlur={() => persistSettingItem('smtp_host', appConfig.smtpHost, 'notification', 'SMTP 主机', 'string')}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">端口号</label>
                        <Input
                          value={appConfig.smtpPort}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                          placeholder="465"
                          className="h-8 rounded-lg text-xs font-mono"
                          onBlur={() => persistSettingItem('smtp_port', appConfig.smtpPort, 'notification', 'SMTP 端口', 'number')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">发信账号</label>
                        <Input
                          value={appConfig.smtpUser}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                          placeholder="service@yourdomain.com"
                          className="h-8 rounded-lg text-xs font-mono"
                          onBlur={() => persistSettingItem('smtp_user', appConfig.smtpUser, 'notification', 'SMTP 账号', 'string')}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">发信密码 / 授权码</label>
                        <Input
                          type={appConfig.maskSensitiveData ? "password" : "text"}
                          value={appConfig.smtpPass}
                          onChange={(e) => setAppConfig(prev => ({ ...prev, smtpPass: e.target.value }))}
                          placeholder="••••••••"
                          className="h-8 rounded-lg text-xs font-mono"
                          onBlur={() => persistSettingItem('smtp_pass', appConfig.smtpPass, 'notification', 'SMTP 授权码', 'string')}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">自定义发信人 (可选)</label>
                      <Input
                        value={appConfig.smtpFrom}
                        onChange={(e) => setAppConfig(prev => ({ ...prev, smtpFrom: e.target.value }))}
                        placeholder='“玩机管家” <service@yourdomain.com>'
                        className="h-8 rounded-lg text-xs"
                        onBlur={() => persistSettingItem('smtp_from', appConfig.smtpFrom, 'notification', 'SMTP 发信签名', 'string')}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[#1d1d1f] dark:text-[#f5f5f7]">启用 SSL / TLS 加密 (465端口推荐)</span>
                      <Switch
                        checked={appConfig.smtpSecure}
                        onCheckedChange={(val) => {
                          setAppConfig(prev => ({ ...prev, smtpSecure: val }))
                          persistSettingItem('smtp_secure', String(val), 'notification', 'SMTP SSL加密', 'boolean')
                        }}
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                      提示：QQ 邮箱与网易 163 邮箱须在网页版邮箱设置中开启 POP3/SMTP 服务，并在发信密码中填入生成的 16 位专属授权码，不能直接填网页登录密码。
                    </div>
                  </div>
                )}

                {/* 异地登录提醒 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">异地登录告警</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">检测到陌生 IP 或新设备登录时发送提醒邮件</div>
                  </div>
                  <Switch
                    checked={appConfig.notifySuspiciousLogin}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, notifySuspiciousLogin: val }))
                      persistSettingItem('notify_suspicious_login', String(val), 'notification', '异地登录告警', 'boolean')
                    }}
                  />
                </div>

                {/* 测试发信功能 */}
                <div className="p-4 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">发信通道连通测试</div>
                    <span className="text-[10px] text-muted-foreground">校验当前配置是否能真实投递邮件</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={testEmailTarget}
                      onChange={(e) => setTestEmailTarget(e.target.value)}
                      placeholder="输入测试收件邮箱 (如 test@qq.com)"
                      className="h-8 rounded-lg text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendTestEmail}
                      disabled={testEmailSending}
                      className="h-8 rounded-lg text-xs px-3 bg-[#0071e3] hover:bg-[#0077ed] text-white"
                    >
                      {testEmailSending ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          发送中
                        </>
                      ) : (
                        <>
                          <Mail className="mr-1.5 h-3.5 w-3.5" />
                          发送测试
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 卡片 5: 网络与跨域白名单 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                      网络与跨域来源 (CORS)
                    </CardTitle>
                    <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                      配置允许跨域调用后台接口的前端与客户端域名白名单
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#6e6e73] dark:text-[#a1a1a6]">已允许的来源列表</div>
                  <div className="flex flex-wrap gap-1.5">
                    {appConfig.allowedOrigins.map((origin, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="rounded-lg px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] border-0"
                      >
                        {origin}
                        <button
                          onClick={() => {
                            const updated = appConfig.allowedOrigins.filter((_, i) => i !== idx)
                            setAppConfig(prev => ({ ...prev, allowedOrigins: updated }))
                            persistSettingItem('allowed_origins', updated.join(','), 'api', '跨域来源白名单', 'string')
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors ml-0.5"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newOriginInput}
                    onChange={(e) => setNewOriginInput(e.target.value)}
                    placeholder="https://example.com 或 http://localhost:3000"
                    className="h-8 rounded-lg text-xs flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const trimmed = newOriginInput.trim()
                      if (!trimmed) return
                      if (appConfig.allowedOrigins.includes(trimmed)) {
                        toast({ title: "该域名已在列表中" })
                        return
                      }
                      const updated = [...appConfig.allowedOrigins, trimmed]
                      setAppConfig(prev => ({ ...prev, allowedOrigins: updated }))
                      setNewOriginInput('')
                      persistSettingItem('allowed_origins', updated.join(','), 'api', '跨域来源白名单', 'string')
                    }}
                    className="h-8 rounded-lg text-xs px-3 bg-[#0071e3] hover:bg-[#0077ed] text-white"
                  >
                    添加
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 卡片 6: 数据库与系统维护 */}
            <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <CardHeader className="pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <HardDrive className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                        数据库与系统维护
                      </CardTitle>
                      <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                        连接可用性监测、数据清理策略与运行时规格
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={checkDatabaseHealth}
                    className="h-8 rounded-lg text-xs px-2.5"
                  >
                    <Activity className={`mr-1 h-3.5 w-3.5 ${dbHealthStatus === 'checking' ? 'animate-spin' : ''}`} />
                    测试延迟
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-black/[0.04] dark:divide-white/[0.05]">
                {/* 数据库健康状态 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-1.5">
                      数据库连通状态
                      {dbHealthStatus === 'healthy' && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] border-0">
                          {dbLatency !== null ? `${dbLatency}ms` : '正常'}
                        </Badge>
                      )}
                      {dbHealthStatus === 'error' && (
                        <Badge variant="destructive" className="text-[10px]">异常</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">Neon (主数据) + Supabase (系统配置)</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-muted-foreground">Connected</span>
                  </div>
                </div>

                {/* 自动清理未核销临时激活码 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">自动清理未用激活码</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">自动清除生成超过 5 分钟未使用的临时记录</div>
                  </div>
                  <Switch
                    checked={appConfig.autoCleanupExpiredCodes}
                    onCheckedChange={(val) => {
                      setAppConfig(prev => ({ ...prev, autoCleanupExpiredCodes: val }))
                      persistSettingItem('auto_cleanup_expired_codes', String(val), 'database', '自动清理未用激活码', 'boolean')
                    }}
                  />
                </div>

                {/* 日志保留天数 */}
                <div className="flex items-center justify-between p-4">
                  <div className="space-y-0.5 pr-4">
                    <div className="text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">日志保留时长</div>
                    <div className="text-[11px] text-[#6e6e73] dark:text-[#a1a1a6]">登录及审计日志的最长保存时间</div>
                  </div>
                  <Select
                    value={appConfig.logRetentionDays}
                    onValueChange={(val) => {
                      setAppConfig(prev => ({ ...prev, logRetentionDays: val }))
                      persistSettingItem('log_retention_days', val, 'database', '日志保留时长', 'number')
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="7">7 天</SelectItem>
                      <SelectItem value="30">30 天</SelectItem>
                      <SelectItem value="90">90 天</SelectItem>
                      <SelectItem value="180">180 天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 系统运行环境规格 */}
                <div className="p-4 space-y-2 bg-black/[0.01] dark:bg-white/[0.01]">
                  <div className="text-[11px] font-medium text-[#6e6e73] dark:text-[#a1a1a6] pb-1">系统运行时规格</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">核心框架</div>
                      <div className="font-mono text-[11px]">Next.js 14 + Hono</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">数据访问</div>
                      <div className="font-mono text-[11px]">Drizzle ORM</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">动态生效配置</div>
                      <div className="font-mono text-[11px]">{settings.length} 项实时生效</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-muted-foreground">数据库架构</div>
                      <div className="font-mono text-[11px]">Neon + Supabase</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 2. 登录日志 Tab */}
        {/* ========================================================================= */}
        <TabsContent value="login-logs" className="space-y-4 outline-none">
          <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div>
                <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  登录行为记录
                </CardTitle>
                <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                  监控用户登录 IP、设备型号及浏览器系统环境
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLoginLogs}
                disabled={loginLogsLoading}
                className="h-8 rounded-lg text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loginLogsLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-black/[0.05] dark:border-white/[0.06]">
                    <TableHead className="text-xs font-medium">用户</TableHead>
                    <TableHead className="text-xs font-medium">IP 地址</TableHead>
                    <TableHead className="text-xs font-medium">设备型号</TableHead>
                    <TableHead className="text-xs font-medium">操作系统</TableHead>
                    <TableHead className="text-xs font-medium">浏览器</TableHead>
                    <TableHead className="text-xs font-medium">时间</TableHead>
                    <TableHead className="w-[80px] text-right pr-4">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-[#6e6e73]">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#0071e3] mb-1.5" />
                        正在加载登录记录...
                      </TableCell>
                    </TableRow>
                  ) : loginLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-[#6e6e73]">
                        暂无登录日志
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] border-black/[0.04] dark:border-white/[0.05]">
                        <TableCell>
                          <div className="font-medium text-xs">{log.email}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]">{log.userId}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs">
                            {getDeviceIcon(log.deviceInfo?.device?.type || 'unknown')}
                            <span>{log.deviceInfo?.device?.model && log.deviceInfo?.device?.model !== 'Unknown' ? log.deviceInfo.device.model : '标准终端'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.deviceInfo?.os?.name || '未知'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{log.deviceInfo?.browser?.name || '未知'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{dayjs(log.loginTime).format('MM-DD HH:mm')}</TableCell>
                        <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl text-xs">
                              <DropdownMenuItem
                                onClick={() => {
                                  setBlockTarget({ type: 'ip', value: log.ipAddress, label: log.ipAddress })
                                  setBlockDialogOpen(true)
                                }}
                                className="text-orange-600"
                              >
                                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                                拉黑此 IP
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const osName = log.deviceInfo?.os?.name || '未知系统'
                                  const browserName = log.deviceInfo?.browser?.name || '未知浏览器'
                                  setBlockTarget({ type: 'device', value: log.userAgent || 'unknown', label: `${osName} / ${browserName}` })
                                  setBlockDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />
                                拉黑此设备指纹
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 3. 审计日志 Tab */}
        {/* ========================================================================= */}
        <TabsContent value="audit" className="space-y-4 outline-none">
          <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div>
                <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  系统设置变更记录
                </CardTitle>
                <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                  记录各项设置的历史修改记录与变更前数值
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAuditLogs}
                disabled={auditLogsLoading}
                className="h-8 rounded-lg text-xs"
              >
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-black/[0.05] dark:border-white/[0.06]">
                    <TableHead className="text-xs font-medium">时间</TableHead>
                    <TableHead className="text-xs font-medium">键名</TableHead>
                    <TableHead className="text-xs font-medium">分类</TableHead>
                    <TableHead className="text-xs font-medium">操作</TableHead>
                    <TableHead className="text-xs font-medium">旧值</TableHead>
                    <TableHead className="text-xs font-medium">新值</TableHead>
                    <TableHead className="text-xs font-medium">修改说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-[#6e6e73]">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-[#0071e3] mb-1.5" />
                        正在加载审计日志...
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-xs text-[#6e6e73]">
                        暂无审计日志
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] border-black/[0.04] dark:border-white/[0.05]">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {dayjs(log.timestamp).format('MM-DD HH:mm')}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{log.settingKey}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] rounded-md font-normal">
                            {categoryConfig[log.settingCategory]?.name || log.settingCategory}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.action === 'delete' ? 'destructive' : 'default'}
                            className="text-[9px] uppercase px-1.5 py-0"
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs font-mono text-muted-foreground">{log.oldValue || '-'}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs font-mono text-emerald-600 dark:text-emerald-400">{log.newValue || '-'}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">{log.reason || '即时生效保存'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* 4. 底层键值表 Tab */}
        {/* ========================================================================= */}
        <TabsContent value="raw-settings" className="space-y-4 outline-none">
          <Card className="rounded-2xl bg-white dark:bg-[#161618] border border-black/[0.06] dark:border-white/[0.08] shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                    底层数据库键值表
                  </CardTitle>
                  <CardDescription className="text-xs text-[#6e6e73] dark:text-[#a1a1a6]">
                    直接管理 system_settings 数据库表中的原始键值记录
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="搜索键名..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pl-7 w-[160px] h-8 text-xs rounded-lg"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg">
                      <SelectValue placeholder="全部分类" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">全部分类</SelectItem>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => setCreateModalOpen(true)}
                    className="h-8 rounded-lg text-xs px-3 bg-[#0071e3] hover:bg-[#0077ed] text-white"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    新增
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-black/[0.05] dark:border-white/[0.06]">
                    <TableHead className="text-xs font-medium">分类</TableHead>
                    <TableHead className="text-xs font-medium">键名 (Key)</TableHead>
                    <TableHead className="text-xs font-medium">存储值 (Value)</TableHead>
                    <TableHead className="text-xs font-medium">功能说明</TableHead>
                    <TableHead className="w-[70px] text-right pr-4">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-[#6e6e73]">
                        正在拉取数据...
                      </TableCell>
                    </TableRow>
                  ) : settings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-xs text-[#6e6e73]">
                        暂无键值记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    settings.map((setting) => (
                      <TableRow key={setting.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] border-black/[0.04] dark:border-white/[0.05]">
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] rounded-md font-normal">
                            {categoryConfig[setting.category]?.name || setting.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium">{setting.key}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs font-mono">
                          {setting.isSecret ? '******' : setting.value}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{setting.description}</TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(setting.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="h-7 w-7 p-0 rounded-full hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">确认删除配置项？</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              此操作将直接从数据库中删除该记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg text-xs">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) handleDeleteSetting(deleteTarget)
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
              className="rounded-lg text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 拉黑确认对话框 */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-1.5 text-red-600 text-base">
              <ShieldAlert className="h-4 w-4" />
              确认执行安全拉黑拦截？
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs pt-1">
              <div>
                正在拦截: 
                <span className="font-mono font-bold ml-1 text-foreground px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                  {blockTarget?.label}
                </span>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-xs font-medium text-foreground">拉黑理由 (可选)</label>
                <Input
                  placeholder="例如：异常频繁扫描"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="rounded-lg text-xs h-8"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlockReason('')} className="rounded-lg text-xs">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockAction}
              className="rounded-lg text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              确认拉黑
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 新增底层键值弹窗 */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">新增系统配置</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              直接向 system_settings 写入配置记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 py-1 text-xs">
            <div className="space-y-1">
              <label className="font-medium">分类</label>
              <Select value={newSettingCategory} onValueChange={setNewSettingCategory}>
                <SelectTrigger className="rounded-lg text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(categoryConfig).map(([k, c]) => (
                    <SelectItem key={k} value={k}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="font-medium">键名 (Key)</label>
              <Input
                placeholder="例如: custom_key"
                value={newSettingKey}
                onChange={(e) => setNewSettingKey(e.target.value)}
                className="rounded-lg text-xs h-8 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium">配置值 (Value)</label>
              <Input
                placeholder="例如: true 或 字符串"
                value={newSettingValue}
                onChange={(e) => setNewSettingValue(e.target.value)}
                className="rounded-lg text-xs h-8 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium">功能说明</label>
              <Input
                placeholder="简要说明此配置的作用"
                value={newSettingDesc}
                onChange={(e) => setNewSettingDesc(e.target.value)}
                className="rounded-lg text-xs h-8"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-lg text-xs h-8">
              取消
            </Button>
            <Button onClick={handleCreateRawSetting} className="rounded-lg text-xs h-8 bg-[#0071e3] hover:bg-[#0077ed] text-white">
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
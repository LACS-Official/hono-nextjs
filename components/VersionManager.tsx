'use client'

import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface VersionHistory {
  id: number
  version: string
  releaseDate: string
  releaseNotes?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: string
  fileSize?: string
  createdAt: string
}

interface VersionManagerProps {
  softwareId: number
  softwareName: string
  onVersionAdded?: () => void
}

export default function VersionManager({ softwareId, softwareName }: VersionManagerProps) {
  const [versions, setVersions] = useState<VersionHistory[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/software/id/${softwareId}/versions`)
      const data = await response.json()
      if (data.success) {
        setVersions(data.data.versions || [])
      }
    } catch (error) {
      toast({ variant: "destructive", title: "获取版本失败" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [softwareId])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{softwareName} 版本管理</CardTitle>
            <CardDescription>管理软件的所有历史版本和下载链接</CardDescription>
          </div>
          <Button onClick={() => toast({ title: "提示", description: "请前往软件详情页使用增强版管理工具" })}>
            <Plus className="mr-2 h-4 w-4" /> 新增版本
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>版本号</TableHead>
                  <TableHead>发布日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>文件大小</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                      暂无版本数据
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-bold">{v.version}</TableCell>
                      <TableCell>{new Date(v.releaseDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {v.isStable && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none">稳定版</Badge>}
                          {v.isBeta && <Badge variant="secondary">测试版</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{v.fileSize || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => toast({ title: "提示", description: "该组件已过时，请在增强版管理中心操作" })}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>注意:</strong> 这是一个旧版管理组件。核心系统已迁移至 <code>EnhancedVersionManager</code>。
          建议跳转至软件详情页进行更完整的版本配置（包括多渠道下载链接、语义化版本建议等）。
        </p>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import {
  Download,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeftRight,
  ChevronDown
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VersionHistory {
  id: number
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: {
    official?: string
    quark?: string
    pan123?: string
    baidu?: string
    thunder?: string
    backup?: string[]
  }
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: 'release' | 'beta' | 'alpha' | 'rc'
  changelogCategory?: string[]
  createdAt: string
  updatedAt: string
}

interface VersionComparisonProps {
  visible: boolean
  onClose: () => void
  versions: VersionHistory[]
  selectedVersions: VersionHistory[]
}

export default function VersionComparison({ 
  visible, 
  onClose, 
  selectedVersions 
}: VersionComparisonProps) {
  
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'timeline'>('side-by-side')

  if (selectedVersions.length !== 2) {
    return (
      <Dialog open={visible} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <Info className="h-12 w-12 text-slate-300" />
            <p className="text-slate-500 font-medium">请选择两个版本进行比较</p>
            <Button onClick={onClose}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const [version1, version2] = [...selectedVersions].sort((a, b) => 
    new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  )

  const timeDiff = Math.abs(
    new Date(version1.releaseDate).getTime() - new Date(version2.releaseDate).getTime()
  ) / (1000 * 60 * 60 * 24)

  const sizeDiff = version1.fileSizeBytes && version2.fileSizeBytes 
    ? version1.fileSizeBytes - version2.fileSizeBytes 
    : null

  const renderVersionCard = (version: VersionHistory, title: string, color: string) => (
    <Card className={cn("flex-1 border-slate-200", color)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="font-bold">{title}</Badge>
          <span className="text-xl font-bold">{version.version}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">发布日期</span>
          <span className="font-medium">{new Date(version.releaseDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">类型</span>
          <Badge variant={version.versionType === 'release' ? 'default' : 'secondary'}>
            {version.versionType}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">文件大小</span>
          <span className="font-medium">{version.fileSize || '-'}</span>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <span className="text-slate-500 block">更新点:</span>
          <div className="flex flex-wrap gap-1">
            {version.changelogCategory?.map(cat => (
              <Badge key={cat} variant="outline" className="text-[10px]">{cat}</Badge>
            ))}
          </div>
        </div>

        {version.releaseNotes && (
          <div className="space-y-1">
            <span className="text-slate-500 block">日志:</span>
            <p className="p-2 bg-slate-50 rounded text-xs line-clamp-3">{version.releaseNotes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" /> 版本比对
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-6">
          <Button 
            variant={compareMode === 'side-by-side' ? 'default' : 'outline'}
            onClick={() => setCompareMode('side-by-side')}
            size="sm"
          >
            并排比较
          </Button>
          <Button 
            variant={compareMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setCompareMode('timeline')}
            size="sm"
          >
            时间线视图
          </Button>
        </div>

        {compareMode === 'side-by-side' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              {renderVersionCard(version1, "较新版本", "bg-green-50/20")}
              {renderVersionCard(version2, "较旧版本", "bg-slate-50/50")}
            </div>

            <Card className="bg-slate-50/50">
              <CardContent className="grid grid-cols-3 gap-4 pt-6 text-center">
                <div className="space-y-1">
                  <div className="flex justify-center mb-1"><Clock className="h-5 w-5 text-blue-500" /></div>
                  <div className="text-lg font-bold">{Math.round(timeDiff)}</div>
                  <div className="text-xs text-slate-500 uppercase">天数间隔</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-center mb-1">
                    {sizeDiff && sizeDiff > 0 ? <AlertCircle className="h-5 w-5 text-red-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  </div>
                  <div className="text-lg font-bold">
                    {sizeDiff !== null ? `${sizeDiff > 0 ? '+' : ''}${(sizeDiff / 1024 / 1024).toFixed(1)} MB` : '-'}
                  </div>
                  <div className="text-xs text-slate-500 uppercase">大小变化</div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-center mb-1"><ArrowLeftRight className="h-5 w-5 text-purple-500" /></div>
                  <div className="text-lg font-bold">{version1.changelogCategory?.length || 0}</div>
                  <div className="text-xs text-slate-500 uppercase">更新条目</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6 border-l-2 border-slate-100 ml-4 pl-8 pt-2">
             {[version1, version2].map((v, i) => (
               <div key={v.id} className="relative mb-8">
                 <div className={cn(
                   "absolute -left-[41px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                   i === 0 ? "bg-green-500" : "bg-blue-400"
                 )} />
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-500">{new Date(v.releaseDate).toLocaleDateString()}</span>
                      <Badge>{v.version}</Badge>
                   </div>
                   <Card className="shadow-none border-dashed bg-slate-50/30">
                     <CardContent className="pt-4 pb-3">
                        <p className="text-sm">{v.releaseNotes || "暂无日志"}</p>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

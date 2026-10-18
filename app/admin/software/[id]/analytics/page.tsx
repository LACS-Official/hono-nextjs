'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SoftwareDetailAnalyticsRedirect() {
  const params = useParams()
  const router = useRouter()
  const softwareId = params.id as string

  useEffect(() => {
    if (softwareId) {
      router.replace(`/admin/software/analytics?softwareId=${encodeURIComponent(softwareId)}`)
    } else {
      router.replace('/admin/software/analytics')
    }
  }, [softwareId, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-muted-foreground">正在加载软件统计分析数据...</p>
    </div>
  )
}

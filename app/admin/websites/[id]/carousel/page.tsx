'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function WebsiteCarouselPage() {
  const params = useParams()
  const router = useRouter()
  const websiteId = params.id as string

  useEffect(() => {
    if (websiteId) {
      router.replace(`/admin/websites/${websiteId}/banners`)
    } else {
      router.replace('/admin/websites')
    }
  }, [websiteId, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="text-sm text-muted-foreground">正在跳转至轮播图与横幅管理中心...</p>
    </div>
  )
}

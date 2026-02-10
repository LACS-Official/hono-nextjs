'use client'

import React from 'react'
import SoftwareCard from './SoftwareCard'
import type { Software } from '../utils/software-api'
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PackageOpen } from "lucide-react"

interface ResponsiveSoftwareGridProps {
  software: Software[]
  loading: boolean
  onEdit: (software: Software) => void
  onDelete: (id: number) => void
  onView: (software: Software) => void
  onViewStats: (software: Software) => void
}

const ResponsiveSoftwareGrid: React.FC<ResponsiveSoftwareGridProps> = ({
  software,
  loading,
  onEdit,
  onDelete,
  onView,
  onViewStats
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
             <Card key={i} className="h-full">
                <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                    <div className="flex justify-between">
                         <Skeleton className="h-4 w-1/3" />
                         <Skeleton className="h-4 w-1/3" />
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
    )
  }

  if (software.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground border rounded-lg bg-muted/10 border-dashed">
        <PackageOpen className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">暂无软件数据</p>
        <p className="text-sm">点击"新增软件"开始添加</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
      {software.map((item) => (
         <SoftwareCard
            key={item.id}
            software={item}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onViewStats={onViewStats}
          />
      ))}
    </div>
  )
}

export default ResponsiveSoftwareGrid
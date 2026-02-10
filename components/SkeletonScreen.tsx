import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 表格骨架屏
export const TableSkeleton = ({ rows = 5, columns = 6 }: { rows?: number, columns?: number }) => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <div className="rounded-md border bg-card p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center space-x-4">
             {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                    key={colIndex} 
                    className="h-8" 
                    style={{ 
                        flex: colIndex === 0 ? '0 0 50px' : 1
                    }}
                />
             ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// 卡片骨架屏
export const CardSkeleton = ({ count = 8 }: { count?: number }) => {
  return (
    <div className="space-y-4">
       <Skeleton className="h-8 w-1/4" />
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// 统计卡片骨架屏
export const StatsCardSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
             <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
  )
}

// 表单骨架屏
export const FormSkeleton = () => {
  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
         <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
         </div>
         <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-32 w-full" />
         </div>
         <div className="flex justify-end gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
         </div>
      </CardContent>
    </Card>
  )
}

// 详情页骨架屏
export const DetailSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-1/3" />
      <Card>
        <CardContent className="pt-6 space-y-4">
             <Skeleton className="h-6 w-1/4 mb-4" />
             <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
             </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 列表骨架屏
export const ListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/4" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

// 软件管理页面专用骨架屏
export const SoftwareManagementSkeleton = ({ viewMode = 'table' }: { viewMode?: 'table' | 'card' }) => {
  return (
    <>
      <StatsCardSkeleton count={4} />
      {viewMode === 'table' ? (
        <TableSkeleton rows={5} columns={8} />
      ) : (
        <CardSkeleton count={8} />
      )}
    </>
  )
}
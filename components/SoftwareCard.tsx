'use client'

import React from 'react'
import { 
  Edit, 
  Trash2, 
  Eye, 
  BarChart2, 
  MoreHorizontal
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Software } from '@/utils/software-api'

interface SoftwareCardProps {
  software: Software
  onEdit: (software: Software) => void
  onDelete: (id: number) => void
  onView: (software: Software) => void
  onViewStats: (software: Software) => void
}

const SoftwareCard: React.FC<SoftwareCardProps> = ({
  software,
  onEdit,
  onDelete,
  onView,
  onViewStats
}) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold line-clamp-1" title={software.name}>
                {software.name}
            </CardTitle>
            {software.nameEn && (
              <CardDescription className="text-xs line-clamp-1" title={software.nameEn}>
                {software.nameEn}
              </CardDescription>
            )}
          </div>
          <Badge 
            variant={software.isActive ? "default" : "destructive"} 
            className={software.isActive ? "bg-green-500 hover:bg-green-600" : ""}
          >
            {software.isActive ? '已激活' : '已停用'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3 space-y-4">
        {software.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {software.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic h-10 flex items-center">
            暂无描述
          </p>
        )}

        <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                #{software.id}
            </Badge>
            {software.category && (
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                    {software.category}
                </Badge>
            )}
            <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">
                v{software.currentVersion}
            </Badge>
            <Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200">
                <Eye className="w-3 h-3 mr-1" />
                {software.viewCount}
            </Badge>
        </div>

        {software.tags && software.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {software.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {software.tags.length > 3 && (
                <span className="inline-flex items-center rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    +{software.tags.length - 3}
                </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
        <span>
            {new Date(software.createdAt).toLocaleDateString()}
        </span>
        
        <div className="flex gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(software)}>
                            <Eye className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>查看详情</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(software)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>编辑</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewStats(software)}>
                            <BarChart2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>统计</TooltipContent>
                </Tooltip>
            </TooltipProvider>

             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                            onClick={() => onDelete(software.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                     <TooltipContent>删除</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  )
}

export default SoftwareCard
'use client'

import React, { useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check, Copy, Terminal } from "lucide-react"

import rawApiData from './api-data.json'
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

// 定义 API 数据类型
type ApiDoc = {
  id: string;
  title: string;
  method: string;
  path: string;
  description: string;
  requestHeaders: string;
  requestBody: string;
  responseSuccess: string;
  responseError: string;
}

// 导入自动生成的 API 数据
const apiData = rawApiData as ApiDoc[]

export default function ApiDocsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredApis = apiData.filter(api => 
    api.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    api.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-24 max-w-5xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">管理后台</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>API 文档</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">API 接口文档</h2>
        <p className="text-muted-foreground">
          查看各个 API 的调用方式及数据格式，供客户端或第三方对接使用。共收录 {apiData.length} 个接口。
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索接口名称、路径或描述..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-8 mt-6">
        {filteredApis.length === 0 ? (
           <div className="text-center text-muted-foreground py-12 border rounded-lg bg-muted/10">
             <p>没有找到匹配的接口</p>
           </div>
        ) : (
          filteredApis.map((api) => (
            <ApiDocCard key={api.id} api={api} />
          ))
        )}
      </div>
    </div>
  )
}

function ApiDocCard({ api }: { api: typeof apiData[0] }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'POST': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            {api.title}
          </CardTitle>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className={`px-2 py-0.5 rounded-md font-semibold ${getMethodColor(api.method)}`}>
              {api.method}
            </span>
            <span className="bg-muted px-2 py-0.5 rounded-md text-foreground">
              {api.path}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => copyToClipboard(`${api.method} ${api.path}`, 'path')}
            >
              {copiedSection === 'path' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </div>
        </div>
        <CardDescription className="mt-2 text-base">
          {api.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="request" className="w-full rounded-none border-b-0">
          <TabsList className="w-full justify-start rounded-none border-b h-12 bg-transparent p-0 px-4 gap-4">
            <TabsTrigger 
              value="request" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2"
            >
              请求参数 (Request)
            </TabsTrigger>
            <TabsTrigger 
              value="response" 
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 px-2"
            >
              返回结果 (Response)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="request" className="m-0 p-4 space-y-4 bg-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Headers</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => copyToClipboard(api.requestHeaders, 'headers')}
                >
                  {copiedSection === 'headers' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedSection === 'headers' ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="bg-muted/50 p-3 rounded-lg overflow-x-auto text-sm font-mono border">
                {api.requestHeaders}
              </pre>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Body (JSON)</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => copyToClipboard(api.requestBody, 'body')}
                >
                  {copiedSection === 'body' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedSection === 'body' ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {api.requestBody}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="response" className="m-0 p-4 space-y-4 bg-card">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium">成功返回 (200 OK)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => copyToClipboard(api.responseSuccess, 'success')}
                >
                  {copiedSection === 'success' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedSection === 'success' ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {api.responseSuccess}
              </pre>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2 mt-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium">错误返回 (4xx / 500)</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs text-muted-foreground"
                  onClick={() => copyToClipboard(api.responseError, 'error')}
                >
                  {copiedSection === 'error' ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copiedSection === 'error' ? '已复制' : '复制'}
                </Button>
              </div>
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm font-mono opacity-90">
                {api.responseError}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

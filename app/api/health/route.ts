import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-connection'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  return handleOptions()
}

export async function GET(request: NextRequest) {
  try {
    // 测试数据库连接
    await db.execute('SELECT 1')
    
    return corsResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return corsResponse({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    }, { status: 503 })
  }
}

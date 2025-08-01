import { NextRequest } from 'next/server'
import { checkUnifiedDbHealth } from '@/lib/unified-db-connection'
import { corsResponse, handleOptions } from '@/lib/cors'

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  const startTime = Date.now()

  try {
    // 使用统一数据库健康检查
    const unifiedDbHealthy = await Promise.race([
      checkUnifiedDbHealth(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
    ]).catch(() => false)

    const databaseStatus = unifiedDbHealthy ? 'connected' : 'disconnected'
    const overallStatus = unifiedDbHealthy ? 'ok' : 'error'
    const responseTime = Date.now() - startTime

    // 收集系统信息
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'unknown'
    }

    return corsResponse({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: {
          status: databaseStatus,
          healthy: unifiedDbHealthy,
          type: 'unified'
        },
        system: systemInfo,
        version: '1.0.0'
      }
    }, overallStatus === 'ok' ? undefined : { status: 503 }, origin, userAgent)
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Health check failed:', error)

    return corsResponse({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: {
          status: 'disconnected',
          healthy: false,
          type: 'unified'
        }
      }
    }, { status: 503 }, origin, userAgent)
  }
}

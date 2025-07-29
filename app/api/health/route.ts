import { NextRequest } from 'next/server'
import { checkActivationCodesDbHealth } from '@/lib/activation-codes-db-connection'
import { checkSoftwareDbHealth } from '@/lib/software-db-connection'
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
    // 使用改进的健康检查函数，设置超时
    const healthCheckPromises = [
      Promise.race([
        checkActivationCodesDbHealth(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]).catch(() => false),
      Promise.race([
        checkSoftwareDbHealth(),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]).catch(() => false)
    ]

    const [activationCodesHealthy, softwareHealthy] = await Promise.all(healthCheckPromises)

    const activationCodesStatus = activationCodesHealthy ? 'connected' : 'disconnected'
    const softwareStatus = softwareHealthy ? 'connected' : 'disconnected'
    const overallStatus = activationCodesHealthy && softwareHealthy ? 'ok' : 'partial'
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
        databases: {
          activationCodes: {
            status: activationCodesStatus,
            healthy: activationCodesHealthy
          },
          software: {
            status: softwareStatus,
            healthy: softwareHealthy
          }
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
        databases: {
          activationCodes: {
            status: 'disconnected',
            healthy: false
          },
          software: {
            status: 'disconnected',
            healthy: false
          }
        }
      }
    }, { status: 503 }, origin, userAgent)
  }
}

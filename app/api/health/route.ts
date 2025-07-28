import { NextRequest, NextResponse } from 'next/server'
import { activationCodesDb } from '@/lib/activation-codes-db-connection'
import { softwareDb } from '@/lib/software-db-connection'
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

  try {
    // 测试两个数据库连接
    const [activationCodesTest, softwareTest] = await Promise.allSettled([
      activationCodesDb.execute('SELECT 1'),
      softwareDb.execute('SELECT 1')
    ])

    const activationCodesStatus = activationCodesTest.status === 'fulfilled' ? 'connected' : 'disconnected'
    const softwareStatus = softwareTest.status === 'fulfilled' ? 'connected' : 'disconnected'
    const overallStatus = activationCodesStatus === 'connected' && softwareStatus === 'connected' ? 'ok' : 'partial'

    return corsResponse({
      success: true,
      data: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        databases: {
          activationCodes: activationCodesStatus,
          software: softwareStatus
        },
        version: '1.0.0'
      }
    }, overallStatus === 'ok' ? undefined : { status: 503 }, origin, userAgent)
  } catch (error) {
    console.error('Health check failed:', error)

    return corsResponse({
      success: false,
      error: 'Database connection failed',
      data: {
        status: 'error',
        timestamp: new Date().toISOString(),
        databases: {
          activationCodes: 'disconnected',
          software: 'disconnected'
        }
      }
    }, { status: 503 }, origin, userAgent)
  }
}

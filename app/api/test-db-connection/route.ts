import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb, loginLogs } from '@/lib/system-settings-db'
import { count } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    console.log('测试数据库连接')
    
    // 测试数据库连接
    const result = await systemSettingsDb
      .select({ count: count(loginLogs.id) })
      .from(loginLogs)
    
    console.log('数据库连接测试结果:', result)
    
    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      data: result
    })
  } catch (error: any) {
    console.error('数据库连接测试失败:', error)
    console.error('错误详情:', error.stack)
    
    return NextResponse.json({
      success: false,
      error: '数据库连接失败',
      details: error.message
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { systemSettingsDb } from '@/lib/system-settings-db'
import { loginLogs } from '@/lib/system-settings-schema'
import { eq, and, desc, gte, lte, like } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { parseUserAgent, getClientIp, getNetworkInfo, getIpLocation } from '@/lib/login-log-utils'
import { v4 as uuidv4 } from 'uuid'

// POST方法 - 记录登录日志
export async function POST(request: NextRequest) {
  try {
    console.log('开始处理登录日志POST请求')
    
    // 解析请求体
    const body = await request.json()
    console.log('请求体内容:', body)
    
    const { userId, email, sessionId, clientIp } = body
    
    // 验证必需字段
    if (!userId || !email || !sessionId) {
      console.error('缺少必需字段:', { userId: !!userId, email: !!email, sessionId: !!sessionId })
      return NextResponse.json(
        { success: false, error: '缺少必需字段: userId, email, sessionId' },
        { status: 400 }
      )
    }
    
    // 获取设备信息和网络信息
    const userAgent = request.headers.get('user-agent') || ''
    // 优先使用客户端传递的真实IP，否则从服务器端获取
    const ipAddress = (clientIp && clientIp !== '未知') ? clientIp : (getClientIp(request) || '未知')
    console.log('使用的IP地址:', ipAddress, '客户端传递:', clientIp)
    
    const deviceInfo = parseUserAgent(userAgent)
    const ipLocation = await getIpLocation(ipAddress)
    const networkInfo = {
      ...getNetworkInfo(request),
      country: ipLocation.country,
      region: ipLocation.region,
      city: ipLocation.city,
      isp: ipLocation.isp,
      timezone: ipLocation.timezone
    }
    
    // 创建登录日志记录
    const newLog = {
      id: uuidv4(),
      userId,
      email,
      ipAddress,
      userAgent,
      deviceInfo,
      networkInfo,
      loginTime: new Date(),
      sessionId,
      isActive: true,
      createdAt: new Date()
    }
    
    // 插入数据库
    await systemSettingsDb.insert(loginLogs).values(newLog)
    
    console.log('登录日志记录成功:', { userId, email, sessionId })
    
    return NextResponse.json({
      success: true,
      message: '登录日志记录成功',
      data: newLog
    })
  } catch (error: any) {
    console.error('记录登录日志失败:', error)
    return NextResponse.json(
      { success: false, error: '记录登录日志失败: ' + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('开始处理登录日志DELETE请求')
    
    const body = await request.json()
    const { id, sessionId } = body
    
    if (id) {
      console.log('删除日志请求:', { id })
      
      const deleteResult = await systemSettingsDb
        .delete(loginLogs)
        .where(eq(loginLogs.id, id)) as any
      
      console.log('删除结果:', deleteResult)
      
      if (deleteResult?.[0]?.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: '未找到对应的登录日志' },
          { status: 404 }
        )
      }
      
      console.log('删除成功:', { id })
      
      return NextResponse.json({
        success: true,
        message: '删除成功'
      })
    }
    
    if (sessionId) {
      console.log('强制登出请求:', { sessionId })
      
      const updateResult = await systemSettingsDb
        .update(loginLogs)
        .set({ isActive: false })
        .where(eq(loginLogs.sessionId, sessionId)) as any
      
      console.log('更新结果:', updateResult)
      
      if (updateResult?.[0]?.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: '未找到对应的登录日志' },
          { status: 404 }
        )
      }
      
      console.log('强制登出成功:', { sessionId })
      
      return NextResponse.json({
        success: true,
        message: '强制登出成功'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '缺少id或sessionId参数' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('操作失败:', error)
    return NextResponse.json(
      { success: false, error: '操作失败: ' + error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('开始处理登录日志GET请求')
    
    // 临时绕过认证 - 仅用于测试
    console.log('临时绕过认证，直接处理请求')
    
    // 解析查询参数
    const searchParams = request.nextUrl.searchParams
    const isActiveParam = searchParams.get('isActive')
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    
    console.log('原始查询参数:', { 
      userId: searchParams.get('userId'),
      email: searchParams.get('email'),
      ipAddress: searchParams.get('ipAddress'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      isActive: isActiveParam,
      page,
      limit
    })

    // 简单的参数验证
    const page_num = page ? parseInt(page) : 1
    const limit_num = limit ? parseInt(limit) : 20

    if (isNaN(page_num) || page_num < 1) {
      return NextResponse.json(
        { success: false, error: 'page参数必须是大于0的整数' },
        { status: 400 }
      )
    }

    if (isNaN(limit_num) || limit_num < 1 || limit_num > 100) {
      return NextResponse.json(
        { success: false, error: 'limit参数必须是1-100之间的整数' },
        { status: 400 }
      )
    }

    // 构建查询条件
    const conditions = []

    if (searchParams.get('userId')) {
      conditions.push(eq(loginLogs.userId, searchParams.get('userId')!))
    }

    if (searchParams.get('email')) {
      conditions.push(like(loginLogs.email, `%${searchParams.get('email')}%`))
    }

    if (searchParams.get('ipAddress')) {
      conditions.push(like(loginLogs.ipAddress, `%${searchParams.get('ipAddress')}%`))
    }

    if (searchParams.get('startDate')) {
      conditions.push(gte(loginLogs.loginTime, new Date(searchParams.get('startDate')!)))
    }

    if (searchParams.get('endDate')) {
      conditions.push(lte(loginLogs.loginTime, new Date(searchParams.get('endDate')!)))
    }

    if (isActiveParam === 'true' || isActiveParam === 'false') {
      conditions.push(eq(loginLogs.isActive, isActiveParam === 'true'))
    }

    // 计算偏移量
    const offset = (page_num - 1) * limit_num

    // 执行查询
    const logs = await systemSettingsDb
      .select()
      .from(loginLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(loginLogs.loginTime))
      .limit(limit_num)
      .offset(offset)

    // 获取总数
    const totalCountResult = await systemSettingsDb
      .select({ count: sql<number>`count(*)` })
      .from(loginLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const totalCount = totalCountResult[0]?.count || 0

    console.log('查询结果:', { logsCount: logs.length, totalCount })

    return NextResponse.json({
      success: true,
      data: {
        logs: logs,
        pagination: {
          page: page_num,
          limit: limit_num,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit_num)
        }
      }
    })
  } catch (error) {
    console.error('获取登录日志失败:', error)
    return NextResponse.json(
      { success: false, error: '获取登录日志失败' },
      { status: 500 }
    )
  }
}
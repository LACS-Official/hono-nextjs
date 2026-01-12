import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 验证当前用户是否是管理员
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 403 }
      )
    }

    const { userId, role } = await request.json()
    
    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: '用户ID和角色不能为空' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } }
    )
    
    if (error) {
      console.error('更新用户角色失败:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '用户角色更新成功',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: data.user?.user_metadata?.role
        }
      }
    })
  } catch (error) {
    console.error('更新用户角色请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: '更新用户角色请求处理失败' },
      { status: 500 }
    )
  }
}
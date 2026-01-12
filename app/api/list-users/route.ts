import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    const users = data.users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role,
      created_at: user.created_at
    }))
    
    return NextResponse.json({
      success: true,
      message: '获取用户列表成功',
      data: users
    })
  } catch (error) {
    console.error('获取用户列表请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: '获取用户列表请求处理失败' },
      { status: 500 }
    )
  }
}
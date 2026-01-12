import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('登录失败:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          name: data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || '',
          role: data.user?.user_metadata?.role
        },
        session: data.session
      }
    })
  } catch (error) {
    console.error('登录请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: '登录请求处理失败' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
          role: 'admin'
        }
      }
    })
    
    if (error) {
      console.error('注册失败:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }
    
    // 如果注册成功但没有会话，可能需要邮箱验证
    if (data.user && !data.session) {
      return NextResponse.json({
        success: true,
        message: '注册成功，请检查邮箱进行验证',
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            role: data.user.user_metadata?.role
          },
          needsEmailVerification: true
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: '注册成功',
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
    console.error('注册请求处理失败:', error)
    return NextResponse.json(
      { success: false, error: '注册请求处理失败' },
      { status: 500 }
    )
  }
}
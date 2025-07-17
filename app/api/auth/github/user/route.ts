import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: '缺少访问令牌' }, { status: 401 })
  }
  
  const accessToken = authHeader.substring(7)
  
  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!userResponse.ok) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }
    
    const userData = await userResponse.json()
    
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        html_url: userData.html_url,
      }
    })
    
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json({ error: '获取用户信息时发生错误' }, { status: 500 })
  }
} 
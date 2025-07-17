import { NextRequest, NextResponse } from 'next/server'

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://api-g.lacs.cc/api/auth/github/callback'

// 允许的用户名和邮箱
const ALLOWED_USERNAME = 'LACS-Official'
const ALLOWED_EMAIL = '2935278133@qq.com'

// 前端登录结果页地址
const FRONTEND_URL = 'https://admin.lacs.cc/oauth-result'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  if (error) {
    const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('GitHub OAuth 授权失败')}&details=${encodeURIComponent(error)}`
    return NextResponse.redirect(errorUrl)
  }
  
  if (!code) {
    const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('缺少授权码')}`
    return NextResponse.redirect(errorUrl)
  }
  
  try {
    // 使用授权码交换访问令牌
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'hono-nextjs-oauth-app'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      signal: AbortSignal.timeout(30000)
    })
    
    if (!tokenResponse.ok) {
      console.error('Token response error:', tokenResponse.status, tokenResponse.statusText)
      const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('获取访问令牌失败')}`
      return NextResponse.redirect(errorUrl)
    }
    
    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.error('Token data error:', tokenData)
      const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('获取访问令牌失败')}&details=${encodeURIComponent(tokenData.error_description || '')}`
      return NextResponse.redirect(errorUrl)
    }
    
    const accessToken = tokenData.access_token
    
    if (!accessToken) {
      const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('未获取到访问令牌')}`
      return NextResponse.redirect(errorUrl)
    }
    
    // 使用访问令牌获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'hono-nextjs-oauth-app'
      },
      signal: AbortSignal.timeout(15000)
    })
    
    if (!userResponse.ok) {
      console.error('User response error:', userResponse.status, userResponse.statusText)
      const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('获取用户信息失败')}`
      return NextResponse.redirect(errorUrl)
    }
    
    const userData = await userResponse.json()
    
    // 获取用户邮箱
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'hono-nextjs-oauth-app'
      },
      signal: AbortSignal.timeout(15000)
    })
    
    let primaryEmail = ''
    if (emailsResponse.ok) {
      const emailsData = await emailsResponse.json()
      primaryEmail = emailsData.find((email: any) => email.primary)?.email || ''
    }
    
    // 权限校验：只允许指定用户名和邮箱
    if (userData.login !== ALLOWED_USERNAME || primaryEmail !== ALLOWED_EMAIL) {
      const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent('该账号无权限登录')}`
      return NextResponse.redirect(errorUrl)
    }
    
    // 将用户信息和令牌编码到 URL 参数中
    const userInfo = {
      id: userData.id,
      login: userData.login,
      name: userData.name,
      email: primaryEmail,
      avatar_url: userData.avatar_url,
      html_url: userData.html_url,
    }
    
    const successUrl = `${FRONTEND_URL}?success=true&user=${encodeURIComponent(JSON.stringify(userInfo))}&token=${encodeURIComponent(accessToken)}`
    return NextResponse.redirect(successUrl)
    
  } catch (error: any) {
    console.error('GitHub OAuth 错误:', error)
    let errorMessage = '处理 OAuth 回调时发生错误'
    if (error.name === 'AbortError') {
      errorMessage = '请求超时，请稍后重试'
    }
    if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
      errorMessage = '网络连接超时，请检查网络连接'
    }
    const errorUrl = `${FRONTEND_URL}?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.message || '')}`
    return NextResponse.redirect(errorUrl)
  }
} 
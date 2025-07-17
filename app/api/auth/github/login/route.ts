import { NextRequest, NextResponse } from 'next/server'

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback'

// 生成随机状态值用于 CSRF 保护
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function GET(request: NextRequest) {
  const state = generateState()
  
  // 在实际应用中，应该将 state 存储在 session 或数据库中
  // 这里简化处理，直接使用
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email&state=${state}`
  
  return NextResponse.redirect(githubAuthUrl)
} 
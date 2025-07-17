'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

export default function OAuthTestPage() {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查 URL 参数
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const errorParam = urlParams.get('error')
    const userParam = urlParams.get('user')
    const tokenParam = urlParams.get('token')
    const detailsParam = urlParams.get('details')
    
    if (errorParam) {
      setError(errorParam + (detailsParam ? `: ${detailsParam}` : ''))
      // 清除 URL 参数
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }
    
    if (success === 'true' && userParam && tokenParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        setUser(userData)
        // 存储访问令牌
        localStorage.setItem('github_access_token', decodeURIComponent(tokenParam))
        // 清除 URL 参数
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (err) {
        setError('解析用户信息失败')
        console.error('解析用户信息错误:', err)
      }
      return
    }
    
    // 检查是否有授权码（旧的回调方式）
    const code = urlParams.get('code')
    if (code) {
      handleCallback(code)
    }
  }, [])

  const handleCallback = async (code: string) => {
    setLoading(true)
    setError(null)
    
    try {
      // 构建回调 URL
      const callbackUrl = `${window.location.origin}/api/auth/github/callback?code=${code}`
      
      const response = await fetch(callbackUrl)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        // 存储访问令牌（在实际应用中应该更安全地处理）
        localStorage.setItem('github_access_token', data.access_token)
      } else {
        setError(data.error || '登录失败')
      }
    } catch (err) {
      setError('处理回调时发生错误')
      console.error('OAuth 回调错误:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setLoading(true)
    // 重定向到 GitHub OAuth 登录
    window.location.href = '/api/auth/github/login'
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('github_access_token')
    // 清除 URL 参数
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  const getUserInfo = async () => {
    const token = localStorage.getItem('github_access_token')
    if (!token) {
      setError('没有访问令牌')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/github/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
      } else {
        setError(data.error || '获取用户信息失败')
        localStorage.removeItem('github_access_token')
      }
    } catch (err) {
      setError('获取用户信息时发生错误')
      console.error('获取用户信息错误:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              GitHub OAuth 登录测试
            </h1>
            <p className="text-gray-600">
              测试 GitHub OAuth 登录功能
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">处理中...</p>
            </div>
          )}

          {!user ? (
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? '处理中...' : '使用 GitHub 登录'}
              </button>
              
              <button
                onClick={getUserInfo}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                获取用户信息
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.name || user.login}
                  </h2>
                  <p className="text-gray-600">@{user.login}</p>
                  {user.email && (
                    <p className="text-sm text-gray-500">{user.email}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  查看 GitHub 主页
                </a>
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  退出登录
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              返回首页
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { message } from 'antd'

// 用户信息接口
export interface User {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
}

// 认证上下文接口
interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 检查认证状态
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Check auth error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // 登录函数
  const login = () => {
    window.location.href = '/api/auth/github/login'
  }

  // 登出函数
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setUser(null)
        message.success('已成功登出')
        // 重定向到登录页面
        window.location.href = '/login'
      } else {
        message.error('登出失败')
      }
    } catch (error) {
      console.error('Logout error:', error)
      message.error('登出失败')
    }
  }

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证上下文的 Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

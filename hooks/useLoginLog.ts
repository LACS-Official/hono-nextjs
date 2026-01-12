import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * 登录日志Hook
 * 用于记录用户登录信息
 */
export const useLoginLog = () => {
  const recordLoginLog = async () => {
    try {
      const supabase = createClient()
      
      // 获取当前会话信息
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session || !session.user) {
        console.error('没有有效的用户会话')
        return
      }
      
      const userId = session.user.id
      const email = session.user.email || ''
      // Supabase会话ID可能不是直接通过session.id获取
      // 尝试使用access_token作为会话标识符
      // 注意：sessionId字段在数据库中限制为255字符，所以需要截取
      const sessionId = (session.access_token || 'unknown').substring(0, 255)

      // 在客户端获取真实公网IP
      let clientIp = '未知'
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        if (ipResponse.ok) {
          const ipData = await ipResponse.json()
          clientIp = ipData.ip
        }
      } catch (ipError) {
        console.warn('获取客户端IP失败:', ipError)
        // 备用方案：使用其他IP查询服务
        try {
          const backupResponse = await fetch('https://ipinfo.io/json')
          if (backupResponse.ok) {
            const backupData = await backupResponse.json()
            clientIp = backupData.ip
          }
        } catch (backupError) {
          console.warn('备用IP获取也失败:', backupError)
        }
      }
      
      console.log('客户端获取的真实IP:', clientIp)
      
      // 调用登录日志API记录登录信息
      const response = await fetch('/api/login-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
          sessionId,
          clientIp
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('记录登录日志失败:', errorData.error)
      } else {
        const result = await response.json()
        console.log('登录日志记录成功:', result)
      }
    } catch (error) {
      console.error('记录登录日志失败:', error)
    }
  }

  return { recordLoginLog }
}

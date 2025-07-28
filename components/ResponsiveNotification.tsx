'use client'

import { message, notification } from 'antd'
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  CloseCircleOutlined 
} from '@ant-design/icons'

// 响应式通知配置
const getNotificationConfig = () => {
  return {
    placement: 'topRight' as const,
    duration: 4.5,
    style: {
      width: '400px',
      marginTop: '80px', // 避免被导航栏遮挡
    }
  }
}

// 响应式消息配置
const getMessageConfig = () => {
  return {
    duration: 3,
    maxCount: 3,
    style: {
      marginTop: '80px',
      fontSize: '14px',
    }
  }
}

// 响应式通知工具类
export class ResponsiveNotification {
  // 成功通知
  static success(title: string, description?: string) {
    if (description) {
      // 有描述的通知
      const config = getNotificationConfig()
      notification.success({
        message: title,
        description,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        ...config
      })
    } else {
      // 简单消息
      message.success({
        content: title,
        ...getMessageConfig()
      })
    }
  }

  // 错误通知
  static error(title: string, description?: string) {
    if (description) {
      // 有描述的通知
      const config = getNotificationConfig()
      notification.error({
        message: title,
        description,
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        ...config
      })
    } else {
      // 简单消息
      message.error({
        content: title,
        ...getMessageConfig()
      })
    }
  }

  // 警告通知
  static warning(title: string, description?: string) {
    if (description) {
      // 有描述的通知
      const config = getNotificationConfig()
      notification.warning({
        message: title,
        description,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        ...config
      })
    } else {
      // 简单消息
      message.warning({
        content: title,
        ...getMessageConfig()
      })
    }
  }

  // 信息通知
  static info(title: string, description?: string) {
    if (description) {
      // 有描述的通知
      const config = getNotificationConfig()
      notification.info({
        message: title,
        description,
        icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        ...config
      })
    } else {
      // 简单消息
      message.info({
        content: title,
        ...getMessageConfig()
      })
    }
  }

  // 加载中通知
  static loading(title: string) {
    const config = getMessageConfig()

    return message.loading({
      content: title,
      ...config,
      duration: 0, // 不自动关闭，覆盖 config 中的 duration
    })
  }

  // 关闭所有通知
  static destroy() {
    message.destroy()
    notification.destroy()
  }
}

// 便捷的导出函数
export const showSuccess = ResponsiveNotification.success
export const showError = ResponsiveNotification.error
export const showWarning = ResponsiveNotification.warning
export const showInfo = ResponsiveNotification.info
export const showLoading = ResponsiveNotification.loading
export const hideAll = ResponsiveNotification.destroy

// API 响应处理工具
export class ApiResponseHandler {
  // 处理 API 成功响应
  static handleSuccess(response: any, successMessage?: string) {
    if (response.success) {
      if (successMessage) {
        showSuccess(successMessage)
      }
      return response.data
    } else {
      throw new Error(response.error || '操作失败')
    }
  }

  // 处理 API 错误响应
  static handleError(error: any, context?: string) {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error)
    
    let errorMessage = '操作失败，请稍后重试'
    
    if (error.response) {
      // HTTP 错误响应
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400:
          errorMessage = data?.error || '请求参数错误'
          break
        case 401:
          errorMessage = '身份验证失败，请重新登录'
          break
        case 403:
          errorMessage = '权限不足，无法执行此操作'
          break
        case 404:
          errorMessage = '请求的资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = data?.error || `请求失败 (${status})`
      }
    } else if (error.message) {
      // 网络错误或其他错误
      if (error.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else {
        errorMessage = error.message
      }
    }
    
    showError(errorMessage)
    throw error
  }

  // 处理加载状态
  static async handleLoading<T>(
    promise: Promise<T>, 
    loadingMessage: string = '处理中...'
  ): Promise<T> {
    const hide = showLoading(loadingMessage)
    
    try {
      const result = await promise
      hide()
      return result
    } catch (error) {
      hide()
      throw error
    }
  }
}

// 表单验证消息处理
export class FormMessageHandler {
  // 显示表单验证错误
  static showValidationErrors(errors: Record<string, string[]>) {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n')
    
    showError('表单验证失败', errorMessages)
  }

  // 显示表单提交成功
  static showSubmitSuccess(message: string = '提交成功') {
    showSuccess(message)
  }

  // 显示表单提交失败
  static showSubmitError(error: any) {
    ApiResponseHandler.handleError(error, 'form submission')
  }
}

export default ResponsiveNotification

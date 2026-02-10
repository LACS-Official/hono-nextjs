'use client'

import { toast } from '@/hooks/use-toast'

// 响应式通知工具类
export class ResponsiveNotification {
  // 成功通知
  static success(title: string, description?: string) {
    toast({
      title,
      description,
    })
  }

  // 错误通知
  static error(title: string, description?: string) {
    toast({
      variant: "destructive",
      title,
      description,
    })
  }

  // 警告通知
  static warning(title: string, description?: string) {
    toast({
      title: `警告: ${title}`,
      description,
    })
  }

  // 信息通知
  static info(title: string, description?: string) {
    toast({
      title,
      description,
    })
  }

  // 加载中通知
  static loading(title: string) {
    // Shadcn Toast 不直接支持 Loading 状态持续保持，通常由调用方控制 loading 状态
    return toast({
      title: "处理中",
      description: title,
    })
  }

  // 关闭所有通知
  static destroy() {
    // 目前没有直接的全局销毁方法，Toast 会自动消失
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
      const status = error.response.status
      const data = error.response.data
      
      switch (status) {
        case 400: errorMessage = data?.error || '请求参数错误'; break
        case 401: errorMessage = '身份验证失败，请重新登录'; break
        case 403: errorMessage = '权限不足，无法执行此操作'; break
        case 404: errorMessage = '请求的资源不存在'; break
        case 500: errorMessage = '服务器内部错误'; break
        default: errorMessage = data?.error || `请求失败 (${status})`
      }
    } else if (error.message) {
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
    // 注意: shadcn toast 不支持直接的 API 级 loading 覆盖，这里简单提示
    try {
      return await promise
    } catch (error) {
      throw error
    }
  }
}

// 表单验证消息处理
export class FormMessageHandler {
  static showValidationErrors(errors: Record<string, string[]>) {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n')
    
    showError('表单验证失败', errorMessages)
  }

  static showSubmitSuccess(message: string = '提交成功') {
    showSuccess(message)
  }

  static showSubmitError(error: any) {
    ApiResponseHandler.handleError(error, 'form submission')
  }
}

export default ResponsiveNotification

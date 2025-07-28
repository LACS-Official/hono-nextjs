// 激活码管理 API 工具类
// 统一处理激活码相关的 API 调用和错误处理

// API 错误接口
export interface ActivationCodeApiError {
  status: number
  message: string
  success: false
  error: string
}

// API验证信息接口
export interface ApiValidationInfo {
  expiresAt: string
  remainingTime: number
  message: string
}

// 激活码数据接口
export interface ActivationCode {
  id: string
  code: string
  createdAt: string
  expiresAt: string
  isUsed: boolean
  usedAt?: string
  isExpired?: boolean
  activatedAt?: string
  apiValidation?: ApiValidationInfo
  metadata?: {
    customerEmail?: string
    licenseType?: string
    purchaseId?: string
    customerId?: string
    [key: string]: unknown
  }
  productInfo?: {
    name: string
    version: string
    features: string[]
  }
}

// API 响应接口
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 分页信息接口
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 激活码列表响应接口
export interface ActivationCodeListResponse {
  codes: ActivationCode[]
  pagination: PaginationInfo
}

// 激活码统计信息接口
export interface ActivationCodeStats {
  total: number
  used: number
  unused: number
  expired: number
  active: number
  usageRate: number
  expirationRate: number
}

// 创建激活码请求接口
export interface CreateActivationCodeRequest {
  expirationDays?: number
  metadata?: {
    customerEmail?: string
    licenseType?: string
    purchaseId?: string
    customerId?: string
    [key: string]: unknown
  }
  productInfo?: {
    name: string
    version: string
    features: string[]
  }
}

// 验证激活码请求接口
export interface VerifyActivationCodeRequest {
  code: string
}

// 清理过期激活码请求接口
export interface CleanupExpiredCodesRequest {
  daysOld?: number
}

// 清理未使用激活码请求接口
export interface CleanupUnusedCodesRequest {
  minutesOld?: number
}

// 清理未使用激活码响应接口
export interface CleanupUnusedCodesResponse {
  message: string
  deletedCount: number
  minutesOld: number
  cleanupTime: string
  deletedCodes: Array<{
    id: string
    code: string
    createdAt: string
    expiresAt: string
  }>
}

// 激活码状态枚举
export type ActivationCodeStatus = 'all' | 'used' | 'unused' | 'expired' | 'active'

export class ActivationCodeApiClient {
  private baseUrl: string

  constructor(baseUrl = 'https://api-g.lacs.cc/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '') // 移除末尾斜杠
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let responseData: unknown
    
    try {
      responseData = await response.json()
    } catch {
      throw {
        status: response.status,
        message: `网络错误: 无法解析服务器响应`,
        success: false,
        error: '网络错误'
      } as ActivationCodeApiError
    }

    const data = responseData as ApiResponse<T>

    if (!response.ok || !data.success) {
      const error: ActivationCodeApiError = {
        status: response.status,
        message: data.error || `请求失败: ${response.status}`,
        success: false,
        error: data.error || '未知错误'
      }

      // 根据状态码提供更友好的错误消息
      switch (response.status) {
        case 400:
          error.message = data.error || '请求参数错误，请检查输入信息'
          break
        case 401:
          error.message = '身份验证失败，请重新登录'
          break
        case 403:
          error.message = '权限不足，无法执行此操作'
          break
        case 404:
          error.message = data.error || '请求的资源不存在'
          break
        case 500:
          error.message = '服务器内部错误，请稍后重试'
          break
        default:
          error.message = data.error || `请求失败 (${response.status})`
      }

      throw error
    }

    return data.data as T
  }

  /**
   * 生成新的激活码
   */
  async createActivationCode(request: CreateActivationCodeRequest): Promise<ActivationCode> {
    const response = await fetch(`${this.baseUrl}/activation-codes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })
    
    return this.handleResponse<ActivationCode>(response)
  }

  /**
   * 验证激活码
   */
  async verifyActivationCode(request: VerifyActivationCodeRequest): Promise<ActivationCode> {
    const response = await fetch(`${this.baseUrl}/activation-codes/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })
    
    return this.handleResponse<ActivationCode>(response)
  }

  /**
   * 获取激活码列表
   */
  async getActivationCodes(
    page = 1,
    limit = 10,
    status: ActivationCodeStatus = 'all'
  ): Promise<ActivationCodeListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
    })

    const response = await fetch(`${this.baseUrl}/activation-codes?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<ActivationCodeListResponse>(response)
  }

  /**
   * 获取单个激活码详情
   */
  async getActivationCodeById(id: string): Promise<ActivationCode> {
    const response = await fetch(`${this.baseUrl}/activation-codes/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<ActivationCode>(response)
  }

  /**
   * 删除激活码
   */
  async deleteActivationCode(id: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/activation-codes/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<{ message: string }>(response)
  }

  /**
   * 获取激活码统计信息
   */
  async getActivationCodeStats(): Promise<ActivationCodeStats> {
    const response = await fetch(`${this.baseUrl}/activation-codes/stats`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<ActivationCodeStats>(response)
  }

  /**
   * 清理过期激活码
   */
  async cleanupExpiredCodes(request: CleanupExpiredCodesRequest = {}): Promise<{
    message: string
    deletedCount: number
  }> {
    const response = await fetch(`${this.baseUrl}/activation-codes/cleanup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })

    return this.handleResponse<{ message: string; deletedCount: number }>(response)
  }

  /**
   * 清理未使用的激活码
   */
  async cleanupUnusedCodes(request: CleanupUnusedCodesRequest = {}): Promise<CleanupUnusedCodesResponse> {
    const response = await fetch(`${this.baseUrl}/activation-codes/cleanup-unused`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })

    return this.handleResponse<CleanupUnusedCodesResponse>(response)
  }

  /**
   * 预览将要被清理的未使用激活码
   */
  async previewUnusedCodesCleanup(minutesOld: number = 5): Promise<{
    message: string
    count: number
    minutesOld: number
    cutoffTime: string
    codes: Array<{
      id: string
      code: string
      createdAt: string
      expiresAt: string
      minutesSinceCreation: number
    }>
  }> {
    const response = await fetch(`${this.baseUrl}/activation-codes/cleanup-unused?minutesOld=${minutesOld}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<{
      message: string
      count: number
      minutesOld: number
      cutoffTime: string
      codes: Array<{
        id: string
        code: string
        createdAt: string
        expiresAt: string
        minutesSinceCreation: number
      }>
    }>(response)
  }
}

// 创建全局实例
export const activationCodeApi = new ActivationCodeApiClient('https://api-g.lacs.cc/api')

// 工具函数：格式化激活码状态
export function getActivationCodeStatusText(code: ActivationCode): string {
  if (code.isUsed) {
    return '已使用'
  }

  const now = new Date()
  const expiresAt = new Date(code.expiresAt)

  if (expiresAt < now) {
    return '已过期'
  }

  return '有效'
}

// 工具函数：获取激活码状态颜色
export function getActivationCodeStatusColor(code: ActivationCode): string {
  if (code.isUsed) {
    return 'success'
  }

  const now = new Date()
  const expiresAt = new Date(code.expiresAt)

  if (expiresAt < now) {
    return 'error'
  }

  return 'processing'
}

// 工具函数：格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 工具函数：计算剩余天数
export function getDaysUntilExpiration(expiresAt: string): number {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffTime = expires.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

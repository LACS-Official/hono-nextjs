// 软件管理 API 工具类
// 统一处理软件相关的 API 调用和错误处理

// API 错误接口
export interface SoftwareApiError {
  status: number
  message: string
  success: false
  error: string
}

// 软件数据接口
export interface Software {
  id: number
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersionId?: number | null
  currentVersion: string
  latestVersion?: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: {
    os?: string[]
    memory?: string
    storage?: string
    processor?: string
    graphics?: string
    other?: string
  }
  openname?: string // 软件启动文件名或命令
  filetype?: string // 软件包文件格式类型
  isActive: boolean
  sortOrder: number
  metadata?: any
  createdAt: string
  updatedAt: string
}

// 版本历史接口
export interface VersionHistory {
  id: number
  softwareId: number
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: {
    official?: string
    quark?: string
    pan123?: string
    baidu?: string
    thunder?: string
    backup?: string[]
  }
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable: boolean
  isBeta: boolean
  isPrerelease: boolean
  versionType: string
  changelogCategory?: string[]
  metadata?: any
  createdAt: string
  updatedAt: string
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
  hasNext: boolean
  hasPrev: boolean
}

// 软件列表响应接口
export interface SoftwareListResponse {
  software: Software[]
  pagination: PaginationInfo
}

// 创建软件请求接口
export interface CreateSoftwareRequest {
  name: string
  nameEn?: string
  description?: string
  descriptionEn?: string
  currentVersion: string
  officialWebsite?: string
  category?: string
  tags?: string[]
  systemRequirements?: any
  openname?: string // 软件启动文件名或命令
  filetype?: string // 软件包文件格式类型
  isActive?: boolean
  sortOrder?: number
  metadata?: any
}

// 更新软件请求接口
export interface UpdateSoftwareRequest extends Partial<CreateSoftwareRequest> {}

// 创建版本请求接口
export interface CreateVersionRequest {
  version: string
  releaseDate: string
  releaseNotes?: string
  releaseNotesEn?: string
  downloadLinks?: {
    official?: string
    quark?: string
    pan123?: string
    baidu?: string
    thunder?: string
    backup?: string[]
  }
  fileSize?: string
  fileSizeBytes?: number
  fileHash?: string
  isStable?: boolean
  isBeta?: boolean
  isPrerelease?: boolean
  changelogCategory?: string[]
  metadata?: any
}

/**
 * 软件管理 API 客户端类
 */
export class SoftwareApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // 优先使用传入的baseUrl，然后是环境变量，最后是默认值
    const defaultUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/app`  // 浏览器环境使用当前域名
      : process.env.NEXT_PUBLIC_API_URL
    
    this.baseUrl = (baseUrl || defaultUrl || '').replace(/\/$/, '') // 移除末尾斜杠
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error: SoftwareApiError = {
        status: response.status,
        message: errorData.error || response.statusText,
        success: false,
        error: errorData.error || response.statusText
      }
      throw error
    }

    const data = await response.json()
    if (!data.success) {
      const error: SoftwareApiError = {
        status: response.status,
        message: data.error || '请求失败',
        success: false,
        error: data.error || '请求失败'
      }
      throw error
    }

    return data.data
  }

  /**
   * 获取软件列表
   */
  async getSoftwareList(
    page = 1,
    limit = 10,
    search?: string,
    category?: string,
    isActive?: string
  ): Promise<SoftwareListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (search) params.append('search', search)
    if (category) params.append('category', category)
    if (isActive) params.append('isActive', isActive)

    const response = await fetch(`${this.baseUrl}/software?${params}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<SoftwareListResponse>(response)
  }

  /**
   * 获取单个软件详情
   */
  async getSoftwareById(id: number): Promise<Software> {
    const response = await fetch(`${this.baseUrl}/software/id/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<Software>(response)
  }

  /**
   * 根据名称获取软件详情
   */
  async getSoftwareByName(name: string): Promise<Software> {
    const response = await fetch(`${this.baseUrl}/software/${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<Software>(response)
  }

  /**
   * 创建新软件
   */
  async createSoftware(request: CreateSoftwareRequest): Promise<Software> {
    const response = await fetch(`${this.baseUrl}/software`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })
    
    return this.handleResponse<Software>(response)
  }

  /**
   * 更新软件信息
   */
  async updateSoftware(id: number, request: UpdateSoftwareRequest): Promise<Software> {
    const response = await fetch(`${this.baseUrl}/software/id/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })
    
    return this.handleResponse<Software>(response)
  }

  /**
   * 删除软件
   */
  async deleteSoftware(id: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/software/id/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<{ message: string }>(response)
  }

  /**
   * 获取软件版本历史
   */
  async getVersionHistory(softwareId: number): Promise<VersionHistory[]> {
    const response = await fetch(`${this.baseUrl}/software/id/${softwareId}/versions`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<VersionHistory[]>(response)
  }

  /**
   * 添加新版本
   */
  async createVersion(softwareId: number, request: CreateVersionRequest): Promise<VersionHistory> {
    const response = await fetch(`${this.baseUrl}/software/id/${softwareId}/versions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })
    
    return this.handleResponse<VersionHistory>(response)
  }
}

// 创建全局实例 - 使用动态URL配置
export const softwareApi = new SoftwareApiClient()


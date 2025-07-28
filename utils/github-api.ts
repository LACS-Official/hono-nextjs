// GitHub API 工具函数
// 统一处理 GitHub API 调用和错误处理

export interface GitHubApiError {
  status: number
  message: string
  isNotFound: boolean
  isUnauthorized: boolean
  isRateLimited: boolean
}

export class GitHubApiClient {
  private token: string | null = null
  private baseUrl = 'https://api.github.com'

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('github_access_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
    }
    
    if (this.token) {
      headers['Authorization'] = `token ${this.token}`
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      return await response.json()
    }

    const error: GitHubApiError = {
      status: response.status,
      message: `GitHub API 请求失败: ${response.status}`,
      isNotFound: response.status === 404,
      isUnauthorized: response.status === 401,
      isRateLimited: response.status === 403,
    }

    // 尝试获取更详细的错误信息
    try {
      const errorData = await response.json()
      if (errorData.message) {
        error.message = errorData.message
      }
    } catch {
      // 忽略解析错误，使用默认消息
    }

    // 根据错误类型提供更友好的消息
    if (error.isNotFound) {
      error.message = '请求的资源不存在，可能是仓库不存在或您没有访问权限'
    } else if (error.isUnauthorized) {
      error.message = 'GitHub 访问令牌无效或已过期，请重新登录'
    } else if (error.isRateLimited) {
      error.message = 'GitHub API 请求频率限制，请稍后再试'
    }

    throw error
  }

  // 检查仓库是否存在
  async checkRepository(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.getHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }

  // 获取仓库文件树
  async getRepositoryTree(owner: string, repo: string, branch = 'main'): Promise<{
    tree: Array<{ path: string; sha: string; type: string }>
  }> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: this.getHeaders(),
      }
    )
    return this.handleResponse(response)
  }

  // 获取文件内容
  async getFileContent(owner: string, repo: string, path: string): Promise<{
    content: string
    sha: string
  }> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: this.getHeaders(),
      }
    )
    return this.handleResponse(response)
  }

  // 更新文件内容
  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<{ content: { sha: string } }> {
    const contentBase64 = typeof window !== 'undefined' && window.btoa
      ? window.btoa(unescape(encodeURIComponent(content)))
      : Buffer.from(content, 'utf-8').toString('base64')

    const body: Record<string, unknown> = {
      message,
      content: contentBase64,
    }

    if (sha) {
      body.sha = sha
    }

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      }
    )
    return this.handleResponse(response)
  }

  // 获取用户仓库列表
  async getUserRepositories(): Promise<Array<{
    id: number
    name: string
    description: string | null
    html_url: string
    language: string | null
    stargazers_count: number
    forks_count: number
    updated_at: string
    private: boolean
    topics: string[]
  }>> {
    const response = await fetch(`${this.baseUrl}/user/repos?per_page=100`, {
      headers: this.getHeaders(),
    })
    return this.handleResponse(response)
  }

  // Base64 解码工具函数
  static base64ToUtf8(base64: string): string {
    try {
      if (typeof window !== 'undefined' && window.atob) {
        const binary = window.atob(base64)
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
        return new TextDecoder('utf-8').decode(bytes)
      } else {
        return Buffer.from(base64, 'base64').toString('utf-8')
      }
    } catch (error) {
      console.error('Base64 解码失败:', error)
      return ''
    }
  }
}

// 默认的仓库配置
export const DEFAULT_HUGO_REPO = {
  owner: 'LACS-Official',
  name: 'appwebsite-hugo',
  branch: 'main'
}

// 获取当前用户的仓库配置
export function getUserHugoRepo(): { owner: string; name: string; branch: string } {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('github_user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        return {
          owner: user.login || DEFAULT_HUGO_REPO.owner,
          name: DEFAULT_HUGO_REPO.name,
          branch: DEFAULT_HUGO_REPO.branch
        }
      } catch (error) {
        console.warn('Failed to parse user info:', error)
      }
    }
  }
  return DEFAULT_HUGO_REPO
}

// Hugo 文章数据接口
export interface HugoArticleData {
  title: string
  date: string
  draft: boolean
  categories: string[]
  tags: string[]
  version?: string
  size?: string
  downloads?: {
    official?: string
    quark?: string
    netdisk?: string
    baidu?: string
    thunder?: string
  }
  official_website?: string
  platforms?: string[]
  system_requirements?: {
    [key: string]: string[]
  }
  changelog?: string[]
  previous_versions?: Array<{
    version: string
    date: string
    changes: string[]
  }>
  image?: string
  content: string
}

// 生成完整的 Hugo Markdown 内容
export function generateHugoMarkdown(data: HugoArticleData): string {
  const frontmatter: string[] = ['---']

  // 基础字段
  frontmatter.push(`title: "${data.title}"`)
  frontmatter.push(`date: ${data.date}${data.date.includes('T') ? '' : 'T00:00:00+08:00'}`)
  frontmatter.push(`draft: ${data.draft}`)

  // 分类和标签
  if (data.categories && data.categories.length > 0) {
    frontmatter.push('categories:')
    data.categories.forEach(cat => frontmatter.push(`  - "${cat}"`))
  }

  if (data.tags && data.tags.length > 0) {
    frontmatter.push('tags:')
    data.tags.forEach(tag => frontmatter.push(`  - "${tag}"`))
  }

  // 软件相关字段
  if (data.version) frontmatter.push(`version: "${data.version}"`)
  if (data.size) frontmatter.push(`size: "${data.size}"`)
  if (data.official_website) frontmatter.push(`official_website: "${data.official_website}"`)
  if (data.image) frontmatter.push(`image: "${data.image}"`)

  // 平台支持
  if (data.platforms && data.platforms.length > 0) {
    frontmatter.push(`platforms: [${data.platforms.map(p => `"${p}"`).join(', ')}]`)
  }

  // 下载链接
  if (data.downloads && Object.values(data.downloads).some(v => v)) {
    frontmatter.push('downloads:')
    if (data.downloads.official) frontmatter.push(`  official: "${data.downloads.official}"`)
    if (data.downloads.quark) frontmatter.push(`  quark: "${data.downloads.quark}"`)
    if (data.downloads.netdisk) frontmatter.push(`  netdisk: "${data.downloads.netdisk}"`)
    if (data.downloads.baidu) frontmatter.push(`  baidu: "${data.downloads.baidu}"`)
    if (data.downloads.thunder) frontmatter.push(`  thunder: "${data.downloads.thunder}"`)
  }

  // 系统要求
  if (data.system_requirements && Object.keys(data.system_requirements).length > 0) {
    frontmatter.push('system_requirements:')
    Object.entries(data.system_requirements).forEach(([os, requirements]) => {
      if (requirements && requirements.length > 0) {
        frontmatter.push(`  ${os}:`)
        requirements.forEach(req => frontmatter.push(`    - "${req}"`))
      }
    })
  }

  // 更新日志
  if (data.changelog && data.changelog.length > 0) {
    frontmatter.push('changelog:')
    data.changelog.forEach(item => frontmatter.push(`  - "${item}"`))
  }

  // 历史版本
  if (data.previous_versions && data.previous_versions.length > 0) {
    frontmatter.push('previous_versions:')
    data.previous_versions.forEach(version => {
      frontmatter.push(`  - version: "${version.version}"`)
      frontmatter.push(`    date: ${version.date}`)
      if (version.changes && version.changes.length > 0) {
        frontmatter.push('    changes:')
        version.changes.forEach(change => frontmatter.push(`      - "${change}"`))
      }
    })
  }

  frontmatter.push('---')
  frontmatter.push('')
  frontmatter.push(data.content)

  return frontmatter.join('\n')
}

// 创建全局实例
export const githubApi = new GitHubApiClient()

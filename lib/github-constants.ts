/**
 * GitHub 客户端通用常量与纯函数工具
 * 本文件专用于纯前端/客户端安全导入，不依赖任何服务端/数据库环境
 */

// 预置加速源定义
export interface AccelerationSource {
  id: string
  name: string
  prefix: string
  description?: string
  isDirect?: boolean
  isReplaceDomain?: boolean
  replaceDomainTarget?: string
}

export const ACCELERATION_SOURCES: AccelerationSource[] = [
  {
    id: 'ghproxy_net',
    name: 'GHProxy (ghproxy.net - 推荐)',
    prefix: 'https://ghproxy.net/',
    description: '国内高速稳定 GitHub 加速代理',
  },
  {
    id: 'mirror_ghproxy',
    name: 'GHProxy 镜像 (mirror.ghproxy.com)',
    prefix: 'https://mirror.ghproxy.com/',
    description: 'GHProxy 多线镜像源',
  },
  {
    id: 'gh_proxy_com',
    name: 'GitHub Proxy (gh-proxy.com)',
    prefix: 'https://gh-proxy.com/',
    description: '支持多线路 CDN 加速',
  },
  {
    id: 'kkgithub',
    name: 'KKGitHub (kkgithub.com)',
    prefix: 'https://kkgithub.com',
    isReplaceDomain: true,
    replaceDomainTarget: 'https://github.com',
    description: 'GitHub 网页与资产镜像站',
  },
  {
    id: 'direct',
    name: '官方直连 (无加速)',
    prefix: '',
    isDirect: true,
    description: '直连 GitHub 官方原站下载',
  },
  {
    id: 'custom',
    name: '自定义加速源',
    prefix: '',
    description: '手动指定加速源 URL 前缀',
  },
]

// GitHub 资产信息接口
export interface GithubReleaseAsset {
  id: number
  name: string
  size: number
  sizeFormatted: string
  downloadUrl: string
  acceleratedUrl: string
  contentType: string
  downloadCount: number
  isExecutable: boolean
}

// GitHub 发布版本信息接口
export interface GithubRelease {
  id: number
  tagName: string
  normalizedVersion: string
  name: string
  body: string
  publishedAt: string
  isPrerelease: boolean
  isDraft: boolean
  htmlUrl: string
  assets: GithubReleaseAsset[]
  primaryAsset?: GithubReleaseAsset
  existsInDb?: boolean
  existingDbVersionId?: number
}

// GitHub 仓库详情接口
export interface GithubRepoDetails {
  owner: string
  repo: string
  fullName: string
  name: string
  description: string | null
  homepage: string | null
  htmlUrl: string
  topics: string[]
  stars: number
  forks: number
  openIssues: number
  defaultBranch: string
  license: string | null
  createdAt: string
  updatedAt: string
}

// 格式化文件大小
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// 解析 GitHub 仓库地址（支持 owner/repo、完整 URL 等）
export function parseGithubRepo(input: string): { owner: string; repo: string } | null {
  if (!input) return null
  const cleaned = input.trim().replace(/\/+$/, '')

  // 1. 匹配格式: https://github.com/owner/repo 或 git@github.com:owner/repo
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com[/:]([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\/|\.git|$|\/releases)/i)
  if (urlMatch) {
    const owner = urlMatch[1]
    const repo = urlMatch[2].replace(/\.git$/, '')
    return { owner, repo }
  }

  // 2. 匹配格式: owner/repo
  const slashMatch = cleaned.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/)
  if (slashMatch) {
    return { owner: slashMatch[1], repo: slashMatch[2] }
  }

  return null
}

// 应用加速源前缀
export function applyProxyToUrl(
  originalUrl: string,
  proxyPrefix?: string,
  sourceId?: string
): string {
  if (!originalUrl) return ''
  if (!proxyPrefix || sourceId === 'direct' || proxyPrefix.trim() === '') {
    return originalUrl
  }

  // 针对 KKGitHub 域名替换模式
  if (sourceId === 'kkgithub' || proxyPrefix.includes('kkgithub.com')) {
    return originalUrl.replace('https://github.com', 'https://kkgithub.com')
  }

  const prefix = proxyPrefix.trim()
  if (prefix.endsWith('/')) {
    return `${prefix}${originalUrl}`
  }
  return `${prefix}/${originalUrl}`
}

// 判断文件是否为常见可执行或安装程序
export function isExecutableAsset(filename: string): boolean {
  const lower = filename.toLowerCase()
  return (
    lower.endsWith('.exe') ||
    lower.endsWith('.msi') ||
    lower.endsWith('.dmg') ||
    lower.endsWith('.pkg') ||
    lower.endsWith('.apk') ||
    lower.endsWith('.deb') ||
    lower.endsWith('.rpm') ||
    lower.endsWith('.zip') ||
    lower.endsWith('.7z') ||
    lower.endsWith('.tar.gz')
  )
}

// 计算资产优先级得分（越优先的资产默认作为下载主链接）
export function getAssetPriorityScore(filename: string, filterKeyword?: string): number {
  const lower = filename.toLowerCase()
  let score = 0

  if (filterKeyword && lower.includes(filterKeyword.toLowerCase())) {
    score += 100
  }

  if (lower.endsWith('.exe')) score += 50
  else if (lower.endsWith('.msi')) score += 45
  else if (lower.endsWith('.dmg')) score += 40
  else if (lower.endsWith('.apk')) score += 35
  else if (lower.endsWith('.zip')) score += 30
  else if (lower.endsWith('.7z')) score += 25
  else if (lower.endsWith('.deb') || lower.endsWith('.rpm')) score += 20
  else if (lower.endsWith('.tar.gz')) score += 15

  // 排除通常不是最终用户的纯源码包或校验文件
  if (lower.includes('sources') || lower.includes('src')) score -= 20
  if (lower.endsWith('.sha256') || lower.endsWith('.md5') || lower.endsWith('.txt') || lower.endsWith('.asc')) score -= 50

  return score
}

/**
 * GitHub 同步与加速源管理服务
 * 提供 GitHub 仓库信息获取、Release 版本解析、资产识别、镜像加速与自动入库功能
 */

import { unifiedDb as db, software, softwareVersionHistory } from '@/lib/unified-db-connection'
import { eq, and, desc } from 'drizzle-orm'
import { compareVersions, updateLatestVersion, isValidVersion } from '@/lib/version-manager'

export * from './github-constants'
import {
  AccelerationSource,
  ACCELERATION_SOURCES,
  GithubReleaseAsset,
  GithubRelease,
  GithubRepoDetails,
  formatBytes,
  parseGithubRepo,
  applyProxyToUrl,
  isExecutableAsset,
  getAssetPriorityScore,
} from './github-constants'

// 规整化 GitHub release tag 为合法的语义化版本号
export function normalizeVersion(tag: string): string {
  if (!tag) return ''
  let v = tag.trim()
  // 去除前缀 v 或 V
  if (v.startsWith('v') || v.startsWith('V')) {
    v = v.substring(1)
  }

  // 分离预发布后缀 (如 -beta.1, -rc1)
  const dashIndex = v.indexOf('-')
  let mainPart = dashIndex > -1 ? v.substring(0, dashIndex) : v
  const suffix = dashIndex > -1 ? v.substring(dashIndex) : ''

  // 规整化数字段 x.y.z
  const parts = mainPart.split('.').filter(p => /^\d+$/.test(p))
  if (parts.length === 1) {
    mainPart = `${parts[0]}.0.0`
  } else if (parts.length === 2) {
    mainPart = `${parts[0]}.${parts[1]}.0`
  } else if (parts.length >= 3) {
    mainPart = `${parts[0]}.${parts[1]}.${parts[2]}`
  }

  const result = `${mainPart}${suffix}`
  return isValidVersion(result) ? result : v
}

// 获取请求 GitHub API 通用 Header
function getGithubHeaders(customToken?: string): HeadersInit {
  const token = customToken || process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'LACS-Software-Manager/1.0',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// 拉取 GitHub 仓库详情
export async function fetchGithubRepoDetails(
  owner: string,
  repo: string,
  token?: string
): Promise<GithubRepoDetails> {
  const url = `https://api.github.com/repos/${owner}/${repo}`
  const response = await fetch(url, {
    headers: getGithubHeaders(token),
    next: { revalidate: 60 }, // 缓存 60 秒
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    if (response.status === 404) {
      throw new Error(`GitHub 仓库 ${owner}/${repo} 不存在或为私有仓库`)
    }
    if (response.status === 403) {
      throw new Error('GitHub API 调用超出频率限制，请稍后重试或配置 GITHUB_TOKEN')
    }
    throw new Error(`获取 GitHub 仓库信息失败 (${response.status}): ${errorText || response.statusText}`)
  }

  const data = await response.json()
  return {
    owner: data.owner?.login || owner,
    repo: data.name || repo,
    fullName: data.full_name || `${owner}/${repo}`,
    name: data.name || repo,
    description: data.description || null,
    homepage: data.homepage || null,
    htmlUrl: data.html_url || `https://github.com/${owner}/${repo}`,
    topics: Array.isArray(data.topics) ? data.topics : [],
    stars: data.stargazers_count || 0,
    forks: data.forks_count || 0,
    openIssues: data.open_issues_count || 0,
    defaultBranch: data.default_branch || 'main',
    license: data.license?.spdx_id || data.license?.name || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

// 拉取 GitHub Release 版本列表与资产
export async function fetchGithubReleases(
  owner: string,
  repo: string,
  token?: string,
  options?: {
    page?: number
    perPage?: number
    proxyPrefix?: string
    sourceId?: string
    assetFilter?: string
    softwareId?: number
  }
): Promise<{ releases: GithubRelease[]; total: number }> {
  const page = options?.page || 1
  const perPage = options?.perPage || 30
  const proxyPrefix = options?.proxyPrefix || 'https://ghproxy.net/'
  const sourceId = options?.sourceId || 'ghproxy_net'
  const assetFilter = options?.assetFilter

  const url = `https://api.github.com/repos/${owner}/${repo}/releases?page=${page}&per_page=${perPage}`
  const response = await fetch(url, {
    headers: getGithubHeaders(token),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub 仓库 ${owner}/${repo} 未找到或暂无 Releases`)
    }
    if (response.status === 403) {
      throw new Error('GitHub API 调用超出频率限制，请稍后重试')
    }
    throw new Error(`获取 GitHub Releases 失败 (${response.status})`)
  }

  const releasesData = await response.json()
  if (!Array.isArray(releasesData)) {
    return { releases: [], total: 0 }
  }

  // 若提供了 softwareId，检查系统数据库中已存在的版本
  let existingVersionMap = new Map<string, number>()
  if (options?.softwareId) {
    try {
      const dbVersions = await db
        .select({ id: softwareVersionHistory.id, version: softwareVersionHistory.version })
        .from(softwareVersionHistory)
        .where(eq(softwareVersionHistory.softwareId, options.softwareId))

      for (const item of dbVersions) {
        existingVersionMap.set(item.version, item.id)
      }
    } catch (e) {
      console.warn('查询已有版本记录失败:', e)
    }
  }

  const releases: GithubRelease[] = releasesData.map((item: any) => {
    const tagName = item.tag_name || ''
    const normalized = normalizeVersion(tagName)
    const rawAssets = Array.isArray(item.assets) ? item.assets : []

    const formattedAssets: GithubReleaseAsset[] = rawAssets.map((asset: any) => {
      const downloadUrl = asset.browser_download_url || ''
      return {
        id: asset.id,
        name: asset.name,
        size: asset.size || 0,
        sizeFormatted: formatBytes(asset.size || 0),
        downloadUrl,
        acceleratedUrl: applyProxyToUrl(downloadUrl, proxyPrefix, sourceId),
        contentType: asset.content_type || 'application/octet-stream',
        downloadCount: asset.download_count || 0,
        isExecutable: isExecutableAsset(asset.name),
      }
    })

    // 智能选择首选资产（可执行安装包优先）
    let primaryAsset: GithubReleaseAsset | undefined
    if (formattedAssets.length > 0) {
      const sortedAssets = [...formattedAssets].sort((a, b) => {
        const scoreA = getAssetPriorityScore(a.name, assetFilter)
        const scoreB = getAssetPriorityScore(b.name, assetFilter)
        return scoreB - scoreA
      })
      primaryAsset = sortedAssets[0]
    }

    const existingId = existingVersionMap.get(normalized) || existingVersionMap.get(tagName)

    return {
      id: item.id,
      tagName,
      normalizedVersion: normalized,
      name: item.name || tagName,
      body: item.body || '',
      publishedAt: item.published_at || item.created_at || new Date().toISOString(),
      isPrerelease: !!item.prerelease,
      isDraft: !!item.draft,
      htmlUrl: item.html_url || '',
      assets: formattedAssets,
      primaryAsset,
      existsInDb: !!existingId,
      existingDbVersionId: existingId,
    }
  })

  return {
    releases,
    total: releases.length,
  }
}

// 同步选项接口
export interface SyncGithubOptions {
  softwareId: number
  repo: string
  proxyPrefix?: string
  sourceId?: string
  useProxyAsOfficial?: boolean
  selectedTagNames?: string[] // 若为空或包含 'all'，则同步所有；若含 'latest' 则同步最新
  syncLatestOnly?: boolean
  assetFilter?: string
  overwriteExisting?: boolean
  applyRepoInfo?: boolean
  customToken?: string
}

// 执行版本同步到数据库
export async function syncGithubReleasesToSoftware(options: SyncGithubOptions) {
  const {
    softwareId,
    repo,
    proxyPrefix = 'https://ghproxy.net/',
    sourceId = 'ghproxy_net',
    useProxyAsOfficial = true,
    selectedTagNames,
    syncLatestOnly = false,
    assetFilter,
    overwriteExisting = false,
    applyRepoInfo = false,
    customToken,
  } = options

  const parsed = parseGithubRepo(repo)
  if (!parsed) {
    throw new Error('无效的 GitHub 仓库地址，请输入正确的 owner/repo 或 GitHub 链接')
  }

  // 1. 验证目标软件是否存在
  const [targetSoftware] = await db
    .select()
    .from(software)
    .where(eq(software.id, softwareId))
    .limit(1)

  if (!targetSoftware) {
    throw new Error(`未找到 ID 为 ${softwareId} 的软件`)
  }

  // 2. 拉取仓库信息并按需更新软件基本资料
  let repoInfo: GithubRepoDetails | null = null
  try {
    repoInfo = await fetchGithubRepoDetails(parsed.owner, parsed.repo, customToken)
  } catch (e) {
    console.warn('获取仓库基本信息失败:', e)
  }

  // 3. 拉取 Releases
  const { releases } = await fetchGithubReleases(parsed.owner, parsed.repo, customToken, {
    perPage: syncLatestOnly ? 5 : 50,
    proxyPrefix,
    sourceId,
    assetFilter,
    softwareId,
  })

  if (releases.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      skippedCount: 0,
      message: '该仓库未发布任何 Release 版本',
      details: [],
    }
  }

  // 4. 筛选待同步的版本
  let targetReleases = releases
  if (syncLatestOnly) {
    targetReleases = [releases[0]]
  } else if (selectedTagNames && selectedTagNames.length > 0 && !selectedTagNames.includes('all')) {
    targetReleases = releases.filter(r => selectedTagNames.includes(r.tagName) || selectedTagNames.includes(r.normalizedVersion))
  }

  let syncedCount = 0
  let skippedCount = 0
  let updatedCount = 0
  const details: Array<{ version: string; status: 'created' | 'updated' | 'skipped'; reason?: string }> = []

  // 查询已有的所有版本记录
  const existingDbVersions = await db
    .select()
    .from(softwareVersionHistory)
    .where(eq(softwareVersionHistory.softwareId, softwareId))

  const existingMap = new Map<string, typeof existingDbVersions[0]>()
  for (const v of existingDbVersions) {
    existingMap.set(v.version, v)
  }

  for (const rel of targetReleases) {
    const versionStr = rel.normalizedVersion || rel.tagName
    if (!isValidVersion(versionStr)) {
      details.push({
        version: versionStr,
        status: 'skipped',
        reason: '版本号格式不符合规范 (例如: 1.0.0)',
      })
      skippedCount++
      continue
    }

    const primaryAsset = rel.primaryAsset || rel.assets[0]
    const directUrl = primaryAsset?.downloadUrl || rel.htmlUrl
    const acceleratedUrl = primaryAsset?.acceleratedUrl || applyProxyToUrl(directUrl, proxyPrefix, sourceId)

    // 构建下载链接对象
    const downloadLinks = {
      official: useProxyAsOfficial ? acceleratedUrl : directUrl,
      backup: useProxyAsOfficial
        ? [directUrl].filter(Boolean)
        : [acceleratedUrl].filter(Boolean),
    }

    // 版本元数据
    const versionMetadata = {
      github: {
        releaseId: rel.id,
        tagName: rel.tagName,
        htmlUrl: rel.htmlUrl,
        assetName: primaryAsset?.name,
        proxyPrefix,
        sourceId,
        syncedAt: new Date().toISOString(),
      },
    }

    const existingVersion = existingMap.get(versionStr)

    if (existingVersion) {
      if (!overwriteExisting) {
        details.push({
          version: versionStr,
          status: 'skipped',
          reason: '版本已存在且未选择覆盖',
        })
        skippedCount++
        continue
      }

      // 覆盖更新现有版本
      await db
        .update(softwareVersionHistory)
        .set({
          releaseDate: new Date(rel.publishedAt),
          releaseNotes: rel.body || existingVersion.releaseNotes || '从 GitHub 同步更新',
          downloadLinks,
          fileSize: primaryAsset ? primaryAsset.sizeFormatted : existingVersion.fileSize,
          fileSizeBytes: primaryAsset ? primaryAsset.size : existingVersion.fileSizeBytes,
          isStable: !rel.isPrerelease,
          isBeta: rel.isPrerelease,
          metadata: {
            ...((existingVersion.metadata as object) || {}),
            ...versionMetadata,
          },
          updatedAt: new Date(),
        })
        .where(eq(softwareVersionHistory.id, existingVersion.id))

      updatedCount++
      details.push({ version: versionStr, status: 'updated' })
    } else {
      // 插入新版本记录
      await db.insert(softwareVersionHistory).values({
        softwareId,
        version: versionStr,
        releaseDate: new Date(rel.publishedAt),
        releaseNotes: rel.body || '从 GitHub 自动同步',
        releaseNotesEn: rel.body || '',
        downloadLinks,
        fileSize: primaryAsset ? primaryAsset.sizeFormatted : null,
        fileSizeBytes: primaryAsset ? primaryAsset.size : null,
        isStable: !rel.isPrerelease,
        isBeta: rel.isPrerelease,
        isPrerelease: rel.isPrerelease,
        versionType: rel.isPrerelease ? 'beta' : 'release',
        changelogCategory: ['feature'],
        metadata: versionMetadata,
      })

      syncedCount++
      details.push({ version: versionStr, status: 'created' })
    }
  }

  // 5. 自动更新软件的当前最新版本
  try {
    await updateLatestVersion(softwareId)
  } catch (e) {
    console.warn('自动更新软件当前最新版本失败:', e)
  }

  // 6. 更新 software.metadata.github 与基本信息（可选）
  const currentMetadata = (targetSoftware.metadata as Record<string, any>) || {}
  const updatedGithubMetadata = {
    ...currentMetadata,
    github: {
      repo: `${parsed.owner}/${parsed.repo}`,
      owner: parsed.owner,
      repoName: parsed.repo,
      proxyPrefix,
      sourceId,
      useProxyAsOfficial,
      assetFilter: assetFilter || '',
      lastSyncAt: new Date().toISOString(),
      lastReleaseCount: targetReleases.length,
    },
  }

  const updateSoftwarePayload: Record<string, any> = {
    metadata: updatedGithubMetadata,
    updatedAt: new Date(),
  }

  if (applyRepoInfo && repoInfo) {
    if (!targetSoftware.description && repoInfo.description) {
      updateSoftwarePayload.description = repoInfo.description
    }
    if (!targetSoftware.officialWebsite) {
      updateSoftwarePayload.officialWebsite = repoInfo.homepage || repoInfo.htmlUrl
    }
    if ((!Array.isArray(targetSoftware.tags) || targetSoftware.tags.length === 0) && repoInfo.topics.length > 0) {
      updateSoftwarePayload.tags = repoInfo.topics
    }
    // 推断常见文件类型
    if (!targetSoftware.filetype && targetReleases[0]?.primaryAsset) {
      const extMatch = targetReleases[0].primaryAsset.name.match(/\.([a-zA-Z0-9]+)$/)
      if (extMatch) {
        updateSoftwarePayload.filetype = extMatch[1].toLowerCase()
      }
    }
  }

  await db
    .update(software)
    .set(updateSoftwarePayload)
    .where(eq(software.id, softwareId))

  return {
    success: true,
    syncedCount,
    updatedCount,
    skippedCount,
    totalProcessed: targetReleases.length,
    details,
    message: `同步完成：新增 ${syncedCount} 个版本，更新 ${updatedCount} 个版本，跳过 ${skippedCount} 个版本`,
  }
}

export interface LatestReleaseDownloadResult {
  version: string
  tagName: string
  assetName?: string
  directUrl: string
  acceleratedUrl: string
  size?: number
  formattedSize?: string
  publishedAt?: string
  htmlUrl: string
}

/**
 * 方案 4 核心：按需即时获取 GitHub 最新 Release 资产的加速下载链接
 * 采用 Next.js SWR (revalidate: 600) 边缘缓存 10 分钟，极速响应且规避 GitHub API Rate Limit
 */
export async function getLatestGithubReleaseDownloadUrl(options: {
  owner: string
  repo: string
  proxyPrefix?: string
  sourceId?: string
  assetFilter?: string
  useProxyAsOfficial?: boolean
  customToken?: string
}): Promise<LatestReleaseDownloadResult | null> {
  const {
    owner,
    repo,
    proxyPrefix = 'https://ghproxy.net/',
    sourceId = 'ghproxy_net',
    assetFilter,
    useProxyAsOfficial = true,
    customToken,
  } = options

  const processReleaseData = (rel: any): LatestReleaseDownloadResult => {
    const rawAssets = Array.isArray(rel.assets) ? rel.assets : []
    const parsedAssets = rawAssets.map((a: any) => ({
      name: a.name,
      size: a.size,
      formattedSize: formatBytes(a.size),
      downloadUrl: a.browser_download_url,
      acceleratedUrl: applyProxyToUrl(a.browser_download_url, proxyPrefix, sourceId),
      contentType: a.content_type,
      downloadCount: a.download_count,
      isExecutable: isExecutableAsset(a.name),
      priorityScore: getAssetPriorityScore(a.name, assetFilter),
    }))

    parsedAssets.sort((a: any, b: any) => b.priorityScore - a.priorityScore)
    const primary = parsedAssets[0]
    const directUrl = primary?.downloadUrl || rel.html_url
    const acceleratedUrl = primary?.acceleratedUrl || applyProxyToUrl(directUrl, proxyPrefix, sourceId)

    return {
      version: normalizeVersion(rel.tag_name),
      tagName: rel.tag_name,
      assetName: primary?.name,
      directUrl,
      acceleratedUrl: useProxyAsOfficial ? acceleratedUrl : directUrl,
      size: primary?.size,
      formattedSize: primary?.formattedSize,
      publishedAt: rel.published_at,
      htmlUrl: rel.html_url,
    }
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    const response = await fetch(url, {
      headers: getGithubHeaders(customToken),
      next: { revalidate: 600 }, // 10 分钟 SWR 边缘缓存
    })

    if (response.ok) {
      const data = await response.json()
      return processReleaseData(data)
    }

    // 若无正式 latest release (可能全是 pre-release)，则退回获取第一条 release
    if (response.status === 404) {
      const listUrl = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=1`
      const listRes = await fetch(listUrl, {
        headers: getGithubHeaders(customToken),
        next: { revalidate: 600 },
      })
      if (listRes.ok) {
        const listData = await listRes.json()
        if (Array.isArray(listData) && listData.length > 0) {
          return processReleaseData(listData[0])
        }
      }
    }
    return null
  } catch (err) {
    console.error(`[getLatestGithubReleaseDownloadUrl] 获取 ${owner}/${repo} 失败:`, err)
    return null
  }
}

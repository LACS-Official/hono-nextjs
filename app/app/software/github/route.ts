import { NextRequest } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest } from '@/lib/auth'
import {
  parseGithubRepo,
  fetchGithubRepoDetails,
  fetchGithubReleases,
  syncGithubReleasesToSoftware,
  ACCELERATION_SOURCES,
} from '@/lib/github-sync'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/github - 拉取 GitHub 仓库信息与 Release 列表
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const { searchParams } = new URL(request.url)
    const repoInput = searchParams.get('repo')
    const proxyPrefix = searchParams.get('proxyPrefix') || 'https://ghproxy.net/'
    const sourceId = searchParams.get('sourceId') || 'ghproxy_net'
    const softwareIdStr = searchParams.get('softwareId')
    const assetFilter = searchParams.get('assetFilter') || undefined
    const action = searchParams.get('action') || 'all'

    if (!repoInput) {
      return corsResponse(
        {
          success: false,
          error: '请提供 GitHub 仓库名称或链接 (例如: owner/repo 或 https://github.com/owner/repo)',
        },
        { status: 400 },
        origin,
        userAgent
      )
    }

    const parsed = parseGithubRepo(repoInput)
    if (!parsed) {
      return corsResponse(
        {
          success: false,
          error: '无法识别的 GitHub 仓库地址，请使用 owner/repo 或完整 GitHub URL 格式',
        },
        { status: 400 },
        origin,
        userAgent
      )
    }

    const softwareId = softwareIdStr ? parseInt(softwareIdStr) : undefined

    // 1. 获取仓库信息
    const repoDetails = await fetchGithubRepoDetails(parsed.owner, parsed.repo)

    // 如果只需仓库信息
    if (action === 'details') {
      return corsResponse(
        {
          success: true,
          data: {
            repoDetails,
            accelerationSources: ACCELERATION_SOURCES,
          },
        },
        undefined,
        origin,
        userAgent
      )
    }

    // 2. 获取 Releases 列表
    const { releases, total } = await fetchGithubReleases(parsed.owner, parsed.repo, undefined, {
      proxyPrefix,
      sourceId,
      assetFilter,
      softwareId,
    })

    return corsResponse(
      {
        success: true,
        data: {
          repoDetails,
          releases,
          total,
          accelerationSources: ACCELERATION_SOURCES,
        },
      },
      undefined,
      origin,
      userAgent
    )
  } catch (error: any) {
    console.error('获取 GitHub 信息失败:', error)
    return corsResponse(
      {
        success: false,
        error: error.message || '获取 GitHub 数据失败，请检查仓库名或网络连接',
      },
      { status: 500 },
      origin,
      userAgent
    )
  }
}

// POST /app/software/github - 执行从 GitHub 同步版本操作
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // 认证检查
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user) {
      return corsResponse(
        {
          success: false,
          error: authResult.error || '需要管理员登录权限才能执行同步操作',
        },
        { status: 401 },
        origin,
        userAgent
      )
    }

    const body = await request.json()
    const {
      softwareId,
      repo,
      proxyPrefix,
      sourceId,
      useProxyAsOfficial,
      selectedTagNames,
      syncLatestOnly,
      assetFilter,
      overwriteExisting,
      applyRepoInfo,
      customToken,
    } = body

    if (!softwareId) {
      return corsResponse(
        {
          success: false,
          error: '缺少目标软件 ID (softwareId)',
        },
        { status: 400 },
        origin,
        userAgent
      )
    }

    if (!repo) {
      return corsResponse(
        {
          success: false,
          error: '缺少 GitHub 仓库地址 (repo)',
        },
        { status: 400 },
        origin,
        userAgent
      )
    }

    console.log(
      `[GITHUB_SYNC] User: ${authResult.user.email} - Software ID: ${softwareId} - Repo: ${repo} - Time: ${new Date().toISOString()}`
    )

    const syncResult = await syncGithubReleasesToSoftware({
      softwareId: parseInt(softwareId),
      repo,
      proxyPrefix,
      sourceId,
      useProxyAsOfficial,
      selectedTagNames,
      syncLatestOnly,
      assetFilter,
      overwriteExisting,
      applyRepoInfo,
      customToken,
    })

    return corsResponse(
      {
        success: true,
        data: syncResult,
        message: syncResult.message,
      },
      undefined,
      origin,
      userAgent
    )
  } catch (error: any) {
    console.error('同步 GitHub 失败:', error)
    return corsResponse(
      {
        success: false,
        error: error.message || '从 GitHub 同步失败',
      },
      { status: 500 },
      origin,
      userAgent
    )
  }
}

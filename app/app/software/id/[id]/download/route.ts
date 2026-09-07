import { NextRequest, NextResponse } from 'next/server'
import { unifiedDb as db, software } from '@/lib/unified-db-connection'
import { eq } from 'drizzle-orm'
import { corsResponse, handleOptions } from '@/lib/cors'
import { getLatestVersionWithDownloadUrl } from '@/lib/version-manager'
import {
  parseGithubRepo,
  getLatestGithubReleaseDownloadUrl,
  syncGithubReleasesToSoftware,
} from '@/lib/github-sync'

// OPTIONS 处理 (跨域预检)
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET /app/software/id/[id]/download - 动态获取最新下载直链或 302 重定向
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')
  const acceptHeader = request.headers.get('accept') || ''
  const searchParams = request.nextUrl.searchParams
  const wantsJson = searchParams.get('json') === 'true' || acceptHeader.includes('application/json')

  try {
    const { id } = params
    if (!id) {
      return corsResponse({ success: false, error: '软件ID参数缺失' }, { status: 400 }, origin, userAgent)
    }

    const softwareId = parseInt(id)
    if (isNaN(softwareId)) {
      return corsResponse({ success: false, error: '无效的软件ID格式' }, { status: 400 }, origin, userAgent)
    }

    // 1. 查询软件基本信息
    const [softwareInfo] = await db
      .select()
      .from(software)
      .where(eq(software.id, softwareId))
      .limit(1)

    if (!softwareInfo) {
      return corsResponse({ success: false, error: '未找到指定的软件' }, { status: 404 }, origin, userAgent)
    }

    const ghMeta = (softwareInfo.metadata as any)?.github
    const ghRepo = ghMeta?.repo

    let finalDownloadUrl: string | null = null
    let latestInfo: any = null

    // 2. 若配置了 GitHub 仓库，优先通过 10 分钟 SWR 边缘缓存解析 GitHub 最新 Release 下载直链
    if (ghRepo) {
      const parsed = parseGithubRepo(ghRepo)
      if (parsed) {
        const ghResult = await getLatestGithubReleaseDownloadUrl({
          owner: parsed.owner,
          repo: parsed.repo,
          proxyPrefix: ghMeta.proxyPrefix || 'https://ghproxy.net/',
          sourceId: ghMeta.sourceId || 'ghproxy_net',
          assetFilter: ghMeta.assetFilter,
          useProxyAsOfficial: ghMeta.useProxyAsOfficial !== false,
        })

        if (ghResult && ghResult.acceleratedUrl) {
          finalDownloadUrl = ghResult.acceleratedUrl
          latestInfo = ghResult

          // 后台异步静默同步：若发现 GitHub 上的版本号与数据库不一致，自动触发一次增量入库
          if (ghResult.version && ghResult.version !== softwareInfo.currentVersion) {
            void (async () => {
              try {
                await syncGithubReleasesToSoftware({
                  softwareId,
                  repo: ghRepo,
                  proxyPrefix: ghMeta.proxyPrefix,
                  sourceId: ghMeta.sourceId,
                  useProxyAsOfficial: ghMeta.useProxyAsOfficial,
                  assetFilter: ghMeta.assetFilter,
                  syncLatestOnly: true,
                  overwriteExisting: false,
                })
              } catch (bgErr) {
                console.warn(`[BackgroundSync] 软件 ID ${softwareId} 自动同步新版本失败:`, bgErr)
              }
            })()
          }
        }
      }
    }

    // 3. 若非 GitHub 软件或 GitHub 解析未命中，回退至本地版本历史记录库
    if (!finalDownloadUrl) {
      try {
        const dbVersion = await getLatestVersionWithDownloadUrl(softwareId)
        if (dbVersion?.downloadUrl) {
          finalDownloadUrl = dbVersion.downloadUrl
          latestInfo = {
            version: dbVersion.version,
            directUrl: dbVersion.downloadUrl,
            acceleratedUrl: dbVersion.downloadUrl,
          }
        }
      } catch (e) {
        console.warn(`获取软件 ${softwareId} 本地版本失败:`, e)
      }
    }

    // 4. 若依然无任何可用下载链接
    if (!finalDownloadUrl) {
      return corsResponse({
        success: false,
        error: '该软件暂无可用的下载文件链接',
      }, { status: 404 }, origin, userAgent)
    }

    // 5. 若客户端明确请求 JSON 数据，则返回下载链接元数据
    if (wantsJson) {
      return corsResponse({
        success: true,
        data: {
          softwareId: softwareInfo.id,
          name: softwareInfo.name,
          currentVersion: latestInfo?.version || softwareInfo.currentVersion,
          downloadUrl: finalDownloadUrl,
          details: latestInfo,
        },
      }, undefined, origin, userAgent)
    }

    // 6. 默认直接 302 重定向至下载直链（极速启动下载）
    return NextResponse.redirect(finalDownloadUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    })

  } catch (error) {
    console.error('动态下载重定向处理失败:', error)
    return corsResponse({
      success: false,
      error: '服务器处理下载请求失败',
    }, { status: 500 }, origin, userAgent)
  }
}

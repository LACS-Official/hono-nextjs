import { NextRequest } from 'next/server'
import { corsResponse, handleOptions } from '@/lib/cors'
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth'
import { 
  updateAllLatestVersions, 
  updateLatestVersion, 
  getVersionStats,
  suggestNextVersion 
} from '@/lib/version-manager'

// OPTIONS 处理
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// POST /app/software/version-management - 版本管理操作
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    // Supabase认证检查（需要管理员权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for software management operations'
      }, { status: 401 }, origin, userAgent)
    }

    // 记录操作日志
    const logInfo = `User: ${authResult.user.email}`
    console.log(`[VERSION_MANAGEMENT] ${logInfo} - IP: ${request.headers.get('x-forwarded-for') || 'unknown'} - Time: ${new Date().toISOString()}`)

    const body = await request.json()
    const { action, softwareId, changeType } = body

    switch (action) {
      case 'updateAll':
        // 批量更新所有软件的最新版本号
        const updateResult = await updateAllLatestVersions()
        return corsResponse({
          success: true,
          data: updateResult,
          message: `批量更新完成：${updateResult.updated} 个软件已更新，${updateResult.failed} 个失败`
        }, undefined, origin, userAgent)

      case 'updateSingle':
        // 更新单个软件的最新版本号
        if (!softwareId) {
          return corsResponse({
            success: false,
            error: '软件ID参数缺失'
          }, { status: 400 }, origin, userAgent)
        }

        const singleUpdateResult = await updateLatestVersion(parseInt(softwareId))
        return corsResponse({
          success: true,
          data: { updated: singleUpdateResult },
          message: singleUpdateResult ? '版本更新成功' : '无需更新或更新失败'
        }, undefined, origin, userAgent)

      case 'getStats':
        // 获取版本统计信息
        if (!softwareId) {
          return corsResponse({
            success: false,
            error: '软件ID参数缺失'
          }, { status: 400 }, origin, userAgent)
        }

        const stats = await getVersionStats(parseInt(softwareId))
        return corsResponse({
          success: true,
          data: stats
        }, undefined, origin, userAgent)

      case 'suggestVersion':
        // 建议下一个版本号
        if (!softwareId) {
          return corsResponse({
            success: false,
            error: '软件ID参数缺失'
          }, { status: 400 }, origin, userAgent)
        }

        const suggestedVersion = await suggestNextVersion(
          parseInt(softwareId), 
          changeType || 'patch'
        )
        
        return corsResponse({
          success: true,
          data: { 
            suggestedVersion,
            changeType: changeType || 'patch'
          }
        }, undefined, origin, userAgent)

      default:
        return corsResponse({
          success: false,
          error: '不支持的操作类型'
        }, { status: 400 }, origin, userAgent)
    }

  } catch (error) {
    console.error('版本管理操作失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

// GET /app/software/version-management - 获取版本管理信息
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent')

  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')
    const softwareId = url.searchParams.get('softwareId')

    switch (action) {
      case 'stats':
        if (!softwareId) {
          return corsResponse({
            success: false,
            error: '软件ID参数缺失'
          }, { status: 400 }, origin, userAgent)
        }

        const stats = await getVersionStats(parseInt(softwareId))
        return corsResponse({
          success: true,
          data: stats
        }, undefined, origin, userAgent)

      case 'suggest':
        if (!softwareId) {
          return corsResponse({
            success: false,
            error: '软件ID参数缺失'
          }, { status: 400 }, origin, userAgent)
        }

        const changeType = url.searchParams.get('changeType') as 'major' | 'minor' | 'patch' || 'patch'
        const suggestedVersion = await suggestNextVersion(parseInt(softwareId), changeType)
        
        return corsResponse({
          success: true,
          data: { 
            suggestedVersion,
            changeType
          }
        }, undefined, origin, userAgent)

      default:
        return corsResponse({
          success: false,
          error: '不支持的查询类型'
        }, { status: 400 }, origin, userAgent)
    }

  } catch (error) {
    console.error('获取版本管理信息失败:', error)
    return corsResponse({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 }, origin, userAgent)
  }
}

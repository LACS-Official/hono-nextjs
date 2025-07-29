/**
 * 版本管理工具
 * 自动化版本检测和管理功能
 */

import { softwareDb as db } from '@/lib/software-db-connection'
import { software, softwareVersionHistory } from '@/lib/software-schema'
import { eq, desc, and } from 'drizzle-orm'

/**
 * 版本比较函数
 * 支持语义化版本号比较 (如: 1.0.0, 1.0.1, 2.0.0)
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length)
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

/**
 * 获取软件的最新版本号
 */
export async function getLatestVersion(softwareId: number): Promise<string | null> {
  try {
    const versions = await db
      .select({ version: softwareVersionHistory.version })
      .from(softwareVersionHistory)
      .where(
        and(
          eq(softwareVersionHistory.softwareId, softwareId),
          eq(softwareVersionHistory.isStable, true)
        )
      )
      .orderBy(desc(softwareVersionHistory.releaseDate))

    if (versions.length === 0) return null

    // 按版本号排序，获取最新版本
    const sortedVersions = versions
      .map(v => v.version)
      .sort((a, b) => compareVersions(b, a))

    return sortedVersions[0]
  } catch (error) {
    console.error('获取最新版本失败:', error)
    return null
  }
}

/**
 * 自动更新软件的最新版本号
 */
export async function updateLatestVersion(softwareId: number): Promise<boolean> {
  try {
    const latestVersion = await getLatestVersion(softwareId)
    
    if (!latestVersion) {
      console.warn(`软件 ${softwareId} 没有找到稳定版本`)
      return false
    }

    // 更新软件表中的当前版本（如果最新版本更新的话）
    const [currentSoftware] = await db
      .select({ currentVersion: software.currentVersion })
      .from(software)
      .where(eq(software.id, softwareId))

    if (!currentSoftware) {
      console.error(`软件 ${softwareId} 不存在`)
      return false
    }

    // 如果最新版本比当前版本新，则更新
    if (compareVersions(latestVersion, currentSoftware.currentVersion) > 0) {
      await db
        .update(software)
        .set({
          currentVersion: latestVersion,
          updatedAt: new Date()
        })
        .where(eq(software.id, softwareId))

      console.log(`软件 ${softwareId} 版本已更新为 ${latestVersion}`)
      return true
    }

    return false
  } catch (error) {
    console.error('更新最新版本失败:', error)
    return false
  }
}

/**
 * 批量更新所有软件的最新版本号
 */
export async function updateAllLatestVersions(): Promise<{
  updated: number;
  failed: number;
  total: number;
}> {
  try {
    const allSoftware = await db
      .select({ id: software.id, name: software.name })
      .from(software)
      .where(eq(software.isActive, true))

    let updated = 0
    let failed = 0

    for (const sw of allSoftware) {
      try {
        const success = await updateLatestVersion(sw.id)
        if (success) {
          updated++
        }
      } catch (error) {
        console.error(`更新软件 ${sw.name} (${sw.id}) 失败:`, error)
        failed++
      }
    }

    return {
      updated,
      failed,
      total: allSoftware.length
    }
  } catch (error) {
    console.error('批量更新版本失败:', error)
    throw error
  }
}

/**
 * 检查版本号格式是否有效
 */
export function isValidVersion(version: string): boolean {
  // 支持语义化版本号格式: x.y.z 或 x.y.z-beta.1 等
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/
  return versionRegex.test(version)
}

/**
 * 获取版本类型
 */
export function getVersionType(version: string): 'release' | 'beta' | 'alpha' | 'rc' {
  const lowerVersion = version.toLowerCase()
  
  if (lowerVersion.includes('alpha')) return 'alpha'
  if (lowerVersion.includes('beta')) return 'beta'
  if (lowerVersion.includes('rc')) return 'rc'
  
  return 'release'
}

/**
 * 获取软件的版本历史统计
 */
export async function getVersionStats(softwareId: number) {
  try {
    const versions = await db
      .select()
      .from(softwareVersionHistory)
      .where(eq(softwareVersionHistory.softwareId, softwareId))
      .orderBy(desc(softwareVersionHistory.releaseDate))

    const stats = {
      total: versions.length,
      stable: versions.filter(v => v.isStable).length,
      beta: versions.filter(v => v.isBeta).length,
      prerelease: versions.filter(v => v.isPrerelease).length,
      latest: versions[0]?.version || null,
      oldest: versions[versions.length - 1]?.version || null,
      releaseFrequency: calculateReleaseFrequency(versions)
    }

    return stats
  } catch (error) {
    console.error('获取版本统计失败:', error)
    return null
  }
}

/**
 * 计算发布频率（天数）
 */
function calculateReleaseFrequency(versions: any[]): number | null {
  if (versions.length < 2) return null

  const dates = versions.map(v => new Date(v.releaseDate)).sort((a, b) => a.getTime() - b.getTime())
  const totalDays = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24)
  
  return Math.round(totalDays / (versions.length - 1))
}

/**
 * 自动检测并建议版本号
 */
export async function suggestNextVersion(
  softwareId: number, 
  changeType: 'major' | 'minor' | 'patch' = 'patch'
): Promise<string | null> {
  try {
    const latestVersion = await getLatestVersion(softwareId)
    
    if (!latestVersion) return '1.0.0'

    const parts = latestVersion.split('.').map(Number)
    
    switch (changeType) {
      case 'major':
        return `${parts[0] + 1}.0.0`
      case 'minor':
        return `${parts[0]}.${parts[1] + 1}.0`
      case 'patch':
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
      default:
        return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
    }
  } catch (error) {
    console.error('建议版本号失败:', error)
    return null
  }
}

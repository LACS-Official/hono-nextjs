/**
 * 系统设置工具API路由
 * 提供系统设置相关的工具功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  systemSettingsDb, 
  systemSettings,
  systemSettingsAuditLog
} from '@/lib/system-settings-db'
import { eq, and, ilike, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// 获取系统设置分类
export async function GET(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'categories':
        // 获取所有设置分类
        const categories = await systemSettingsDb
          .selectDistinct({ category: systemSettings.category })
          .from(systemSettings)
          .orderBy(systemSettings.category)

        return NextResponse.json({
          success: true,
          data: categories.map(c => c.category),
        })

      case 'export':
        // 导出系统设置
        const exportCategory = searchParams.get('category')
        let exportQuery = systemSettingsDb.select().from(systemSettings)
        
        if (exportCategory) {
          exportQuery = exportQuery.where(eq(systemSettings.category, exportCategory))
        }

        const settingsToExport = await exportQuery.orderBy(systemSettings.category, systemSettings.key)
        
        // 过滤敏感信息
        const sanitizedSettings = settingsToExport.map(setting => ({
          category: setting.category,
          key: setting.key,
          value: setting.isSecret ? '***' : setting.value,
          description: setting.description,
          type: setting.type,
          isRequired: setting.isRequired,
          validationRules: setting.validationRules,
        }))

        return NextResponse.json({
          success: true,
          data: sanitizedSettings,
        })

      case 'validate':
        // 验证设置值
        const settingId = searchParams.get('settingId')
        const value = searchParams.get('value')

        if (!settingId || value === null) {
          return NextResponse.json(
            { success: false, error: '缺少必要参数' },
            { status: 400 }
          )
        }

        const setting = await systemSettingsDb
          .select()
          .from(systemSettings)
          .where(eq(systemSettings.id, settingId))
          .limit(1)

        if (setting.length === 0) {
          return NextResponse.json(
            { success: false, error: '设置不存在' },
            { status: 404 }
          )
        }

        const validationRules = setting[0].validationRules
        let isValid = true
        let errorMessage = ''

        if (validationRules) {
          // 根据验证规则验证值
          if (validationRules.required && !value) {
            isValid = false
            errorMessage = '此设置为必填项'
          } else if (validationRules.minLength && value.length < validationRules.minLength) {
            isValid = false
            errorMessage = `值长度不能少于${validationRules.minLength}个字符`
          } else if (validationRules.maxLength && value.length > validationRules.maxLength) {
            isValid = false
            errorMessage = `值长度不能超过${validationRules.maxLength}个字符`
          } else if (validationRules.pattern && !new RegExp(validationRules.pattern).test(value)) {
            isValid = false
            errorMessage = '值格式不正确'
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            isValid,
            errorMessage,
          },
        })

      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('系统设置工具操作失败:', error)
    return NextResponse.json(
      { success: false, error: '系统设置工具操作失败' },
      { status: 500 }
    )
  }
}

// 批量操作
export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '未授权访问' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'import':
        // 导入系统设置
        if (!Array.isArray(data)) {
          return NextResponse.json(
            { success: false, error: '导入数据格式错误' },
            { status: 400 }
          )
        }

        const importResults = {
          success: 0,
          failed: 0,
          errors: [] as string[],
        }

        for (const item of data) {
          try {
            // 检查是否已存在
            const existing = await systemSettingsDb
              .select()
              .from(systemSettings)
              .where(and(
                eq(systemSettings.category, item.category),
                eq(systemSettings.key, item.key)
              ))
              .limit(1)

            if (existing.length > 0) {
              // 更新现有设置
              await systemSettingsDb
                .update(systemSettings)
                .set({
                  value: item.value,
                  description: item.description,
                  updatedAt: new Date(),
                  updatedBy: session.user.id,
                })
                .where(eq(systemSettings.id, existing[0].id))
            } else {
              // 创建新设置
              await systemSettingsDb.insert(systemSettings).values({
                id: crypto.randomUUID(),
                category: item.category,
                key: item.key,
                value: item.value,
                description: item.description,
                type: item.type || 'string',
                isSecret: item.isSecret || false,
                isRequired: item.isRequired || false,
                validationRules: item.validationRules,
                updatedBy: session.user.id,
              })
            }

            importResults.success++
          } catch (error) {
            importResults.failed++
            importResults.errors.push(`导入失败: ${item.category}.${item.key} - ${error}`)
          }
        }

        return NextResponse.json({
          success: true,
          data: importResults,
        })

      case 'batchDelete':
        // 批量删除设置
        if (!Array.isArray(data) || data.length === 0) {
          return NextResponse.json(
            { success: false, error: '请提供要删除的设置ID列表' },
            { status: 400 }
          )
        }

        // 检查是否有必需设置
        const requiredSettings = await systemSettingsDb
          .select()
          .from(systemSettings)
          .where(and(
            inArray(systemSettings.id, data),
            eq(systemSettings.isRequired, true)
          ))

        if (requiredSettings.length > 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: '不能删除必需设置',
              data: requiredSettings.map(s => ({ id: s.id, key: s.key, category: s.category }))
            },
            { status: 400 }
          )
        }

        // 执行批量删除
        const deleteResult = await systemSettingsDb
          .delete(systemSettings)
          .where(inArray(systemSettings.id, data))
          .returning()

        return NextResponse.json({
          success: true,
          data: {
            deleted: deleteResult.length,
          },
        })

      default:
        return NextResponse.json(
          { success: false, error: '无效的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('批量操作失败:', error)
    return NextResponse.json(
      { success: false, error: '批量操作失败' },
      { status: 500 }
    )
  }
}
import { supabase } from './supabase-client'
import { v4 as uuidv4 } from 'uuid'

/**
 * 转换数据库 snake_case 到应用 camelCase
 */
export function formatSettingFromDb(row: any) {
  if (!row) return null
  return {
    id: row.id,
    category: row.category,
    key: row.key,
    value: row.value,
    description: row.description,
    type: row.type || 'string',
    isSecret: Boolean(row.is_secret),
    isRequired: Boolean(row.is_required),
    validationRules: row.validation_rules,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    updatedBy: row.updated_by,
  }
}

export function formatAuditLogFromDb(row: any) {
  if (!row) return null
  return {
    id: row.id,
    settingId: row.setting_id,
    action: row.action,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: row.reason,
    userId: row.user_id,
    userAgent: row.user_agent,
    ipAddress: row.ip_address,
    timestamp: row.timestamp ? new Date(row.timestamp) : new Date(),
    settingKey: row.system_settings?.key || row.setting_key,
    settingCategory: row.system_settings?.category || row.setting_category,
  }
}

export function formatBlockedItemFromDb(row: any) {
  if (!row) return null
  return {
    id: row.id,
    type: row.type,
    value: row.value,
    reason: row.reason,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdBy: row.created_by,
  }
}

export function formatLoginLogFromDb(row: any) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    deviceInfo: row.device_info,
    networkInfo: row.network_info,
    loginTime: row.login_time ? new Date(row.login_time) : new Date(),
    sessionId: row.session_id,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  }
}

export const SupabaseSystemSettingsService = {
  // 1. 获取系统设置列表 (分页、分类、模糊搜索)
  async getSettings(options: {
    category?: string | null
    search?: string | null
    page?: number
    limit?: number
  }) {
    const page = options.page || 1
    const limit = Math.min(options.limit || 100, 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('system_settings')
      .select('*', { count: 'exact' })

    if (options.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }

    if (options.search && options.search.trim()) {
      const s = options.search.trim()
      query = query.or(`key.ilike.%${s}%,description.ilike.%${s}%,category.ilike.%${s}%`)
    }

    query = query.order('updated_at', { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`[Supabase] 获取系统设置失败: ${error.message}`)
    }

    const settings = (data || []).map(formatSettingFromDb)
    const total = count || settings.length

    return {
      settings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  },

  // 2. 根据 ID 获取单个设置
  async getSettingById(id: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`[Supabase] 获取设置详情失败: ${error.message}`)
    }

    return formatSettingFromDb(data)
  },

  // 3. 创建系统设置
  async createSetting(setting: {
    category: string
    key: string
    value: string
    description?: string
    type?: string
    isSecret?: boolean
    isRequired?: boolean
    validationRules?: any
    userId?: string
  }) {
    // 检查重复
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('category', setting.category)
      .eq('key', setting.key)
      .maybeSingle()

    if (existing) {
      throw new Error(`分类 ${setting.category} 下已存在键名为 ${setting.key} 的配置`)
    }

    const id = uuidv4()
    const newRow = {
      id,
      category: setting.category,
      key: setting.key,
      value: setting.value ?? '',
      description: setting.description ?? '',
      type: setting.type || 'string',
      is_secret: Boolean(setting.isSecret),
      is_required: Boolean(setting.isRequired),
      validation_rules: setting.validationRules || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: setting.userId || 'admin',
    }

    const { data, error } = await supabase
      .from('system_settings')
      .insert([newRow])
      .select()
      .single()

    if (error) {
      throw new Error(`[Supabase] 创建系统设置失败: ${error.message}`)
    }

    return formatSettingFromDb(data)
  },

  // 4. 更新系统设置
  async updateSetting(
    id: string,
    updates: {
      value?: string
      description?: string
      type?: string
      isSecret?: boolean
      isRequired?: boolean
      validationRules?: any
      updatedBy?: string
    }
  ) {
    const updateRow: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.value !== undefined) updateRow.value = String(updates.value)
    if (updates.description !== undefined) updateRow.description = updates.description
    if (updates.type !== undefined) updateRow.type = updates.type
    if (updates.isSecret !== undefined) updateRow.is_secret = Boolean(updates.isSecret)
    if (updates.isRequired !== undefined) updateRow.is_required = Boolean(updates.isRequired)
    if (updates.validationRules !== undefined) updateRow.validation_rules = updates.validationRules
    if (updates.updatedBy) updateRow.updated_by = updates.updatedBy

    const { data, error } = await supabase
      .from('system_settings')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`[Supabase] 更新系统设置失败: ${error.message}`)
    }

    return formatSettingFromDb(data)
  },

  // 5. 删除系统设置
  async deleteSetting(id: string) {
    const { data: existing } = await supabase
      .from('system_settings')
      .select('is_required')
      .eq('id', id)
      .single()

    if (existing?.is_required) {
      throw new Error('不能删除必需设置')
    }

    const { error } = await supabase
      .from('system_settings')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`[Supabase] 删除系统设置失败: ${error.message}`)
    }

    return true
  },

  // 6. 获取审计日志
  async getAuditLogs(options: {
    settingId?: string
    action?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const page = options.page || 1
    const limit = Math.min(options.limit || 20, 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('system_settings_audit_log')
      .select('*, system_settings(key, category)', { count: 'exact' })

    if (options.settingId) {
      query = query.eq('setting_id', options.settingId)
    }
    if (options.action) {
      query = query.eq('action', options.action)
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }
    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString())
    }
    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString())
    }

    query = query.order('timestamp', { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`[Supabase] 获取审计日志失败: ${error.message}`)
    }

    const auditLogs = (data || []).map(formatAuditLogFromDb)
    const total = count || auditLogs.length

    return {
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  },

  // 7. 获取黑名单列表
  async getBlockedItems() {
    const { data, error } = await supabase
      .from('blocked_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`[Supabase] 获取黑名单失败: ${error.message}`)
    }

    return (data || []).map(formatBlockedItemFromDb)
  },

  // 8. 添加黑名单
  async addBlockedItem(item: {
    type: string
    value: string
    reason?: string
    expiresAt?: string | null
    createdBy?: string
  }) {
    const id = uuidv4()
    const newRow = {
      id,
      type: item.type,
      value: item.value,
      reason: item.reason || null,
      is_active: true,
      created_at: new Date().toISOString(),
      expires_at: item.expiresAt ? new Date(item.expiresAt).toISOString() : null,
      created_by: item.createdBy || 'system',
    }

    const { data, error } = await supabase
      .from('blocked_items')
      .insert([newRow])
      .select()
      .single()

    if (error) {
      throw new Error(`[Supabase] 添加黑名单失败: ${error.message}`)
    }

    return formatBlockedItemFromDb(data)
  },

  // 9. 删除黑名单
  async deleteBlockedItem(id: string) {
    const { error } = await supabase
      .from('blocked_items')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`[Supabase] 移除黑名单失败: ${error.message}`)
    }

    return true
  },

  // 10. 检查是否在黑名单中
  async isBlocked(type: string, value: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('blocked_items')
      .select('id, expires_at, is_active')
      .eq('type', type)
      .eq('value', value)
      .eq('is_active', true)
      .limit(1)

    if (error || !data || data.length === 0) {
      return false
    }

    const item = data[0]
    if (item.expires_at && new Date(item.expires_at) < new Date()) {
      return false
    }

    return true
  },

  // 11. 获取登录日志
  async getLoginLogs(options: {
    userId?: string | null
    email?: string | null
    ipAddress?: string | null
    startDate?: Date | null
    endDate?: Date | null
    isActive?: boolean | null
    page?: number
    limit?: number
  }) {
    const page = options.page || 1
    const limit = Math.min(options.limit || 50, 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('login_logs')
      .select('*', { count: 'exact' })

    if (options.userId) {
      query = query.eq('user_id', options.userId)
    }
    if (options.email) {
      query = query.ilike('email', `%${options.email}%`)
    }
    if (options.ipAddress) {
      query = query.ilike('ip_address', `%${options.ipAddress}%`)
    }
    if (options.startDate) {
      query = query.gte('login_time', options.startDate.toISOString())
    }
    if (options.endDate) {
      query = query.lte('login_time', options.endDate.toISOString())
    }
    if (options.isActive !== null && options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive)
    }

    query = query.order('login_time', { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      throw new Error(`[Supabase] 获取登录日志失败: ${error.message}`)
    }

    const logs = (data || []).map(formatLoginLogFromDb)
    const total = count || logs.length

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    }
  },
}

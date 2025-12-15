/**
 * 系统设置数据验证工具
 * 提供各种验证规则和验证函数
 */

import { z } from 'zod'

// 验证规则接口
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string
  min?: number
  max?: number
  enum?: string[]
  custom?: (value: any) => boolean | string
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errorMessage?: string
}

// 常用正则表达式模式
export const CommonPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/.+/,
  phone: /^1[3-9]\d{9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  apiKey: /^[a-zA-Z0-9_-]{20,}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
  databaseUrl: /^postgresql:\/\/.+/,
  cron: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
}

// 预定义验证规则
export const ValidationRules = {
  // 基础验证规则
  required: {
    required: true,
  },
  
  // 字符串验证规则
  string: {
    required: false,
    minLength: 1,
    maxLength: 255,
  },
  
  // 邮箱验证规则
  email: {
    required: true,
    pattern: CommonPatterns.email,
  },
  
  // URL验证规则
  url: {
    required: true,
    pattern: CommonPatterns.url,
  },
  
  // 手机号验证规则
  phone: {
    required: true,
    pattern: CommonPatterns.phone,
  },
  
  // 密码验证规则
  password: {
    required: true,
    minLength: 8,
    pattern: CommonPatterns.password,
  },
  
  // API密钥验证规则
  apiKey: {
    required: true,
    minLength: 20,
    pattern: CommonPatterns.apiKey,
  },
  
  // JWT验证规则
  jwt: {
    required: true,
    pattern: CommonPatterns.jwt,
  },
  
  // 数据库连接字符串验证规则
  databaseUrl: {
    required: true,
    pattern: CommonPatterns.databaseUrl,
  },
  
  // Cron表达式验证规则
  cron: {
    required: true,
    pattern: CommonPatterns.cron,
  },
  
  // 端口号验证规则
  port: {
    required: true,
    min: 1,
    max: 65535,
  },
  
  // 速率限制验证规则
  rateLimit: {
    required: true,
    min: 1,
    max: 10000,
  },
  
  // 时间窗口验证规则（毫秒）
  timeWindow: {
    required: true,
    min: 1000,
    max: 86400000, // 24小时
  },
  
  // 保留天数验证规则
  retentionDays: {
    required: true,
    min: 1,
    max: 365,
  },
}

// 验证函数
export class SettingValidator {
  /**
   * 验证设置值
   * @param value 要验证的值
   * @param type 数据类型
   * @param rules 验证规则
   * @returns 验证结果
   */
  static validate(value: any, type: string, rules?: ValidationRule): ValidationResult {
    try {
      // 如果没有验证规则，返回有效
      if (!rules) {
        return { isValid: true }
      }

      // 检查必填项
      if (rules.required && (value === null || value === undefined || value === '')) {
        return { isValid: false, errorMessage: '此设置为必填项' }
      }

      // 如果不是必填项且值为空，则跳过其他验证
      if (!rules.required && (value === null || value === undefined || value === '')) {
        return { isValid: true }
      }

      // 根据数据类型进行验证
      switch (type) {
        case 'string':
          return this.validateString(value, rules)
        case 'number':
          return this.validateNumber(value, rules)
        case 'boolean':
          return this.validateBoolean(value, rules)
        case 'json':
          return this.validateJson(value, rules)
        default:
          return { isValid: true }
      }
    } catch (error) {
      return { isValid: false, errorMessage: '验证过程中发生错误' }
    }
  }

  /**
   * 验证字符串
   */
  private static validateString(value: any, rules: ValidationRule): ValidationResult {
    const strValue = String(value)

    // 长度验证
    if (rules.minLength && strValue.length < rules.minLength) {
      return { isValid: false, errorMessage: `长度不能少于${rules.minLength}个字符` }
    }

    if (rules.maxLength && strValue.length > rules.maxLength) {
      return { isValid: false, errorMessage: `长度不能超过${rules.maxLength}个字符` }
    }

    // 正则表达式验证
    if (rules.pattern && !new RegExp(rules.pattern).test(strValue)) {
      return { isValid: false, errorMessage: '格式不正确' }
    }

    // 枚举值验证
    if (rules.enum && !rules.enum.includes(strValue)) {
      return { isValid: false, errorMessage: `值必须是以下之一: ${rules.enum.join(', ')}` }
    }

    // 自定义验证
    if (rules.custom) {
      const customResult = rules.custom(strValue)
      if (typeof customResult === 'boolean') {
        if (!customResult) {
          return { isValid: false, errorMessage: '自定义验证失败' }
        }
      } else if (typeof customResult === 'string') {
        return { isValid: false, errorMessage: customResult }
      }
    }

    return { isValid: true }
  }

  /**
   * 验证数字
   */
  private static validateNumber(value: any, rules: ValidationRule): ValidationResult {
    const numValue = Number(value)

    if (isNaN(numValue)) {
      return { isValid: false, errorMessage: '必须是有效的数字' }
    }

    // 范围验证
    if (rules.min !== undefined && numValue < rules.min) {
      return { isValid: false, errorMessage: `值不能小于${rules.min}` }
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return { isValid: false, errorMessage: `值不能大于${rules.max}` }
    }

    // 自定义验证
    if (rules.custom) {
      const customResult = rules.custom(numValue)
      if (typeof customResult === 'boolean') {
        if (!customResult) {
          return { isValid: false, errorMessage: '自定义验证失败' }
        }
      } else if (typeof customResult === 'string') {
        return { isValid: false, errorMessage: customResult }
      }
    }

    return { isValid: true }
  }

  /**
   * 验证布尔值
   */
  private static validateBoolean(value: any, rules: ValidationRule): ValidationResult {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return { isValid: false, errorMessage: '必须是布尔值' }
    }

    // 自定义验证
    if (rules.custom) {
      const boolValue = typeof value === 'boolean' ? value : value === 'true'
      const customResult = rules.custom(boolValue)
      if (typeof customResult === 'boolean') {
        if (!customResult) {
          return { isValid: false, errorMessage: '自定义验证失败' }
        }
      } else if (typeof customResult === 'string') {
        return { isValid: false, errorMessage: customResult }
      }
    }

    return { isValid: true }
  }

  /**
   * 验证JSON
   */
  private static validateJson(value: any, rules: ValidationRule): ValidationResult {
    let parsedValue

    try {
      if (typeof value === 'string') {
        parsedValue = JSON.parse(value)
      } else {
        parsedValue = value
      }
    } catch (error) {
      return { isValid: false, errorMessage: '必须是有效的JSON格式' }
    }

    // 自定义验证
    if (rules.custom) {
      const customResult = rules.custom(parsedValue)
      if (typeof customResult === 'boolean') {
        if (!customResult) {
          return { isValid: false, errorMessage: '自定义验证失败' }
        }
      } else if (typeof customResult === 'string') {
        return { isValid: false, errorMessage: customResult }
      }
    }

    return { isValid: true }
  }

  /**
   * 批量验证设置
   */
  static validateSettings(settings: Array<{
    key: string
    value: any
    type: string
    rules?: ValidationRule
  }>): Array<{ key: string; result: ValidationResult }> {
    return settings.map(setting => ({
      key: setting.key,
      result: this.validate(setting.value, setting.type, setting.rules),
    }))
  }

  /**
   * 根据设置键获取预定义验证规则
   */
  static getValidationRulesForKey(key: string): ValidationRule | undefined {
    const keyRuleMap: Record<string, ValidationRule> = {
      'DATABASE_URL': ValidationRules.databaseUrl,
      'NEXT_PUBLIC_SUPABASE_URL': ValidationRules.url,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': ValidationRules.apiKey,
      'SUPABASE_SERVICE_KEY': ValidationRules.apiKey,
      'API_KEY': ValidationRules.apiKey,
      'JWT_SECRET': ValidationRules.password,
      'RATE_LIMIT_MAX_REQUESTS': ValidationRules.rateLimit,
      'RATE_LIMIT_WINDOW_MS': ValidationRules.timeWindow,
      'NEXT_PUBLIC_API_URL': ValidationRules.url,
      'ALLOWED_ORIGINS': {
        required: true,
        pattern: /^https?:\/\/[^,\s]+(,\s*https?:\/\/[^,\s]+)*$/,
      },
    }

    return keyRuleMap[key]
  }
}

// 创建Zod验证模式
export function createZodSchema(type: string, rules?: ValidationRule) {
  let schema: z.ZodTypeAny

  switch (type) {
    case 'string':
      schema = z.string()
      if (rules?.minLength) schema = (schema as z.ZodString).min(rules.minLength)
      if (rules?.maxLength) schema = (schema as z.ZodString).max(rules.maxLength)
      if (rules?.pattern) schema = (schema as z.ZodString).regex(new RegExp(rules.pattern))
      if (rules?.enum) schema = z.enum(rules.enum as [string, ...string[]])
      break
    case 'number':
      schema = z.number()
      if (rules?.min !== undefined) schema = (schema as z.ZodNumber).min(rules.min)
      if (rules?.max !== undefined) schema = (schema as z.ZodNumber).max(rules.max)
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'json':
      schema = z.any().refine((value) => {
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
          }
          return true
        } catch {
          return false
        }
      }, { message: '必须是有效的JSON格式' })
      break
    default:
      schema = z.any()
  }

  if (rules?.required) {
    schema = schema as z.ZodEffects<any>
  }

  return schema
}
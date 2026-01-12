/**
 * 设置验证器
 * 用于验证系统设置的值
 */

export interface ValidationRule {
  type: string
  required?: boolean
  min?: number
  max?: number
  pattern?: string
  options?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export class SettingValidator {
  /**
   * 验证设置值
   */
  static validate(value: string, type: string, rules?: ValidationRule): ValidationResult {
    const errors: string[] = []
    
    // 检查必填项
    if (rules?.required && (!value || value.trim() === '')) {
      errors.push('此设置为必填项')
      return { valid: false, errors }
    }
    
    // 如果值为空且不是必填项，则跳过其他验证
    if (!value || value.trim() === '') {
      return { valid: true }
    }
    
    // 根据类型验证
    switch (type) {
      case 'string':
        this.validateString(value, rules, errors)
        break
      case 'number':
        this.validateNumber(value, rules, errors)
        break
      case 'boolean':
        this.validateBoolean(value, rules, errors)
        break
      case 'json':
        this.validateJson(value, rules, errors)
        break
      default:
        errors.push(`未知的设置类型: ${type}`)
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  private static validateString(value: string, rules?: ValidationRule, errors?: string[]) {
    // 长度验证
    if (rules?.min !== undefined && value.length < rules.min) {
      errors?.push(`长度不能少于 ${rules.min} 个字符`)
    }
    
    if (rules?.max !== undefined && value.length > rules.max) {
      errors?.push(`长度不能超过 ${rules.max} 个字符`)
    }
    
    // 正则表达式验证
    if (rules?.pattern) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        errors?.push('格式不正确')
      }
    }
    
    // 选项验证
    if (rules?.options && !rules.options.includes(value)) {
      errors?.push(`值必须是以下选项之一: ${rules.options.join(', ')}`)
    }
  }
  
  private static validateNumber(value: string, rules?: ValidationRule, errors?: string[]) {
    const num = parseFloat(value)
    
    if (isNaN(num)) {
      errors?.push('必须是有效的数字')
      return
    }
    
    // 范围验证
    if (rules?.min !== undefined && num < rules.min) {
      errors?.push(`值不能小于 ${rules.min}`)
    }
    
    if (rules?.max !== undefined && num > rules.max) {
      errors?.push(`值不能大于 ${rules.max}`)
    }
  }
  
  private static validateBoolean(value: string, rules?: ValidationRule, errors?: string[]) {
    if (value !== 'true' && value !== 'false') {
      errors?.push('必须是 true 或 false')
    }
  }
  
  private static validateJson(value: string, rules?: ValidationRule, errors?: string[]) {
    try {
      JSON.parse(value)
    } catch (e) {
      errors?.push('必须是有效的JSON格式')
    }
  }
}
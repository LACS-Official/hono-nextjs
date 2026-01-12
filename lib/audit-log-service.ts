/**
 * 审计日志服务
 * 用于记录系统操作的审计日志
 */

import { NextRequest } from 'next/server'

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS = 'access',
}

export interface AuditLogEntry {
  action: AuditAction
  resourceType: string
  resourceId: string
  userId: string
  details?: any
  request?: NextRequest
}

export class AuditLogService {
  /**
   * 记录审计日志
   */
  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      // 这里可以实现实际的日志记录逻辑
      // 例如写入数据库、文件或发送到日志服务
      
      const logData = {
        ...entry,
        timestamp: new Date().toISOString(),
        userAgent: entry.request?.headers.get('user-agent'),
        ipAddress: this.getClientIP(entry.request),
      }
      
      // 简单的控制台日志记录
      console.log('审计日志:', JSON.stringify(logData, null, 2))
      
      // 在实际应用中，这里应该将日志写入数据库或日志服务
      // 例如：await this.saveToDatabase(logData)
      
    } catch (error) {
      console.error('记录审计日志失败:', error)
    }
  }
  
  /**
   * 获取客户端IP地址
   */
  private static getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined
    
    // 尝试从各种头部获取真实IP
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }
    
    const clientIP = request.headers.get('x-client-ip')
    if (clientIP) {
      return clientIP
    }
    
    // 如果没有找到，返回undefined
    return undefined
  }
}
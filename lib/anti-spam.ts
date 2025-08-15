/**
 * 防刷机制工具库
 * 用于防止恶意刷访问量
 */

interface ViewRecord {
  timestamp: number
  count: number
}

interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
  blockDurationMs: number // 封禁时长（毫秒）
}

// 内存存储访问记录（生产环境建议使用Redis）
const viewRecords = new Map<string, ViewRecord[]>()
const blockedIPs = new Map<string, number>() // IP -> 解封时间戳

// 默认配置
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 10, // 1分钟内最多10次访问
  blockDurationMs: 15 * 60 * 1000 // 封禁15分钟
}

/**
 * 获取客户端IP地址
 */
export function getClientIP(request: Request): string {
  // 尝试从各种头部获取真实IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // 如果都没有，返回一个默认值
  return 'unknown'
}

/**
 * 生成访问记录的键
 */
function getRecordKey(ip: string, softwareId: number): string {
  return `${ip}:${softwareId}`
}

/**
 * 清理过期的访问记录
 */
function cleanupExpiredRecords(records: ViewRecord[], windowMs: number): ViewRecord[] {
  const now = Date.now()
  return records.filter(record => now - record.timestamp < windowMs)
}

/**
 * 检查IP是否被封禁
 */
export function isIPBlocked(ip: string): boolean {
  const unblockTime = blockedIPs.get(ip)
  if (!unblockTime) {
    return false
  }
  
  if (Date.now() > unblockTime) {
    // 封禁时间已过，移除封禁记录
    blockedIPs.delete(ip)
    return false
  }
  
  return true
}

/**
 * 封禁IP
 */
function blockIP(ip: string, durationMs: number): void {
  const unblockTime = Date.now() + durationMs
  blockedIPs.set(ip, unblockTime)
  console.warn(`IP ${ip} 已被封禁，解封时间: ${new Date(unblockTime).toISOString()}`)
}

/**
 * 检查访问频率是否超限
 */
export function checkRateLimit(
  ip: string, 
  softwareId: number, 
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; reason?: string; retryAfter?: number } {
  
  // 检查IP是否被封禁
  if (isIPBlocked(ip)) {
    const unblockTime = blockedIPs.get(ip)!
    const retryAfter = Math.ceil((unblockTime - Date.now()) / 1000)
    return {
      allowed: false,
      reason: 'IP被临时封禁',
      retryAfter
    }
  }
  
  const recordKey = getRecordKey(ip, softwareId)
  const now = Date.now()
  
  // 获取或初始化访问记录
  let records = viewRecords.get(recordKey) || []
  
  // 清理过期记录
  records = cleanupExpiredRecords(records, config.windowMs)
  
  // 检查是否超过频率限制
  if (records.length >= config.maxRequests) {
    // 超过限制，封禁IP
    blockIP(ip, config.blockDurationMs)
    
    return {
      allowed: false,
      reason: '访问频率过高',
      retryAfter: Math.ceil(config.blockDurationMs / 1000)
    }
  }
  
  // 记录本次访问
  records.push({
    timestamp: now,
    count: 1
  })
  
  viewRecords.set(recordKey, records)
  
  return { allowed: true }
}

/**
 * 检测异常访问模式
 */
export function detectAnomalousPattern(ip: string, softwareId: number): {
  isAnomalous: boolean
  reason?: string
  confidence: number
} {
  const recordKey = getRecordKey(ip, softwareId)
  const records = viewRecords.get(recordKey) || []
  
  if (records.length < 3) {
    return { isAnomalous: false, confidence: 0 }
  }
  
  // 检查访问间隔是否过于规律（可能是机器人）
  const intervals: number[] = []
  for (let i = 1; i < records.length; i++) {
    intervals.push(records[i].timestamp - records[i-1].timestamp)
  }
  
  // 计算间隔的标准差
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const variance = intervals.reduce((sum, interval) => {
    return sum + Math.pow(interval - avgInterval, 2)
  }, 0) / intervals.length
  const stdDev = Math.sqrt(variance)
  
  // 如果标准差很小，说明访问间隔很规律，可能是机器人
  const coefficientOfVariation = stdDev / avgInterval
  
  if (coefficientOfVariation < 0.1 && avgInterval < 5000) { // 间隔小于5秒且很规律
    return {
      isAnomalous: true,
      reason: '访问模式过于规律，疑似机器人行为',
      confidence: 0.8
    }
  }
  
  // 检查短时间内大量访问
  const recentRecords = records.filter(r => Date.now() - r.timestamp < 30000) // 30秒内
  if (recentRecords.length > 5) {
    return {
      isAnomalous: true,
      reason: '短时间内访问次数过多',
      confidence: 0.9
    }
  }
  
  return { isAnomalous: false, confidence: 0 }
}

/**
 * 获取访问统计信息
 */
export function getAccessStats() {
  const now = Date.now()
  const stats = {
    totalRecords: viewRecords.size,
    blockedIPs: blockedIPs.size,
    activeBlocks: 0,
    recentAccess: 0
  }
  
  // 统计活跃的封禁
  for (const [ip, unblockTime] of blockedIPs.entries()) {
    if (now < unblockTime) {
      stats.activeBlocks++
    }
  }
  
  // 统计最近1小时的访问
  const oneHourAgo = now - 60 * 60 * 1000
  for (const records of viewRecords.values()) {
    stats.recentAccess += records.filter(r => r.timestamp > oneHourAgo).length
  }
  
  return stats
}

/**
 * 清理过期数据（建议定期调用）
 */
export function cleanupExpiredData(): void {
  const now = Date.now()
  
  // 清理过期的封禁记录
  for (const [ip, unblockTime] of blockedIPs.entries()) {
    if (now > unblockTime) {
      blockedIPs.delete(ip)
    }
  }
  
  // 清理过期的访问记录
  for (const [key, records] of viewRecords.entries()) {
    const cleanedRecords = cleanupExpiredRecords(records, 24 * 60 * 60 * 1000) // 保留24小时
    if (cleanedRecords.length === 0) {
      viewRecords.delete(key)
    } else {
      viewRecords.set(key, cleanedRecords)
    }
  }
}

// 定期清理过期数据（每小时执行一次）
setInterval(cleanupExpiredData, 60 * 60 * 1000)

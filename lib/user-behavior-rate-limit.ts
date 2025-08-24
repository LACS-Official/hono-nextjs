/**
 * 用户行为API速率限制工具
 * 实现同一IP在1秒内只能访问每个POST端点两次的限制
 */

// 用户行为记录API专用的频率限制存储
const userBehaviorRateLimits = new Map<string, { requestTimes: number[] }>()

/**
 * 用户行为记录API的频率限制检查
 * 限制同一IP在1秒内只能访问每个POST记录API两次
 */
export function checkUserBehaviorRateLimit(
  clientIp: string,
  endpoint: string,
  windowMs = 1000,
  maxRequests = 2
): { allowed: boolean; error?: string; retryAfter?: number } {
  if (!clientIp) {
    console.warn('User behavior rate limit check: clientIp is empty')
    return { allowed: true }
  }

  const rateLimitKey = `${clientIp}:${endpoint}`
  const now = Date.now()
  let clientData = userBehaviorRateLimits.get(rateLimitKey)

  if (!clientData) {
    // 首次访问，记录时间并允许通过
    clientData = { requestTimes: [now] }
    userBehaviorRateLimits.set(rateLimitKey, clientData)
    return { allowed: true }
  }

  // 清理窗口期外的请求记录
  clientData.requestTimes = clientData.requestTimes.filter(time => now - time < windowMs)

  if (clientData.requestTimes.length >= maxRequests) {
    // 超出请求限制
    const oldestRequest = Math.min(...clientData.requestTimes)
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)
    
    console.warn(`User behavior rate limit exceeded for IP: ${clientIp}, endpoint: ${endpoint}`)
    return {
      allowed: false,
      error: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
      retryAfter
    }
  }

  // 记录本次请求并允许通过
  clientData.requestTimes.push(now)
  return { allowed: true }
}

// 定期清理过期的用户行为频率限制记录
setInterval(() => {
  const now = Date.now()
  const expireTime = 60000 // 1分钟后清理

  for (const [key, data] of userBehaviorRateLimits.entries()) {
    if (data.requestTimes.length === 0 || now - Math.max(...data.requestTimes) > expireTime) {
      userBehaviorRateLimits.delete(key)
    }
  }
}, 60000) // 每分钟清理一次
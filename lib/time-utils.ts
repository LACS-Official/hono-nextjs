// 时间工具函数
export class TimeUtils {
  /**
   * 将UTC时间转换为中国时区时间 (UTC+8)
   * @param date Date对象或ISO字符串
   * @returns 中国时区的ISO字符串
   */
  static toChineseTime(date: Date | string): string {
    const utcDate = typeof date === 'string' ? new Date(date) : date

    // 创建中国时区时间（UTC+8）
    const chineseTime = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000)

    // 格式化为中国时区ISO字符串
    const year = chineseTime.getUTCFullYear()
    const month = String(chineseTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(chineseTime.getUTCDate()).padStart(2, '0')
    const hours = String(chineseTime.getUTCHours()).padStart(2, '0')
    const minutes = String(chineseTime.getUTCMinutes()).padStart(2, '0')
    const seconds = String(chineseTime.getUTCSeconds()).padStart(2, '0')
    const milliseconds = String(chineseTime.getUTCMilliseconds()).padStart(3, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+08:00`
  }

  /**
   * 获取当前中国时区时间
   * @returns 中国时区的Date对象
   */
  static nowInChina(): Date {
    // 返回当前UTC时间，让数据库处理时区
    return new Date()
  }

  /**
   * 创建中国时区的过期时间
   * @param days 天数
   * @returns 中国时区的Date对象
   */
  static createChineseExpirationDate(days: number): Date {
    const now = new Date()
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  }

  /**
   * 格式化时间为中国时区显示
   * @param date Date对象或ISO字符串
   * @returns 格式化的中国时区时间字符串
   */
  static formatChineseTime(date: Date | string): string {
    const chineseTime = this.toChineseTime(date)
    const dateObj = new Date(chineseTime)
    
    return dateObj.toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}

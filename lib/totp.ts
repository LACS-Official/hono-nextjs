import crypto from 'crypto'
import QRCode from 'qrcode'

const B32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * 将 Buffer 编码为标准 Base32 字符串
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += B32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += B32_CHARS[(value << (5 - bits)) & 31]
  }

  return output
}

/**
 * 将 Base32 字符串解码为 Buffer
 */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/[\s-]/g, '')
  let bits = 0
  let value = 0
  let index = 0
  const output = new Uint8Array(Math.floor((clean.length * 5) / 8))

  for (let i = 0; i < clean.length; i++) {
    const val = B32_CHARS.indexOf(clean[i])
    if (val === -1) continue

    value = (value << 5) | val
    bits += 5

    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return Buffer.from(output.buffer, 0, index)
}

/**
 * 生成 2FA 高强度 Base32 密钥（默认 20 字节 = 160 位密钥，符合 RFC 4226/6238 规范）
 */
export function generateTOTPSecret(byteLength = 20): string {
  const randomBuf = crypto.randomBytes(byteLength)
  return base32Encode(randomBuf)
}

/**
 * 组装符合 Google Authenticator 标准的 otpauth 协议链接
 */
export function generateOtpauthUrl(
  secret: string,
  accountName: string = 'admin@lacs.cc',
  issuer: string = 'LACS Admin'
): string {
  const cleanSecret = secret.replace(/\s+/g, '').toUpperCase()
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`
}

/**
 * 生成可直接用于 <img> 标签的二维码 Base64 Data URL
 */
export async function generateQRCodeDataUrl(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl, {
    width: 260,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

/**
 * 计算指定计数器的 6 位 TOTP 数字验证码
 */
function calculateTOTPForCounter(keyBuffer: Buffer, counter: number): string {
  const buf = Buffer.alloc(8)
  buf.writeBigInt64BE(BigInt(counter), 0)

  const hmac = crypto.createHmac('sha1', keyBuffer as any).update(buf as any).digest()
  const offset = hmac[hmac.length - 1] & 0x0f

  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = binary % 1000000
  return otp.toString().padStart(6, '0')
}

/**
 * 校验用户输入的 6 位 TOTP 动态口令
 * @param secret Base32 密钥
 * @param token 用户输入的 6 位验证码
 * @param window 允许的时间窗口偏移量（默认 ±1，即允许前后各 30 秒的时钟偏差）
 */
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
  if (!secret || !token) return false

  const cleanToken = token.trim().replace(/\s+/g, '')
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false
  }

  try {
    const key = base32Decode(secret)
    const currentCounter = Math.floor(Date.now() / 1000 / 30)

    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
      const calculated = calculateTOTPForCounter(key, currentCounter + errorWindow)
      if (cleanToken === calculated) {
        return true
      }
    }
  } catch (err) {
    console.error('[TOTP] 验证异常:', err)
  }

  return false
}

/**
 * 生成 8 个一次性应急备用恢复码（格式：xxxx-xxxx）
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = []
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz'

  for (let i = 0; i < count; i++) {
    let part1 = ''
    let part2 = ''
    for (let j = 0; j < 4; j++) {
      part1 += chars.charAt(Math.floor(Math.random() * chars.length))
      part2 += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    codes.push(`${part1}-${part2}`)
  }

  return codes
}

/**
 * 校验并消耗一个备用恢复码
 */
export function verifyAndConsumeBackupCode(
  inputCode: string,
  backupCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const cleanInput = inputCode.trim().toLowerCase().replace(/\s+/g, '')
  const index = backupCodes.findIndex(c => c.toLowerCase() === cleanInput || c.toLowerCase().replace('-', '') === cleanInput)

  if (index !== -1) {
    const updated = [...backupCodes]
    updated.splice(index, 1)
    return { valid: true, remainingCodes: updated }
  }

  return { valid: false, remainingCodes: backupCodes }
}

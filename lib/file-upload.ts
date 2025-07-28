import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// 支持的图片格式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// 文件上传配置
export const UPLOAD_CONFIG = {
  maxFileSize: MAX_FILE_SIZE,
  allowedTypes: ALLOWED_IMAGE_TYPES,
  uploadDir: path.join(process.cwd(), 'public', 'uploads', 'software'),
  publicPath: '/uploads/software'
}

// 确保上传目录存在
export async function ensureUploadDir() {
  if (!existsSync(UPLOAD_CONFIG.uploadDir)) {
    await mkdir(UPLOAD_CONFIG.uploadDir, { recursive: true })
  }
}

// 验证文件类型
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType)
}

// 验证文件大小
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

// 生成唯一文件名
export function generateFileName(originalName: string): string {
  const ext = path.extname(originalName)
  const uuid = randomUUID()
  return `${uuid}${ext}`
}

// 保存文件
export async function saveFile(buffer: Buffer, fileName: string): Promise<string> {
  await ensureUploadDir()
  const filePath = path.join(UPLOAD_CONFIG.uploadDir, fileName)
  await writeFile(filePath, new Uint8Array(buffer))
  return `${UPLOAD_CONFIG.publicPath}/${fileName}`
}

// 处理文件上传
export async function handleFileUpload(file: File): Promise<{ url: string; fileName: string }> {
  // 验证文件类型
  if (!validateFileType(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
  }

  // 验证文件大小
  if (!validateFileSize(file.size)) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // 生成文件名
  const fileName = generateFileName(file.name)

  // 转换为 Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 保存文件
  const url = await saveFile(buffer, fileName)

  return { url, fileName }
}

// 文件上传错误类
export class FileUploadError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FileUploadError'
  }
}

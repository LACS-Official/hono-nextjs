// 此文件已弃用 - 软件管理路由已迁移到 /app/software
// 保留此文件作为备份和参考
// 新的软件管理路由位于: app/software/[...route]/route.ts

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { softwareDb as db } from '@/lib/software-db-connection'
import { software, softwareAnnouncements, softwareVersionHistory } from '@/lib/software-schema'
import { eq, and, desc, asc, like, or, isNull, gte, lte, ne, inArray } from 'drizzle-orm'
import { handleFileUpload, FileUploadError } from '@/lib/file-upload'

// 创建软件路由（已弃用）
export const softwareRoutes = new Hono()

// 输入验证模式
const queryParamsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 10),
  category: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'sortOrder']).optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

const softwareNameSchema = z.object({
  name: z.string().min(1, 'Software name is required')
})

const announcementQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 50) : 10),
  type: z.string().optional(),
  priority: z.string().optional(),
  isPublished: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined)
})

// 创建软件的输入验证模式
const createSoftwareSchema = z.object({
  name: z.string().min(1, 'Software name is required').max(255, 'Name too long'),
  nameEn: z.string().max(255, 'English name too long').optional(),
  description: z.string().optional(),
  descriptionEn: z.string().optional(),
  currentVersion: z.string().min(1, 'Current version is required').max(50, 'Version too long'),
  latestVersion: z.string().min(1, 'Latest version is required').max(50, 'Version too long'),
  downloadUrl: z.string().url('Invalid download URL').optional(),
  downloadUrlBackup: z.string().url('Invalid backup URL').optional(),
  officialWebsite: z.string().url('Invalid website URL').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  tags: z.array(z.string()).optional(),
  systemRequirements: z.record(z.string(), z.array(z.string())).optional(),
  fileSize: z.string().max(50, 'File size too long').optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  metadata: z.record(z.string(), z.any()).optional()
})

// 更新软件的输入验证模式
const updateSoftwareSchema = createSoftwareSchema.partial()

// 软件ID参数验证
const softwareIdSchema = z.object({
  id: z.string().uuid('Invalid software ID format')
})

// 创建公告的输入验证模式
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  titleEn: z.string().max(500, 'English title too long').optional(),
  content: z.string().min(1, 'Content is required'),
  contentEn: z.string().optional(),
  type: z.enum(['general', 'update', 'security', 'maintenance']).optional().default('general'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  version: z.string().max(50, 'Version too long').optional(),
  isPublished: z.boolean().optional().default(true),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  metadata: z.record(z.string(), z.any()).optional()
})

// 更新公告的输入验证模式
const updateAnnouncementSchema = createAnnouncementSchema.partial()

// 公告ID参数验证
const announcementIdSchema = z.object({
  announcementId: z.string().uuid('Invalid announcement ID format')
})

// 批量操作验证模式
const batchDeleteSchema = z.object({
  ids: z.array(z.string().uuid('Invalid ID format')).min(1, 'At least one ID is required').max(100, 'Too many IDs')
})

const batchUpdateStatusSchema = z.object({
  ids: z.array(z.string().uuid('Invalid ID format')).min(1, 'At least one ID is required').max(100, 'Too many IDs'),
  isActive: z.boolean()
})

// 版本历史验证模式
const createVersionHistorySchema = z.object({
  version: z.string().min(1, 'Version is required').max(50, 'Version too long'),
  releaseDate: z.string().datetime('Invalid release date format').transform(val => new Date(val)),
  releaseNotes: z.string().optional(),
  releaseNotesEn: z.string().optional(),
  downloadUrl: z.string().url('Invalid download URL').optional(),
  fileSize: z.string().max(50, 'File size too long').optional(),
  isStable: z.boolean().optional().default(true),
  isBeta: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.any()).optional()
})

// 工具函数：URL 解码和清理
function sanitizeInput(input: string): string {
  try {
    // URL 解码
    const decoded = decodeURIComponent(input)
    // 移除潜在的危险字符
    return decoded.replace(/[<>'"&]/g, '').trim()
  } catch {
    // 如果解码失败，返回原始输入的清理版本
    return input.replace(/[<>'"&]/g, '').trim()
  }
}

// 工具函数：构建搜索条件
function buildSearchConditions(searchTerm: string) {
  const cleanSearch = `%${sanitizeInput(searchTerm)}%`
  return or(
    like(software.name, cleanSearch),
    like(software.nameEn, cleanSearch),
    like(software.description, cleanSearch),
    like(software.descriptionEn, cleanSearch)
  )
}

// GET /software - 获取所有软件列表
softwareRoutes.get('/', async (c) => {
  try {
    const query = c.req.query()
    const validatedQuery = queryParamsSchema.parse(query)
    
    const { page, limit, category, search, sortBy, sortOrder, isActive } = validatedQuery
    const offset = (page - 1) * limit

    // 构建查询条件
    let whereConditions = []
    
    if (isActive !== undefined) {
      whereConditions.push(eq(software.isActive, isActive))
    }
    
    if (category) {
      whereConditions.push(eq(software.category, sanitizeInput(category)))
    }
    
    if (search) {
      whereConditions.push(buildSearchConditions(search))
    }

    // 构建排序条件
    const orderBy = sortOrder === 'desc' ? desc(software[sortBy]) : asc(software[sortBy])

    // 执行查询
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined
    
    const [softwareList, totalCount] = await Promise.all([
      db.select()
        .from(software)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db.select({ count: software.id })
        .from(software)
        .where(whereClause)
        .then(result => result.length)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return c.json({
      success: true,
      data: {
        software: softwareList,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching software list:', error)
    
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: `Invalid query parameters: ${error.issues.map(e => e.message).join(', ')}` })
    }
    
    throw new HTTPException(500, { message: 'Failed to fetch software list' })
  }
})

// GET /software/:name - 获取特定软件详情
softwareRoutes.get('/:name', async (c) => {
  try {
    const { name } = softwareNameSchema.parse({ name: c.req.param('name') })
    const cleanName = sanitizeInput(name)
    
    // 查询软件信息（支持中英文名称）
    const softwareInfo = await db.select()
      .from(software)
      .where(
        and(
          or(
            eq(software.name, cleanName),
            eq(software.nameEn, cleanName)
          ),
          eq(software.isActive, true)
        )
      )
      .limit(1)
    
    if (softwareInfo.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    return c.json({
      success: true,
      data: softwareInfo[0]
    })
  } catch (error) {
    console.error('Error fetching software details:', error)
    
    if (error instanceof HTTPException) {
      throw error
    }
    
    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid software name parameter' })
    }
    
    throw new HTTPException(500, { message: 'Failed to fetch software details' })
  }
})

// GET /software/:name/announcements - 获取特定软件的公告历史
softwareRoutes.get('/:name/announcements', async (c) => {
  try {
    const { name } = softwareNameSchema.parse({ name: c.req.param('name') })
    const cleanName = sanitizeInput(name)
    const query = c.req.query()
    const validatedQuery = announcementQuerySchema.parse(query)

    const { page, limit, type, priority, isPublished } = validatedQuery
    const offset = (page - 1) * limit

    // 首先查找软件
    const softwareInfo = await db.select({ id: software.id })
      .from(software)
      .where(
        and(
          or(
            eq(software.name, cleanName),
            eq(software.nameEn, cleanName)
          ),
          eq(software.isActive, true)
        )
      )
      .limit(1)

    if (softwareInfo.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    const softwareId = softwareInfo[0].id

    // 构建公告查询条件
    let whereConditions = [eq(softwareAnnouncements.softwareId, softwareId)]

    if (isPublished !== undefined) {
      whereConditions.push(eq(softwareAnnouncements.isPublished, isPublished))
    }

    if (type) {
      whereConditions.push(eq(softwareAnnouncements.type, sanitizeInput(type)))
    }

    if (priority) {
      whereConditions.push(eq(softwareAnnouncements.priority, sanitizeInput(priority)))
    }

    // 查询公告列表
    const [announcements, totalCount] = await Promise.all([
      db.select()
        .from(softwareAnnouncements)
        .where(and(...whereConditions))
        .orderBy(desc(softwareAnnouncements.publishedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: softwareAnnouncements.id })
        .from(softwareAnnouncements)
        .where(and(...whereConditions))
        .then(result => result.length)
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return c.json({
      success: true,
      data: {
        announcements,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Error fetching software announcements:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: `Invalid parameters: ${error.issues.map(e => e.message).join(', ')}` })
    }

    throw new HTTPException(500, { message: 'Failed to fetch software announcements' })
  }
})

// GET /software/:name/latest-announcement - 获取特定软件的最新公告
softwareRoutes.get('/:name/latest-announcement', async (c) => {
  try {
    const { name } = softwareNameSchema.parse({ name: c.req.param('name') })
    const cleanName = sanitizeInput(name)

    // 首先查找软件
    const softwareInfo = await db.select({ id: software.id })
      .from(software)
      .where(
        and(
          or(
            eq(software.name, cleanName),
            eq(software.nameEn, cleanName)
          ),
          eq(software.isActive, true)
        )
      )
      .limit(1)

    if (softwareInfo.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    const softwareId = softwareInfo[0].id

    // 查询最新公告
    const latestAnnouncement = await db.select()
      .from(softwareAnnouncements)
      .where(
        and(
          eq(softwareAnnouncements.softwareId, softwareId),
          eq(softwareAnnouncements.isPublished, true),
          or(
            isNull(softwareAnnouncements.expiresAt),
            gte(softwareAnnouncements.expiresAt, new Date())
          )
        )
      )
      .orderBy(desc(softwareAnnouncements.publishedAt))
      .limit(1)

    if (latestAnnouncement.length === 0) {
      return c.json({
        success: true,
        data: null,
        message: 'No announcements found for this software'
      })
    }

    return c.json({
      success: true,
      data: latestAnnouncement[0]
    })
  } catch (error) {
    console.error('Error fetching latest announcement:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid software name parameter' })
    }

    throw new HTTPException(500, { message: 'Failed to fetch latest announcement' })
  }
})

// POST /software - 创建新软件
softwareRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = createSoftwareSchema.parse(body)

    // 检查软件名称是否已存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.name, validatedData.name))
      .limit(1)

    if (existingSoftware.length > 0) {
      throw new HTTPException(409, { message: 'Software with this name already exists' })
    }

    // 创建新软件
    const newSoftware = await db.insert(software)
      .values({
        ...validatedData,
        updatedAt: new Date()
      })
      .returning()

    return c.json({
      success: true,
      data: newSoftware[0],
      message: 'Software created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating software:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to create software' })
  }
})

// PUT /software/:id - 更新软件信息
softwareRoutes.put('/:id', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })
    const body = await c.req.json()
    const validatedData = updateSoftwareSchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 如果更新名称，检查是否与其他软件冲突
    if (validatedData.name && validatedData.name !== existingSoftware[0].name) {
      const nameConflict = await db.select()
        .from(software)
        .where(and(
          eq(software.name, validatedData.name),
          ne(software.id, id)
        ))
        .limit(1)

      if (nameConflict.length > 0) {
        throw new HTTPException(409, { message: 'Software with this name already exists' })
      }
    }

    // 更新软件信息
    const updatedSoftware = await db.update(software)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(software.id, id))
      .returning()

    return c.json({
      success: true,
      data: updatedSoftware[0],
      message: 'Software updated successfully'
    })
  } catch (error) {
    console.error('Error updating software:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to update software' })
  }
})

// DELETE /software/:id - 删除软件
softwareRoutes.delete('/:id', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 删除软件（级联删除相关公告）
    await db.delete(software)
      .where(eq(software.id, id))

    return c.json({
      success: true,
      message: 'Software deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting software:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid software ID' })
    }

    throw new HTTPException(500, { message: 'Failed to delete software' })
  }
})

// POST /software/:id/announcements - 为软件创建新公告
softwareRoutes.post('/:id/announcements', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })
    const body = await c.req.json()
    const validatedData = createAnnouncementSchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 创建新公告
    const newAnnouncement = await db.insert(softwareAnnouncements)
      .values({
        ...validatedData,
        softwareId: id,
        updatedAt: new Date()
      })
      .returning()

    return c.json({
      success: true,
      data: newAnnouncement[0],
      message: 'Announcement created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating announcement:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to create announcement' })
  }
})

// PUT /software/:id/announcements/:announcementId - 更新公告
softwareRoutes.put('/:id/announcements/:announcementId', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })
    const { announcementId } = announcementIdSchema.parse({ announcementId: c.req.param('announcementId') })
    const body = await c.req.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 检查公告是否存在且属于该软件
    const existingAnnouncement = await db.select()
      .from(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.id, announcementId),
        eq(softwareAnnouncements.softwareId, id)
      ))
      .limit(1)

    if (existingAnnouncement.length === 0) {
      throw new HTTPException(404, { message: 'Announcement not found' })
    }

    // 更新公告
    const updatedAnnouncement = await db.update(softwareAnnouncements)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(softwareAnnouncements.id, announcementId))
      .returning()

    return c.json({
      success: true,
      data: updatedAnnouncement[0],
      message: 'Announcement updated successfully'
    })
  } catch (error) {
    console.error('Error updating announcement:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to update announcement' })
  }
})

// DELETE /software/:id/announcements/:announcementId - 删除公告
softwareRoutes.delete('/:id/announcements/:announcementId', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })
    const { announcementId } = announcementIdSchema.parse({ announcementId: c.req.param('announcementId') })

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 检查公告是否存在且属于该软件
    const existingAnnouncement = await db.select()
      .from(softwareAnnouncements)
      .where(and(
        eq(softwareAnnouncements.id, announcementId),
        eq(softwareAnnouncements.softwareId, id)
      ))
      .limit(1)

    if (existingAnnouncement.length === 0) {
      throw new HTTPException(404, { message: 'Announcement not found' })
    }

    // 删除公告
    await db.delete(softwareAnnouncements)
      .where(eq(softwareAnnouncements.id, announcementId))

    return c.json({
      success: true,
      message: 'Announcement deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid announcement ID' })
    }

    throw new HTTPException(500, { message: 'Failed to delete announcement' })
  }
})

// POST /software/batch/delete - 批量删除软件
softwareRoutes.post('/batch/delete', async (c) => {
  try {
    const body = await c.req.json()
    const { ids } = batchDeleteSchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select({ id: software.id, name: software.name })
      .from(software)
      .where(inArray(software.id, ids))

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'No software found with provided IDs' })
    }

    // 删除软件（级联删除相关公告）
    const deletedCount = await db.delete(software)
      .where(inArray(software.id, ids))

    return c.json({
      success: true,
      data: {
        deletedCount: existingSoftware.length,
        deletedSoftware: existingSoftware
      },
      message: `Successfully deleted ${existingSoftware.length} software entries`
    })
  } catch (error) {
    console.error('Error batch deleting software:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to batch delete software' })
  }
})

// POST /software/batch/update-status - 批量更新软件状态
softwareRoutes.post('/batch/update-status', async (c) => {
  try {
    const body = await c.req.json()
    const { ids, isActive } = batchUpdateStatusSchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select({ id: software.id, name: software.name })
      .from(software)
      .where(inArray(software.id, ids))

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'No software found with provided IDs' })
    }

    // 更新软件状态
    const updatedSoftware = await db.update(software)
      .set({
        isActive,
        updatedAt: new Date()
      })
      .where(inArray(software.id, ids))
      .returning()

    return c.json({
      success: true,
      data: {
        updatedCount: updatedSoftware.length,
        updatedSoftware
      },
      message: `Successfully updated ${updatedSoftware.length} software entries`
    })
  } catch (error) {
    console.error('Error batch updating software status:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to batch update software status' })
  }
})

// POST /software/:id/upload-image - 上传软件图片
softwareRoutes.post('/:id/upload-image', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 获取上传的文件
    const formData = await c.req.formData()
    const file = formData.get('image') as File

    if (!file) {
      throw new HTTPException(400, { message: 'No image file provided' })
    }

    // 处理文件上传
    const { url, fileName } = await handleFileUpload(file)

    // 更新软件记录，添加图片URL到metadata
    const currentMetadata = (existingSoftware[0].metadata as any) || {}
    const updatedMetadata = {
      ...currentMetadata,
      images: {
        ...(currentMetadata.images || {}),
        icon: url
      }
    }

    const updatedSoftware = await db.update(software)
      .set({
        metadata: updatedMetadata,
        updatedAt: new Date()
      })
      .where(eq(software.id, id))
      .returning()

    return c.json({
      success: true,
      data: {
        imageUrl: url,
        fileName,
        software: updatedSoftware[0]
      },
      message: 'Image uploaded successfully'
    })
  } catch (error) {
    console.error('Error uploading image:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof FileUploadError) {
      throw new HTTPException(400, { message: error.message })
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid software ID' })
    }

    throw new HTTPException(500, { message: 'Failed to upload image' })
  }
})

// GET /software/:id/versions - 获取软件版本历史
softwareRoutes.get('/:id/versions', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 获取版本历史
    const versions = await db.select()
      .from(softwareVersionHistory)
      .where(eq(softwareVersionHistory.softwareId, id))
      .orderBy(desc(softwareVersionHistory.releaseDate))

    return c.json({
      success: true,
      data: {
        software: existingSoftware[0],
        versions
      }
    })
  } catch (error) {
    console.error('Error fetching version history:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, { message: 'Invalid software ID' })
    }

    throw new HTTPException(500, { message: 'Failed to fetch version history' })
  }
})

// POST /software/:id/versions - 添加新版本历史
softwareRoutes.post('/:id/versions', async (c) => {
  try {
    const { id } = softwareIdSchema.parse({ id: c.req.param('id') })
    const body = await c.req.json()
    const validatedData = createVersionHistorySchema.parse(body)

    // 检查软件是否存在
    const existingSoftware = await db.select()
      .from(software)
      .where(eq(software.id, id))
      .limit(1)

    if (existingSoftware.length === 0) {
      throw new HTTPException(404, { message: 'Software not found' })
    }

    // 检查版本是否已存在
    const existingVersion = await db.select()
      .from(softwareVersionHistory)
      .where(and(
        eq(softwareVersionHistory.softwareId, id),
        eq(softwareVersionHistory.version, validatedData.version)
      ))
      .limit(1)

    if (existingVersion.length > 0) {
      throw new HTTPException(409, { message: 'Version already exists' })
    }

    // 创建新版本历史
    const newVersion = await db.insert(softwareVersionHistory)
      .values({
        ...validatedData,
        softwareId: id,
        updatedAt: new Date()
      })
      .returning()

    return c.json({
      success: true,
      data: newVersion[0],
      message: 'Version history created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating version history:', error)

    if (error instanceof HTTPException) {
      throw error
    }

    if (error instanceof z.ZodError) {
      throw new HTTPException(400, {
        message: `Validation error: ${error.issues.map(e => e.message).join(', ')}`
      })
    }

    throw new HTTPException(500, { message: 'Failed to create version history' })
  }
})

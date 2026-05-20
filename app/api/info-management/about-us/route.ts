import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { aboutUsInfo } from '@/lib/info-management-schema';
import { desc } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';
import { z } from 'zod';

const requestSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().min(1, '内容不能为空'),
  category: z.string().min(1, '分类不能为空'),
  displayOrder: z.number().optional(),
  isPublished: z.number().optional(), // Or boolean depending on schema, but let's use number matching the DB fallback
  metadata: z.any().optional()
});

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取所有关于我们信息
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const aboutUs = await db.select().from(aboutUsInfo).orderBy(desc(aboutUsInfo.displayOrder), desc(aboutUsInfo.createdAt));
    return corsResponse({ success: true, data: aboutUs }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取关于我们信息失败:', error);
    return corsResponse(
      { success: false, error: '获取关于我们信息失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// POST - 创建新的关于我们信息
export async function POST(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    // Supabase认证检查（需要管理员权限）
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for info management operations'
      }, { status: 401 }, origin, userAgent)
    }

    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      return corsResponse(
        { success: false, error: '请求数据格式错误', details: parseResult.error.issues },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const { title, content, category, displayOrder, isPublished, metadata } = parseResult.data;

    const newAboutUs = await db.insert(aboutUsInfo).values({
      title,
      content,
      category,
      displayOrder: displayOrder ?? 0,
      isPublished: isPublished ?? 1,
      metadata: metadata ?? null,
      updatedAt: new Date()
    }).returning();

    return corsResponse({ success: true, data: newAboutUs[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('创建关于我们信息失败:', error);
    return corsResponse(
      { success: false, error: '创建关于我们信息失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

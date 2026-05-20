import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { contactInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';
import { z } from 'zod';

const requestSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  description: z.string().min(1, '描述不能为空'),
  info: z.string().min(1, '联系信息不能为空'),
  action: z.string().min(1, '操作名不能为空'),
  analyticsEvent: z.string().min(1, '分析事件名不能为空')
});

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取所有联系方式
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const contacts = await db.select().from(contactInfo);
    return corsResponse({ success: true, data: contacts }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取联系方式失败:', error);
    return corsResponse(
      { success: false, error: '获取联系方式失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// POST - 创建新的联系方式
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

    const { title, description, info, action, analyticsEvent } = parseResult.data;

    const newContact = await db.insert(contactInfo).values({
      title,
      description,
      info,
      action,
      analyticsEvent,
      updatedAt: new Date()
    }).returning();

    return corsResponse({ success: true, data: newContact[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('创建联系方式失败:', error);
    return corsResponse(
      { success: false, error: '创建联系方式失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

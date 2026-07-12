import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { projectsList } from '@/lib/info-management-schema';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';
import { sql } from 'drizzle-orm';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取所有项目
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const projects = await db.select().from(projectsList);
    return corsResponse({ success: true, data: projects }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return corsResponse(
      { success: false, error: '获取项目列表失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// POST - 创建新的项目
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
    const { 
      id, 
      category, 
      categoryName, 
      title, 
      description, 
      platform, 
      updateDate, 
      link, 
      icon, 
      background,
      pLanguage 
    } = body;

    // id 和 icon 在前端是可选或自动生成的，这里不需要强校验
    if (!category || !categoryName || !title || !description || 
        !platform || !updateDate || !link || !pLanguage) {
      return corsResponse(
        { success: false, error: '缺少必要字段' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    // 自动为新项目生成 ID (查询当前最大 ID 并递增 1)
    let projectId = id;
    if (!projectId) {
      const maxIdResult = await db.select({
        maxId: sql<number>`max(${projectsList.id})`
      }).from(projectsList);
      const currentMaxId = maxIdResult[0]?.maxId || 0;
      projectId = currentMaxId + 1;
    }

    const newProject = await db.insert(projectsList).values({
      id: projectId,
      category,
      categoryName,
      title,
      description,
      platform,
      updateDate,
      link,
      icon: icon || '',
      background: background || '',
      pLanguage,
      updatedAt: new Date()
    }).returning();

    return corsResponse({ success: true, data: newProject[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('创建项目失败:', error);
    return corsResponse(
      { success: false, error: '创建项目失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { projectsList } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取特定项目
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return corsResponse(
        { success: false, error: '无效的ID' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const project = await db.select().from(projectsList).where(eq(projectsList.id, id));
    
    if (project.length === 0) {
      return corsResponse(
        { success: false, error: '项目不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: project[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取项目失败:', error);
    return corsResponse(
      { success: false, error: '获取项目失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// PUT - 更新项目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const oldId = parseInt(params.id);
    if (isNaN(oldId)) {
      return corsResponse(
        { success: false, error: '无效的ID' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const body = await request.json();
    const { 
      id: newId,
      category, 
      categoryName, 
      title, 
      description, 
      platform, 
      updateDate, 
      link, 
      icon, 
      pLanguage 
    } = body;

    // 检查项目是否存在
    const existingProject = await db.select().from(projectsList).where(eq(projectsList.id, oldId));
    if (existingProject.length === 0) {
      return corsResponse(
        { success: false, error: '项目不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    // 如果ID发生变化，检查新ID是否已被占用
    if (newId !== undefined && newId !== oldId) {
      const conflictProject = await db.select().from(projectsList).where(eq(projectsList.id, newId));
      if (conflictProject.length > 0) {
        return corsResponse(
          { success: false, error: '新的项目ID已被占用' },
          { status: 409 },
          origin,
          userAgent
        );
      }

      // 删除旧记录并插入新记录（因为主键变更）
      await db.delete(projectsList).where(eq(projectsList.id, oldId));
      const newProject = await db.insert(projectsList).values({
        id: newId,
        category,
        categoryName,
        title,
        description,
        platform,
        updateDate,
        link,
        icon,
        pLanguage,
        updatedAt: new Date()
      }).returning();

      return corsResponse({ success: true, data: newProject[0] }, undefined, origin, userAgent);
    } else {
      // ID未变化，正常更新
      const updatedProject = await db
        .update(projectsList)
        .set({
          category,
          categoryName,
          title,
          description,
          platform,
          updateDate,
          link,
          icon,
          pLanguage,
          updatedAt: new Date()
        })
        .where(eq(projectsList.id, oldId))
        .returning();

      return corsResponse({ success: true, data: updatedProject[0] }, undefined, origin, userAgent);
    }
  } catch (error) {
    console.error('更新项目失败:', error);
    return corsResponse(
      { success: false, error: '更新项目失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// DELETE - 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return corsResponse(
        { success: false, error: '无效的ID' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const deletedProject = await db
      .delete(projectsList)
      .where(eq(projectsList.id, id))
      .returning();

    if (deletedProject.length === 0) {
      return corsResponse(
        { success: false, error: '项目不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: deletedProject[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('删除项目失败:', error);
    return corsResponse(
      { success: false, error: '删除项目失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

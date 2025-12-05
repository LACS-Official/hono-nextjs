import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { aboutUsInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取特定关于我们信息
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

    const aboutUs = await db.select().from(aboutUsInfo).where(eq(aboutUsInfo.id, id));
    
    if (aboutUs.length === 0) {
      return corsResponse(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: aboutUs[0] }, undefined, origin, userAgent);
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

// PUT - 更新关于我们信息
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

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return corsResponse(
        { success: false, error: '无效的ID' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const body = await request.json();
    const { title, content, category, displayOrder, isPublished, metadata } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updatedAboutUs = await db
      .update(aboutUsInfo)
      .set(updateData)
      .where(eq(aboutUsInfo.id, id))
      .returning();

    if (updatedAboutUs.length === 0) {
      return corsResponse(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: updatedAboutUs[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('更新关于我们信息失败:', error);
    return corsResponse(
      { success: false, error: '更新关于我们信息失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// DELETE - 删除关于我们信息
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

    const deletedAboutUs = await db
      .delete(aboutUsInfo)
      .where(eq(aboutUsInfo.id, id))
      .returning();

    if (deletedAboutUs.length === 0) {
      return corsResponse(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: deletedAboutUs[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('删除关于我们信息失败:', error);
    return corsResponse(
      { success: false, error: '删除关于我们信息失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

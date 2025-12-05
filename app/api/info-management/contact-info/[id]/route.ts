import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { contactInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取特定联系方式
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

    const contact = await db.select().from(contactInfo).where(eq(contactInfo.id, id));
    
    if (contact.length === 0) {
      return corsResponse(
        { success: false, error: '联系方式不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: contact[0] }, undefined, origin, userAgent);
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

// PUT - 更新联系方式
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
    const { title, description, info, action, analyticsEvent } = body;

    const updatedContact = await db
      .update(contactInfo)
      .set({
        title,
        description,
        info,
        action,
        analyticsEvent,
        updatedAt: new Date()
      })
      .where(eq(contactInfo.id, id))
      .returning();

    if (updatedContact.length === 0) {
      return corsResponse(
        { success: false, error: '联系方式不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: updatedContact[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('更新联系方式失败:', error);
    return corsResponse(
      { success: false, error: '更新联系方式失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// DELETE - 删除联系方式
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

    const deletedContact = await db
      .delete(contactInfo)
      .where(eq(contactInfo.id, id))
      .returning();

    if (deletedContact.length === 0) {
      return corsResponse(
        { success: false, error: '联系方式不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: deletedContact[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('删除联系方式失败:', error);
    return corsResponse(
      { success: false, error: '删除联系方式失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

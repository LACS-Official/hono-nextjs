import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { groupChats } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取特定群聊
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

    const chat = await db.select().from(groupChats).where(eq(groupChats.id, id));
    
    if (chat.length === 0) {
      return corsResponse(
        { success: false, error: '群聊不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: chat[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取群聊失败:', error);
    return corsResponse(
      { success: false, error: '获取群聊失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// PUT - 更新群聊
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
    const { name, limit, groupNumber, qrcode, joinLink, analyticsEvent } = body;

    const updatedChat = await db
      .update(groupChats)
      .set({
        name,
        limit,
        groupNumber,
        qrcode,
        joinLink,
        analyticsEvent,
        updatedAt: new Date()
      })
      .where(eq(groupChats.id, id))
      .returning();

    if (updatedChat.length === 0) {
      return corsResponse(
        { success: false, error: '群聊不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: updatedChat[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('更新群聊失败:', error);
    return corsResponse(
      { success: false, error: '更新群聊失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// DELETE - 删除群聊
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

    const deletedChat = await db
      .delete(groupChats)
      .where(eq(groupChats.id, id))
      .returning();

    if (deletedChat.length === 0) {
      return corsResponse(
        { success: false, error: '群聊不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: deletedChat[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('删除群聊失败:', error);
    return corsResponse(
      { success: false, error: '删除群聊失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

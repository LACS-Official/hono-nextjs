import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { mediaPlatforms } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取特定媒体平台
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const platform = await db.select().from(mediaPlatforms).where(eq(mediaPlatforms.id, params.id));
    
    if (platform.length === 0) {
      return corsResponse(
        { success: false, error: '媒体平台不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: platform[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取媒体平台失败:', error);
    return corsResponse(
      { success: false, error: '获取媒体平台失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// PUT - 更新媒体平台
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

    const body = await request.json();
    const { 
      name, 
      logo, 
      account, 
      accountId, 
      qrcode, 
      qrcodeTitle, 
      qrcodeDesc, 
      link, 
      analyticsEvent 
    } = body;

    const updatedPlatform = await db
      .update(mediaPlatforms)
      .set({
        name,
        logo,
        account,
        accountId,
        qrcode,
        qrcodeTitle,
        qrcodeDesc,
        link,
        analyticsEvent,
        updatedAt: new Date()
      })
      .where(eq(mediaPlatforms.id, params.id))
      .returning();

    if (updatedPlatform.length === 0) {
      return corsResponse(
        { success: false, error: '媒体平台不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: updatedPlatform[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('更新媒体平台失败:', error);
    return corsResponse(
      { success: false, error: '更新媒体平台失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

// DELETE - 删除媒体平台
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

    const deletedPlatform = await db
      .delete(mediaPlatforms)
      .where(eq(mediaPlatforms.id, params.id))
      .returning();

    if (deletedPlatform.length === 0) {
      return corsResponse(
        { success: false, error: '媒体平台不存在' },
        { status: 404 },
        origin,
        userAgent
      );
    }

    return corsResponse({ success: true, data: deletedPlatform[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('删除媒体平台失败:', error);
    return corsResponse(
      { success: false, error: '删除媒体平台失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

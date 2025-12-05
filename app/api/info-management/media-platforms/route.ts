import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { mediaPlatforms } from '@/lib/info-management-schema';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

// OPTIONS 方法处理 CORS 预检请求
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

// GET - 获取所有媒体平台
export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const platforms = await db.select().from(mediaPlatforms);
    return corsResponse({ success: true, data: platforms }, undefined, origin, userAgent);
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

// POST - 创建新的媒体平台
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

    if (!id || !name || !logo || !account || !accountId || !qrcode || 
        !qrcodeTitle || !qrcodeDesc || !link || !analyticsEvent) {
      return corsResponse(
        { success: false, error: '缺少必要字段' },
        { status: 400 },
        origin,
        userAgent
      );
    }

    const newPlatform = await db.insert(mediaPlatforms).values({
      id,
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
    }).returning();

    return corsResponse({ success: true, data: newPlatform[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('创建媒体平台失败:', error);
    return corsResponse(
      { success: false, error: '创建媒体平台失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

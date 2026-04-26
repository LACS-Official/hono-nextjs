import { NextRequest } from 'next/server';
import { unifiedDb as db, websites } from '@/lib/unified-db-connection';
import { eq } from 'drizzle-orm';
import { authenticateRequest, isAuthorizedAdmin } from '@/lib/auth';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success || !authResult.user || !isAuthorizedAdmin(authResult.user)) {
      return corsResponse({
        success: false,
        error: authResult.error || 'Authentication required for info management operations'
      }, { status: 401 }, origin, userAgent)
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return corsResponse({ success: false, error: '无效的ID' }, { status: 400 }, origin, userAgent);
    }

    const body = await request.json();
    const { isShowInAboutUs } = body;

    if (typeof isShowInAboutUs !== 'boolean') {
      return corsResponse({ success: false, error: '参数不正确' }, { status: 400 }, origin, userAgent);
    }

    const updatedWebsite = await db
      .update(websites)
      .set({
        isShowInAboutUs,
        updatedAt: new Date()
      })
      .where(eq(websites.id, id))
      .returning();

    if (updatedWebsite.length === 0) {
      return corsResponse({ success: false, error: '网站不存在' }, { status: 404 }, origin, userAgent);
    }

    return corsResponse({ success: true, data: updatedWebsite[0] }, undefined, origin, userAgent);
  } catch (error) {
    console.error('更新系统分站展示失败:', error);
    return corsResponse(
      { success: false, error: '更新失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

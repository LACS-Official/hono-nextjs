import { NextRequest } from 'next/server';
import { unifiedDb as db, websites } from '@/lib/unified-db-connection';
import { eq, desc } from 'drizzle-orm';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')
  return handleOptions(origin, userAgent)
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('Origin')
  const userAgent = request.headers.get('User-Agent')

  try {
    const url = new URL(request.url)
    const isPublic = url.searchParams.get('public') === 'true'

    let conditions = undefined;
    if (isPublic) {
      conditions = eq(websites.isShowInAboutUs, true);
    }

    const sites = await db
      .select({
        id: websites.id,
        name: websites.name,
        domain: websites.domain,
        description: websites.description,
        logo: websites.logo,
        isShowInAboutUs: websites.isShowInAboutUs,
        isActive: websites.isActive,
      })
      .from(websites)
      .where(conditions)
      .orderBy(desc(websites.createdAt));

    const filteredSites = isPublic ? sites.filter((s:any) => s.isActive) : sites;

    return corsResponse({ success: true, data: filteredSites }, undefined, origin, userAgent);
  } catch (error) {
    console.error('获取分站列表失败:', error);
    return corsResponse(
      { success: false, error: '获取分站列表失败' },
      { status: 500 },
      origin,
      userAgent
    );
  }
}

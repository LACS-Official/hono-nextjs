import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { mediaPlatforms } from '@/lib/info-management-schema';

// GET - 获取所有媒体平台
export async function GET() {
  try {
    const platforms = await db.select().from(mediaPlatforms);
    return NextResponse.json({ success: true, data: platforms });
  } catch (error) {
    console.error('获取媒体平台失败:', error);
    return NextResponse.json(
      { success: false, error: '获取媒体平台失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的媒体平台
export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { success: false, error: '缺少必要字段' },
        { status: 400 }
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

    return NextResponse.json({ success: true, data: newPlatform[0] });
  } catch (error) {
    console.error('创建媒体平台失败:', error);
    return NextResponse.json(
      { success: false, error: '创建媒体平台失败' },
      { status: 500 }
    );
  }
}

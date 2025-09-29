import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/unified-db-connection';
import { mediaPlatforms } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取特定媒体平台
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const platform = await db.select().from(mediaPlatforms).where(eq(mediaPlatforms.id, params.id));
    
    if (platform.length === 0) {
      return NextResponse.json(
        { success: false, error: '媒体平台不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: platform[0] });
  } catch (error) {
    console.error('获取媒体平台失败:', error);
    return NextResponse.json(
      { success: false, error: '获取媒体平台失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新媒体平台
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        updatedAt: new Date().toISOString()
      })
      .where(eq(mediaPlatforms.id, params.id))
      .returning();

    if (updatedPlatform.length === 0) {
      return NextResponse.json(
        { success: false, error: '媒体平台不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedPlatform[0] });
  } catch (error) {
    console.error('更新媒体平台失败:', error);
    return NextResponse.json(
      { success: false, error: '更新媒体平台失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除媒体平台
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deletedPlatform = await db
      .delete(mediaPlatforms)
      .where(eq(mediaPlatforms.id, params.id))
      .returning();

    if (deletedPlatform.length === 0) {
      return NextResponse.json(
        { success: false, error: '媒体平台不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedPlatform[0] });
  } catch (error) {
    console.error('删除媒体平台失败:', error);
    return NextResponse.json(
      { success: false, error: '删除媒体平台失败' },
      { status: 500 }
    );
  }
}

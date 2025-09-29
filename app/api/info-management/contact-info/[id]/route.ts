import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { contactInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取特定联系方式
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
      );
    }

    const contact = await db.select().from(contactInfo).where(eq(contactInfo.id, id));
    
    if (contact.length === 0) {
      return NextResponse.json(
        { success: false, error: '联系方式不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contact[0] });
  } catch (error) {
    console.error('获取联系方式失败:', error);
    return NextResponse.json(
      { success: false, error: '获取联系方式失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新联系方式
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
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
      return NextResponse.json(
        { success: false, error: '联系方式不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedContact[0] });
  } catch (error) {
    console.error('更新联系方式失败:', error);
    return NextResponse.json(
      { success: false, error: '更新联系方式失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除联系方式
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
      );
    }

    const deletedContact = await db
      .delete(contactInfo)
      .where(eq(contactInfo.id, id))
      .returning();

    if (deletedContact.length === 0) {
      return NextResponse.json(
        { success: false, error: '联系方式不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedContact[0] });
  } catch (error) {
    console.error('删除联系方式失败:', error);
    return NextResponse.json(
      { success: false, error: '删除联系方式失败' },
      { status: 500 }
    );
  }
}

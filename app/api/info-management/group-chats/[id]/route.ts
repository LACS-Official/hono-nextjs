import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { groupChats } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取特定群聊
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

    const chat = await db.select().from(groupChats).where(eq(groupChats.id, id));
    
    if (chat.length === 0) {
      return NextResponse.json(
        { success: false, error: '群聊不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: chat[0] });
  } catch (error) {
    console.error('获取群聊失败:', error);
    return NextResponse.json(
      { success: false, error: '获取群聊失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新群聊
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
      return NextResponse.json(
        { success: false, error: '群聊不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedChat[0] });
  } catch (error) {
    console.error('更新群聊失败:', error);
    return NextResponse.json(
      { success: false, error: '更新群聊失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除群聊
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

    const deletedChat = await db
      .delete(groupChats)
      .where(eq(groupChats.id, id))
      .returning();

    if (deletedChat.length === 0) {
      return NextResponse.json(
        { success: false, error: '群聊不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedChat[0] });
  } catch (error) {
    console.error('删除群聊失败:', error);
    return NextResponse.json(
      { success: false, error: '删除群聊失败' },
      { status: 500 }
    );
  }
}

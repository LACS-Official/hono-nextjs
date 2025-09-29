import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { groupChats } from '@/lib/info-management-schema';

// GET - 获取所有群聊
export async function GET() {
  try {
    const chats = await db.select().from(groupChats);
    return NextResponse.json({ success: true, data: chats });
  } catch (error) {
    console.error('获取群聊列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取群聊列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的群聊
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, limit, groupNumber, qrcode, joinLink, analyticsEvent } = body;

    if (!name || !limit || !groupNumber || !qrcode || !joinLink || !analyticsEvent) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段' },
        { status: 400 }
      );
    }

    const newChat = await db.insert(groupChats).values({
      name,
      limit,
      groupNumber,
      qrcode,
      joinLink,
      analyticsEvent,
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({ success: true, data: newChat[0] });
  } catch (error) {
    console.error('创建群聊失败:', error);
    return NextResponse.json(
      { success: false, error: '创建群聊失败' },
      { status: 500 }
    );
  }
}

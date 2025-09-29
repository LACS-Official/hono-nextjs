import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/unified-db-connection';
import { contactInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取所有联系方式
export async function GET() {
  try {
    const contacts = await db.select().from(contactInfo);
    return NextResponse.json({ success: true, data: contacts });
  } catch (error) {
    console.error('获取联系方式失败:', error);
    return NextResponse.json(
      { success: false, error: '获取联系方式失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的联系方式
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, info, action, analyticsEvent } = body;

    if (!title || !description || !info || !action || !analyticsEvent) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段' },
        { status: 400 }
      );
    }

    const newContact = await db.insert(contactInfo).values({
      title,
      description,
      info,
      action,
      analyticsEvent,
      updatedAt: new Date().toISOString()
    }).returning();

    return NextResponse.json({ success: true, data: newContact[0] });
  } catch (error) {
    console.error('创建联系方式失败:', error);
    return NextResponse.json(
      { success: false, error: '创建联系方式失败' },
      { status: 500 }
    );
  }
}

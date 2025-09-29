import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { aboutUsInfo } from '@/lib/info-management-schema';
import { desc } from 'drizzle-orm';

// GET - 获取所有关于我们信息
export async function GET() {
  try {
    const aboutUs = await db.select().from(aboutUsInfo).orderBy(desc(aboutUsInfo.displayOrder), desc(aboutUsInfo.createdAt));
    return NextResponse.json({ success: true, data: aboutUs });
  } catch (error) {
    console.error('获取关于我们信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取关于我们信息失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的关于我们信息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, displayOrder, isPublished, metadata } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段（标题、内容、分类）' },
        { status: 400 }
      );
    }

    const newAboutUs = await db.insert(aboutUsInfo).values({
      title,
      content,
      category,
      displayOrder: displayOrder ?? 0,
      isPublished: isPublished ?? 1,
      metadata: metadata ?? null,
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({ success: true, data: newAboutUs[0] });
  } catch (error) {
    console.error('创建关于我们信息失败:', error);
    return NextResponse.json(
      { success: false, error: '创建关于我们信息失败' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { projectsList } from '@/lib/info-management-schema';

// GET - 获取所有项目
export async function GET() {
  try {
    const projects = await db.select().from(projectsList);
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的项目
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      category, 
      categoryName, 
      title, 
      description, 
      platform, 
      updateDate, 
      link, 
      icon, 
      pLanguage 
    } = body;

    if (!id || !category || !categoryName || !title || !description || 
        !platform || !updateDate || !link || !icon || !pLanguage) {
      return NextResponse.json(
        { success: false, error: '缺少必要字段' },
        { status: 400 }
      );
    }

    const newProject = await db.insert(projectsList).values({
      id,
      category,
      categoryName,
      title,
      description,
      platform,
      updateDate,
      link,
      icon,
      pLanguage,
      updatedAt: new Date()
    }).returning();

    return NextResponse.json({ success: true, data: newProject[0] });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { success: false, error: '创建项目失败' },
      { status: 500 }
    );
  }
}

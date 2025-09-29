import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { projectsList } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取特定项目
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

    const project = await db.select().from(projectsList).where(eq(projectsList.id, id));
    
    if (project.length === 0) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project[0] });
  } catch (error) {
    console.error('获取项目失败:', error);
    return NextResponse.json(
      { success: false, error: '获取项目失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新项目
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
    const { 
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

    const updatedProject = await db
      .update(projectsList)
      .set({
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
      })
      .where(eq(projectsList.id, id))
      .returning();

    if (updatedProject.length === 0) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedProject[0] });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json(
      { success: false, error: '更新项目失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除项目
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

    const deletedProject = await db
      .delete(projectsList)
      .where(eq(projectsList.id, id))
      .returning();

    if (deletedProject.length === 0) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedProject[0] });
  } catch (error) {
    console.error('删除项目失败:', error);
    return NextResponse.json(
      { success: false, error: '删除项目失败' },
      { status: 500 }
    );
  }
}

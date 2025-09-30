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
    const oldId = parseInt(params.id);
    if (isNaN(oldId)) {
      return NextResponse.json(
        { success: false, error: '无效的ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      id: newId,
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

    // 检查项目是否存在
    const existingProject = await db.select().from(projectsList).where(eq(projectsList.id, oldId));
    if (existingProject.length === 0) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    // 如果ID发生变化，检查新ID是否已被占用
    if (newId !== undefined && newId !== oldId) {
      const conflictProject = await db.select().from(projectsList).where(eq(projectsList.id, newId));
      if (conflictProject.length > 0) {
        return NextResponse.json(
          { success: false, error: '新的项目ID已被占用' },
          { status: 409 }
        );
      }

      // 删除旧记录并插入新记录（因为主键变更）
      await db.delete(projectsList).where(eq(projectsList.id, oldId));
      const newProject = await db.insert(projectsList).values({
        id: newId,
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
    } else {
      // ID未变化，正常更新
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
        .where(eq(projectsList.id, oldId))
        .returning();

      return NextResponse.json({ success: true, data: updatedProject[0] });
    }
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

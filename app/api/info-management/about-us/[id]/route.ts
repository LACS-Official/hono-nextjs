import { NextRequest, NextResponse } from 'next/server';
import { unifiedDb as db } from '@/lib/unified-db-connection';
import { aboutUsInfo } from '@/lib/info-management-schema';
import { eq } from 'drizzle-orm';

// GET - 获取特定关于我们信息
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

    const aboutUs = await db.select().from(aboutUsInfo).where(eq(aboutUsInfo.id, id));
    
    if (aboutUs.length === 0) {
      return NextResponse.json(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: aboutUs[0] });
  } catch (error) {
    console.error('获取关于我们信息失败:', error);
    return NextResponse.json(
      { success: false, error: '获取关于我们信息失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新关于我们信息
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
    const { title, content, category, displayOrder, isPublished, metadata } = body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (metadata !== undefined) updateData.metadata = metadata;

    const updatedAboutUs = await db
      .update(aboutUsInfo)
      .set(updateData)
      .where(eq(aboutUsInfo.id, id))
      .returning();

    if (updatedAboutUs.length === 0) {
      return NextResponse.json(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedAboutUs[0] });
  } catch (error) {
    console.error('更新关于我们信息失败:', error);
    return NextResponse.json(
      { success: false, error: '更新关于我们信息失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除关于我们信息
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

    const deletedAboutUs = await db
      .delete(aboutUsInfo)
      .where(eq(aboutUsInfo.id, id))
      .returning();

    if (deletedAboutUs.length === 0) {
      return NextResponse.json(
        { success: false, error: '关于我们信息不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedAboutUs[0] });
  } catch (error) {
    console.error('删除关于我们信息失败:', error);
    return NextResponse.json(
      { success: false, error: '删除关于我们信息失败' },
      { status: 500 }
    );
  }
}

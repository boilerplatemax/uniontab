import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { fileCategories, files, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, oldName, newName } = await request.json();

    if (!unionId || !oldName || !newName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate new name is not empty
    if (newName.trim() === '') {
      return NextResponse.json(
        { error: 'Category name cannot be empty' },
        { status: 400 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can rename categories' },
        { status: 403 }
      );
    }

    // Check if a category with the new name already exists
    const [existingCategory] = await db
      .select()
      .from(fileCategories)
      .where(
        and(eq(fileCategories.unionId, unionId), eq(fileCategories.name, newName))
      )
      .limit(1);

    if (existingCategory && existingCategory.name !== oldName) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    // Update the category name in fileCategories table
    await db
      .update(fileCategories)
      .set({ name: newName })
      .where(
        and(eq(fileCategories.unionId, unionId), eq(fileCategories.name, oldName))
      );

    // Update all files that have this category
    await db
      .update(files)
      .set({ category: newName })
      .where(and(eq(files.unionId, unionId), eq(files.category, oldName)));

    return NextResponse.json({
      success: true,
      message: 'Category renamed successfully',
    });
  } catch (error) {
    console.error('Error renaming category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

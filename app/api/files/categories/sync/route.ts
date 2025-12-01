import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { fileCategories, files, members } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId } = await request.json();

    if (!unionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to access this union' },
        { status: 403 }
      );
    }

    // Get all unique categories from files table for this union
    const uniqueCategories = await db
      .selectDistinct({ category: files.category })
      .from(files)
      .where(and(eq(files.unionId, unionId), sql`${files.category} IS NOT NULL`));

    // Get existing categories from file_categories table
    const existingCategories = await db
      .select()
      .from(fileCategories)
      .where(eq(fileCategories.unionId, unionId));

    const existingCategoryNames = new Set(existingCategories.map((c) => c.name));

    // Insert new categories that don't exist yet
    const newCategories = uniqueCategories
      .filter((c) => c.category && !existingCategoryNames.has(c.category))
      .map((c, index) => ({
        unionId,
        name: c.category!,
        sortOrder: existingCategories.length + index,
      }));

    if (newCategories.length > 0) {
      await db.insert(fileCategories).values(newCategories);
    }

    // Get all categories with their order
    const allCategories = await db
      .select()
      .from(fileCategories)
      .where(eq(fileCategories.unionId, unionId))
      .orderBy(fileCategories.sortOrder);

    return NextResponse.json({ success: true, categories: allCategories });
  } catch (error) {
    console.error('Error syncing categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

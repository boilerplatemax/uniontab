import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { fileCategories, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, categoryOrders } = await request.json();

    if (!unionId || !categoryOrders || !Array.isArray(categoryOrders)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Only union owners can reorder categories' },
        { status: 403 }
      );
    }

    // Update all category orders in batch
    const updatePromises = categoryOrders.map((item: { name: string; sortOrder: number }) => {
      return db
        .update(fileCategories)
        .set({ sortOrder: item.sortOrder })
        .where(and(eq(fileCategories.unionId, unionId), eq(fileCategories.name, item.name)))
        .returning();
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

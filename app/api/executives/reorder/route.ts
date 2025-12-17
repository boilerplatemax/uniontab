import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionExecutives, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, executiveIds } = await request.json();

    if (!unionId || !executiveIds || !Array.isArray(executiveIds)) {
      return NextResponse.json(
        { error: 'Union ID and executive IDs array are required' },
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
        { error: 'Only union owners can reorder executives' },
        { status: 403 }
      );
    }

    // Update sort order for each executive
    await Promise.all(
      executiveIds.map((id: number, index: number) =>
        db
          .update(unionExecutives)
          .set({ sortOrder: index, updatedAt: new Date(), updatedBy: user.id })
          .where(and(eq(unionExecutives.id, id), eq(unionExecutives.unionId, unionId)))
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering executives:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

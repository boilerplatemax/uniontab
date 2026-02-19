import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { files, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin or owner
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.status, 'approved')
        )
      )
      .limit(1);

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden: admin or owner access required' }, { status: 403 });
    }

    const body = await request.json();
    // orderedIds: array of file IDs in the desired order
    const { orderedIds } = body as { orderedIds: number[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 });
    }

    // Update sortOrder for each file
    await Promise.all(
      orderedIds.map((id, index) =>
        db
          .update(files)
          .set({ sortOrder: index })
          .where(
            and(
              eq(files.id, id),
              eq(files.unionId, membership.unionId),
              eq(files.category, 'gallery')
            )
          )
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering gallery:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

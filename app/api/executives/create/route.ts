import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionExecutives, members } from '@/lib/db/schema';
import { eq, and, max } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, name, title, email, phone, photoUrl } = await request.json();

    if (!unionId || !name || !title) {
      return NextResponse.json(
        { error: 'Union ID, name, and title are required' },
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
        { error: 'Only union owners can create executives' },
        { status: 403 }
      );
    }

    // Get the max sortOrder for this union
    const [maxOrder] = await db
      .select({ maxSort: max(unionExecutives.sortOrder) })
      .from(unionExecutives)
      .where(eq(unionExecutives.unionId, unionId));

    const nextSortOrder = (maxOrder?.maxSort ?? -1) + 1;

    // Create the executive
    const [newExecutive] = await db
      .insert(unionExecutives)
      .values({
        unionId,
        name,
        title,
        email: email || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        sortOrder: nextSortOrder,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, executive: newExecutive });
  } catch (error) {
    console.error('Error creating executive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

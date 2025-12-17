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

    const { executiveId } = await request.json();

    if (!executiveId) {
      return NextResponse.json(
        { error: 'Executive ID is required' },
        { status: 400 }
      );
    }

    // Get the executive to find the union
    const [executive] = await db
      .select()
      .from(unionExecutives)
      .where(eq(unionExecutives.id, executiveId))
      .limit(1);

    if (!executive) {
      return NextResponse.json(
        { error: 'Executive not found' },
        { status: 404 }
      );
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, executive.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can delete executives' },
        { status: 403 }
      );
    }

    // Delete the executive
    await db
      .delete(unionExecutives)
      .where(eq(unionExecutives.id, executiveId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting executive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

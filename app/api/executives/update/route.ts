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

    const { executiveId, name, title, email, phone, photoUrl } = await request.json();

    if (!executiveId || !name || !title) {
      return NextResponse.json(
        { error: 'Executive ID, name, and title are required' },
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
        { error: 'Only union owners can update executives' },
        { status: 403 }
      );
    }

    // Update the executive
    const [updatedExecutive] = await db
      .update(unionExecutives)
      .set({
        name,
        title,
        email: email || null,
        phone: phone || null,
        photoUrl: photoUrl || null,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(unionExecutives.id, executiveId))
      .returning();

    return NextResponse.json({ success: true, executive: updatedExecutive });
  } catch (error) {
    console.error('Error updating executive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

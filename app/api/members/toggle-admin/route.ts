import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, role } = await request.json();

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'member') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the member to check union ownership
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent modifying owners
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot modify union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, memberToUpdate.unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can modify member roles' },
        { status: 403 }
      );
    }

    // Update the member role
    await db
      .update(members)
      .set({ role })
      .where(eq(members.id, memberId));

    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

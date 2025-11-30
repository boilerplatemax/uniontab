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

    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { error: 'Missing member ID' },
        { status: 400 }
      );
    }

    // Get the member to check union ownership
    const [memberToDelete] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToDelete) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent deleting owners
    if (memberToDelete.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot delete union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, memberToDelete.unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can delete members' },
        { status: 403 }
      );
    }

    // Delete the member
    await db
      .delete(members)
      .where(eq(members.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

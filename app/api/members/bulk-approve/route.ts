import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberIds, status } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid member IDs' },
        { status: 400 }
      );
    }

    if (!status || !['approved', 'pending', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved, pending, or rejected' },
        { status: 400 }
      );
    }

    // Get all members to update
    const membersToUpdate = await db
      .select()
      .from(members)
      .where(inArray(members.id, memberIds));

    if (membersToUpdate.length === 0) {
      return NextResponse.json({ error: 'No members found' }, { status: 404 });
    }

    // Prevent updating owners
    const ownerMembers = membersToUpdate.filter(m => m.role === 'owner');
    if (ownerMembers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot update union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const unionId = membersToUpdate[0].unionId;
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember || requestingMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can update member status' },
        { status: 403 }
      );
    }

    // Update all members at once
    await db
      .update(members)
      .set({ status })
      .where(inArray(members.id, memberIds));

    return NextResponse.json({
      success: true,
      updatedCount: membersToUpdate.length,
      status
    });
  } catch (error) {
    console.error('Error bulk updating members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

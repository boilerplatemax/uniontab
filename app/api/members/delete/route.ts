import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, emailLogs } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
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

    // Check if the user has memberships in other unions
    const otherMemberships = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, memberToDelete.userId),
          ne(members.id, memberId)
        )
      );

    // Use a transaction to ensure all deletes happen atomically
    await db.transaction(async (tx) => {
      // Delete email logs associated with this member first
      await tx
        .delete(emailLogs)
        .where(eq(emailLogs.memberId, memberId));

      // Delete the member record
      await tx
        .delete(members)
        .where(eq(members.id, memberId));

      // If the user has no other union memberships, delete the user account
      // The cascade deletes in the schema will handle cleaning up related data
      // (election votes, post likes, dismissed announcements, etc.)
      if (otherMemberships.length === 0) {
        await tx
          .delete(users)
          .where(eq(users.id, memberToDelete.userId));

        console.log(`Deleted user account ${memberToDelete.userId} (no other union memberships)`);
      }
    });

    return NextResponse.json({
      success: true,
      userDeleted: otherMemberships.length === 0
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

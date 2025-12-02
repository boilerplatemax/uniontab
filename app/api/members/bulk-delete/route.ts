import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, users, emailLogs } from '@/lib/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberIds } = await request.json();

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid member IDs' },
        { status: 400 }
      );
    }

    // Get all members to delete
    const membersToDelete = await db
      .select()
      .from(members)
      .where(inArray(members.id, memberIds));

    if (membersToDelete.length === 0) {
      return NextResponse.json({ error: 'No members found' }, { status: 404 });
    }

    // Prevent deleting owners
    const ownerMembers = membersToDelete.filter(m => m.role === 'owner');
    if (ownerMembers.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete union owners' },
        { status: 403 }
      );
    }

    // Check if the requesting user is an owner of the union
    const unionId = membersToDelete[0].unionId;
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
        { error: 'Only union owners can delete members' },
        { status: 403 }
      );
    }

    let deletedCount = 0;
    let userAccountsDeleted = 0;

    // Delete each member
    for (const memberToDelete of membersToDelete) {
      // Check if the user has memberships in other unions
      const otherMemberships = await db
        .select()
        .from(members)
        .where(
          and(
            eq(members.userId, memberToDelete.userId),
            ne(members.id, memberToDelete.id)
          )
        );

      // Delete email logs associated with this member first
      await db
        .delete(emailLogs)
        .where(eq(emailLogs.memberId, memberToDelete.id));

      // Delete the member record
      await db
        .delete(members)
        .where(eq(members.id, memberToDelete.id));

      deletedCount++;

      // If the user has no other union memberships, delete the user account
      if (otherMemberships.length === 0) {
        await db
          .delete(users)
          .where(eq(users.id, memberToDelete.userId));

        userAccountsDeleted++;
        console.log(`Deleted user account ${memberToDelete.userId} (no other union memberships)`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      userAccountsDeleted
    });
  } catch (error) {
    console.error('Error bulk deleting members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

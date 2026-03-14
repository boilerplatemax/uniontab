import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');
    const status = searchParams.get('status') || undefined;

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is an admin/owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member of this union' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isElectionCommittee = membership.role === 'election_committee';

    if (!isOwnerOrAdmin && !isElectionCommittee) {
      return NextResponse.json(
        { error: 'Only admins, owners, or Election Committee members can access member list' },
        { status: 403 }
      );
    }

    // Build conditions
    const conditions = [eq(members.unionId, unionId)];

    // Filter by status if provided
    if (status) {
      conditions.push(eq(members.status, status));
    }

    const membersList = await db
      .select({
        id: members.id,
        userId: members.userId,
        role: members.role,
        status: members.status,
        firstName: members.firstName,
        lastName: members.lastName,
        memberId: members.memberId,
        employer: members.employer,
        jobTitle: members.jobTitle,
        worksite: members.worksite,
        employmentStatus: members.employmentStatus,
        localChapter: members.localChapter,
        bargainingUnit: members.bargainingUnit,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(members)
      .leftJoin(users, eq(members.userId, users.id))
      .where(and(...conditions));

    // Filter out members with null user data (orphaned members)
    const validMembers = membersList.filter(m => m.user && m.user.id !== null);

    return NextResponse.json({ success: true, members: validMembers });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

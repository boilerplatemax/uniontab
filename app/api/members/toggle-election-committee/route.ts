import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/admin-permissions';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { memberId, action } = await request.json();

    if (!memberId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action !== 'assign' && action !== 'remove') {
      return NextResponse.json({ error: 'Invalid action. Use "assign" or "remove".' }, { status: 400 });
    }

    // Get the member to update
    const [memberToUpdate] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change owners
    if (memberToUpdate.role === 'owner') {
      return NextResponse.json({ error: 'Cannot modify union owners' }, { status: 403 });
    }

    // Cannot assign election_committee to admins (mutually exclusive)
    if (action === 'assign' && memberToUpdate.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot be assigned to the Election Committee. Remove admin role first.' },
        { status: 400 }
      );
    }

    // Check that the requesting user is owner OR admin with elections permission for this union
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

    if (!requestingMember) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const isOwner = requestingMember.role === 'owner';
    const isAdminWithElections = requestingMember.role === 'admin' &&
      hasPermission(requestingMember.role, requestingMember.adminPermissions as any, 'elections');

    if (!isOwner && !isAdminWithElections) {
      return NextResponse.json(
        { error: 'Only owners or admins with elections permission can manage Election Committee members' },
        { status: 403 }
      );
    }

    const newRole = action === 'assign' ? 'election_committee' : 'member';

    await db
      .update(members)
      .set({ role: newRole, adminPermissions: null })
      .where(eq(members.id, memberId));

    return NextResponse.json({
      success: true,
      role: newRole,
      message: action === 'assign'
        ? 'Member assigned to Election Committee'
        : 'Election Committee role removed',
    });
  } catch (error) {
    console.error('Error updating election committee role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { memberGroups, memberGroupAssignments, members, unions } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/admin-permissions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const groupIdNum = parseInt(groupId, 10);

    // Get the group
    const [group] = await db
      .select()
      .from(memberGroups)
      .where(eq(memberGroups.id, groupIdNum))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify membership and role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, group.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this union' }, { status: 403 });
    }

    if (!hasPermission(membership.role, membership.adminPermissions as any, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check demo mode
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, group.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Demo unions are read-only' }, { status: 403 });
    }

    const { memberIds } = await request.json();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'memberIds must be a non-empty array' }, { status: 400 });
    }

    // Verify all memberIds belong to the same union (tenant isolation)
    const validMembers = await db
      .select({ id: members.id })
      .from(members)
      .where(and(eq(members.unionId, group.unionId), inArray(members.id, memberIds)));

    const validMemberIds = validMembers.map((m) => m.id);

    if (validMemberIds.length === 0) {
      return NextResponse.json({ error: 'No valid members found' }, { status: 400 });
    }

    // Insert assignments with ON CONFLICT DO NOTHING for idempotency
    const values = validMemberIds.map((memberId) => ({
      groupId: groupIdNum,
      memberId,
      assignedBy: user.id,
    }));

    await db
      .insert(memberGroupAssignments)
      .values(values)
      .onConflictDoNothing({ target: [memberGroupAssignments.groupId, memberGroupAssignments.memberId] });

    return NextResponse.json({ added: validMemberIds.length });
  } catch (error) {
    console.error('Error adding members to group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const groupIdNum = parseInt(groupId, 10);

    // Get the group
    const [group] = await db
      .select()
      .from(memberGroups)
      .where(eq(memberGroups.id, groupIdNum))
      .limit(1);

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify membership and role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, group.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this union' }, { status: 403 });
    }

    if (!hasPermission(membership.role, membership.adminPermissions as any, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check demo mode
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, group.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Demo unions are read-only' }, { status: 403 });
    }

    const { memberIds } = await request.json();

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'memberIds must be a non-empty array' }, { status: 400 });
    }

    // Delete assignments
    const result = await db
      .delete(memberGroupAssignments)
      .where(
        and(
          eq(memberGroupAssignments.groupId, groupIdNum),
          inArray(memberGroupAssignments.memberId, memberIds)
        )
      )
      .returning();

    return NextResponse.json({ removed: result.length });
  } catch (error) {
    console.error('Error removing members from group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { memberGroups, memberGroupAssignments, members, users, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/admin-permissions';

async function getGroupWithAuth(groupId: number, userId: number) {
  // Get the group
  const [group] = await db
    .select()
    .from(memberGroups)
    .where(eq(memberGroups.id, groupId))
    .limit(1);

  if (!group) {
    return { error: 'Group not found', status: 404 };
  }

  // Verify membership and role
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, group.unionId), eq(members.userId, userId)))
    .limit(1);

  if (!membership) {
    return { error: 'Not a member of this union', status: 403 };
  }

  if (!hasPermission(membership.role, membership.adminPermissions as any, 'members')) {
    return { error: 'Insufficient permissions', status: 403 };
  }

  return { group, membership };
}

export async function GET(
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

    const result = await getGroupWithAuth(groupIdNum, user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { group } = result;

    // Get group members with user details
    const assignments = await db
      .select({
        assignmentId: memberGroupAssignments.id,
        assignedAt: memberGroupAssignments.assignedAt,
        member: {
          id: members.id,
          role: members.role,
          status: members.status,
          memberId: members.memberId,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(memberGroupAssignments)
      .innerJoin(members, eq(memberGroupAssignments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(memberGroupAssignments.groupId, groupIdNum));

    return NextResponse.json({
      group: {
        ...group,
        members: assignments,
      },
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const result = await getGroupWithAuth(groupIdNum, user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { group } = result;

    // Check demo mode
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, group.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Demo unions are read-only' }, { status: 403 });
    }

    const { name, description } = await request.json();

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;

    const [updatedGroup] = await db
      .update(memberGroups)
      .set(updateData)
      .where(eq(memberGroups.id, groupIdNum))
      .returning();

    return NextResponse.json({ group: updatedGroup });
  } catch (error: any) {
    if (error?.code === '23505' || error?.message?.includes('unique_union_group_name')) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error updating group:', error);
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

    const result = await getGroupWithAuth(groupIdNum, user.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { group } = result;

    // Check demo mode
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, group.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Demo unions are read-only' }, { status: 403 });
    }

    await db.delete(memberGroups).where(eq(memberGroups.id, groupIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

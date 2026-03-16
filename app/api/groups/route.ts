import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { memberGroups, memberGroupAssignments, members, unions } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { hasPermission } from '@/lib/admin-permissions';

export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json({ error: 'Missing unionId' }, { status: 400 });
    }

    const unionIdNum = parseInt(unionId, 10);

    // Verify membership and role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionIdNum), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this union' }, { status: 403 });
    }

    if (!hasPermission(membership.role, membership.adminPermissions as any, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all groups with member count
    const groups = await db
      .select({
        id: memberGroups.id,
        name: memberGroups.name,
        description: memberGroups.description,
        createdAt: memberGroups.createdAt,
        updatedAt: memberGroups.updatedAt,
        memberCount: sql<number>`count(${memberGroupAssignments.id})::int`,
      })
      .from(memberGroups)
      .leftJoin(memberGroupAssignments, eq(memberGroups.id, memberGroupAssignments.groupId))
      .where(eq(memberGroups.unionId, unionIdNum))
      .groupBy(memberGroups.id)
      .orderBy(memberGroups.name);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { unionId, name, description } = await request.json();

    if (!unionId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify membership and role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
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
      .where(eq(unions.id, unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json({ error: 'Demo unions are read-only' }, { status: 403 });
    }

    // Create the group
    const [newGroup] = await db
      .insert(memberGroups)
      .values({
        unionId,
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ group: newGroup });
  } catch (error: any) {
    // Handle unique constraint violation (duplicate name)
    if (error?.code === '23505' || error?.message?.includes('unique_union_group_name')) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 409 }
      );
    }
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

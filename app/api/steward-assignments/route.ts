import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, users, stewardAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/admin-permissions';

// GET - List steward assignments for a union
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');

    if (!unionId) {
      return NextResponse.json({ error: 'Union ID is required' }, { status: 400 });
    }

    // Verify user is an approved member
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
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 });
    }

    // Fetch all steward assignments with member/user details
    const assignments = await db
      .select({
        id: stewardAssignments.id,
        scopeType: stewardAssignments.scopeType,
        scopeValue: stewardAssignments.scopeValue,
        assignedAt: stewardAssignments.assignedAt,
        memberId: stewardAssignments.memberId,
        memberFirstName: members.firstName,
        memberLastName: members.lastName,
        memberEmail: members.personalEmail,
        memberPhone: members.cellPhone,
        memberProfilePhotoUrl: members.profilePhotoUrl,
        userName: users.name,
        userEmail: users.email,
      })
      .from(stewardAssignments)
      .innerJoin(members, eq(stewardAssignments.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(stewardAssignments.unionId, unionId));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching steward assignments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Assign a steward (admin only)
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unionId, memberId, scopeType, scopeValue } = body;

    if (!unionId || !memberId || !scopeType || !scopeValue) {
      return NextResponse.json({ error: 'Missing required fields: unionId, memberId, scopeType, scopeValue' }, { status: 400 });
    }

    const validScopeTypes = ['bargaining_unit', 'department', 'sub_unit'];
    if (!validScopeTypes.includes(scopeType)) {
      return NextResponse.json({ error: 'Invalid scopeType. Must be: bargaining_unit, department, or sub_unit' }, { status: 400 });
    }

    // Check admin permissions
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || !hasPermission(membership.role, membership.adminPermissions, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify the target member belongs to the same union
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.unionId, unionId),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this union' }, { status: 404 });
    }

    // Upsert - insert or replace existing assignment for this scope
    const [assignment] = await db
      .insert(stewardAssignments)
      .values({
        unionId,
        memberId,
        scopeType,
        scopeValue: scopeValue.trim(),
        assignedBy: user.id,
      })
      .onConflictDoUpdate({
        target: [stewardAssignments.unionId, stewardAssignments.scopeType, stewardAssignments.scopeValue],
        set: {
          memberId,
          assignedBy: user.id,
          assignedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning steward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

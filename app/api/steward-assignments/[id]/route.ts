import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members, stewardAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPermission } from '@/lib/admin-permissions';

// DELETE - Remove a steward assignment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const assignmentId = parseInt(id);
    if (!assignmentId) {
      return NextResponse.json({ error: 'Invalid assignment ID' }, { status: 400 });
    }

    // Find the assignment to get its unionId
    const [assignment] = await db
      .select()
      .from(stewardAssignments)
      .where(eq(stewardAssignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check admin permissions
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, assignment.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || !hasPermission(membership.role, membership.adminPermissions, 'members')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await db
      .delete(stewardAssignments)
      .where(eq(stewardAssignments.id, assignmentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing steward assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

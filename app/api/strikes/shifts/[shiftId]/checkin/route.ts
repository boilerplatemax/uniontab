import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, picketShifts, picketAssignments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// Check-in endpoint
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ shiftId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId } = await context.params;
    const shiftIdNum = parseInt(shiftId);
    const { memberId } = await request.json();

    if (isNaN(shiftIdNum)) {
      return NextResponse.json({ error: 'Invalid shift ID' }, { status: 400 });
    }

    // Get shift with zone and strike info
    const shift = await db.query.picketShifts.findFirst({
      where: eq(picketShifts.id, shiftIdNum),
      with: {
        zone: {
          with: {
            strike: true
          }
        }
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Check if user is the member or an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, shift.zone.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const isAdmin = membership.role === 'admin' || membership.role === 'owner';
    const targetMemberId = memberId || membership.id;

    // Non-admins can only check in themselves
    if (!isAdmin && targetMemberId !== membership.id) {
      return NextResponse.json(
        { error: 'Only admins can check in other members' },
        { status: 403 }
      );
    }

    // Find the assignment
    const [assignment] = await db
      .select()
      .from(picketAssignments)
      .where(and(
        eq(picketAssignments.shiftId, shiftIdNum),
        eq(picketAssignments.memberId, targetMemberId)
      ))
      .limit(1);

    if (!assignment) {
      return NextResponse.json(
        { error: 'Member is not signed up for this shift' },
        { status: 400 }
      );
    }

    if (assignment.checkInTime) {
      return NextResponse.json(
        { error: 'Already checked in' },
        { status: 400 }
      );
    }

    // Update assignment with check-in time
    const [updatedAssignment] = await db
      .update(picketAssignments)
      .set({
        checkInTime: new Date(),
        status: 'checked_in',
        updatedAt: new Date(),
      })
      .where(eq(picketAssignments.id, assignment.id))
      .returning();

    return NextResponse.json({ success: true, assignment: updatedAssignment });
  } catch (error) {
    console.error('Error checking in:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

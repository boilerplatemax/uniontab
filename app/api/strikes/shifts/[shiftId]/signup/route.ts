import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, picketShifts, picketAssignments } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

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
        },
        assignments: true
      }
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Check membership
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

    // Check if already signed up
    const existingAssignment = shift.assignments.find(a => a.memberId === membership.id);
    if (existingAssignment) {
      return NextResponse.json(
        { error: 'You are already signed up for this shift' },
        { status: 400 }
      );
    }

    // Check capacity
    if (shift.assignments.length >= shift.maxMembers) {
      return NextResponse.json(
        { error: 'This shift is at full capacity' },
        { status: 400 }
      );
    }

    // Create assignment
    const [newAssignment] = await db
      .insert(picketAssignments)
      .values({
        shiftId: shiftIdNum,
        memberId: membership.id,
        status: 'signed_up',
      })
      .returning();

    return NextResponse.json({ success: true, assignment: newAssignment });
  } catch (error) {
    console.error('Error signing up for shift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check membership
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

    // Find and delete assignment
    const [existingAssignment] = await db
      .select()
      .from(picketAssignments)
      .where(and(
        eq(picketAssignments.shiftId, shiftIdNum),
        eq(picketAssignments.memberId, membership.id)
      ))
      .limit(1);

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'You are not signed up for this shift' },
        { status: 400 }
      );
    }

    // Cannot cancel if already checked in
    if (existingAssignment.checkInTime) {
      return NextResponse.json(
        { error: 'Cannot cancel after checking in' },
        { status: 400 }
      );
    }

    await db
      .delete(picketAssignments)
      .where(eq(picketAssignments.id, existingAssignment.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling signup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, picketZones, picketShifts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(
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

    const { date, startTime, endTime, maxMembers, notes } = await request.json();

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

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, shift.zone.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can update shifts' },
        { status: 403 }
      );
    }

    // Update the shift
    const [updatedShift] = await db
      .update(picketShifts)
      .set({
        date: date ? new Date(date) : shift.date,
        startTime: startTime ?? shift.startTime,
        endTime: endTime ?? shift.endTime,
        maxMembers: maxMembers ?? shift.maxMembers,
        notes: notes ?? shift.notes,
        updatedAt: new Date(),
      })
      .where(eq(picketShifts.id, shiftIdNum))
      .returning();

    return NextResponse.json({ success: true, shift: updatedShift });
  } catch (error) {
    console.error('Error updating shift:', error);
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

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, shift.zone.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can delete shifts' },
        { status: 403 }
      );
    }

    // Delete the shift
    await db.delete(picketShifts).where(eq(picketShifts.id, shiftIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

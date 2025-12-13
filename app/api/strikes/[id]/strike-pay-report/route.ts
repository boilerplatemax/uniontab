import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, picketZones, picketShifts, picketAssignments, users } from '@/lib/db/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface StrikePayRecord {
  memberId: number;
  memberName: string;
  memberEmail: string;
  totalShifts: number;
  completedShifts: number;
  totalHours: number;
  shifts: {
    shiftId: number;
    date: Date;
    zoneName: string;
    startTime: string;
    endTime: string;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    hoursWorked: number | null;
    status: string;
  }[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    // Get the strike
    const [strike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can view strike pay reports' },
        { status: 403 }
      );
    }

    // Get all zones for this strike
    const zones = await db.query.picketZones.findMany({
      where: eq(picketZones.strikeId, strikeId),
      with: {
        shifts: {
          with: {
            assignments: {
              with: {
                member: {
                  with: {
                    user: {
                      columns: { id: true, name: true, email: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Build strike pay records
    const memberRecords: Map<number, StrikePayRecord> = new Map();

    for (const zone of zones) {
      for (const shift of zone.shifts) {
        // Filter by date range if provided
        if (startDate && new Date(shift.date) < new Date(startDate)) continue;
        if (endDate && new Date(shift.date) > new Date(endDate)) continue;

        for (const assignment of shift.assignments) {
          const memberId = assignment.memberId;

          if (!memberRecords.has(memberId)) {
            memberRecords.set(memberId, {
              memberId,
              memberName: assignment.member.user.name,
              memberEmail: assignment.member.user.email,
              totalShifts: 0,
              completedShifts: 0,
              totalHours: 0,
              shifts: []
            });
          }

          const record = memberRecords.get(memberId)!;
          record.totalShifts++;

          // Calculate hours worked if both check-in and check-out exist
          let hoursWorked: number | null = null;
          if (assignment.checkInTime && assignment.checkOutTime) {
            const checkIn = new Date(assignment.checkInTime);
            const checkOut = new Date(assignment.checkOutTime);
            hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
            hoursWorked = Math.round(hoursWorked * 100) / 100; // Round to 2 decimal places
            record.totalHours += hoursWorked;
            record.completedShifts++;
          }

          record.shifts.push({
            shiftId: shift.id,
            date: shift.date,
            zoneName: zone.name,
            startTime: shift.startTime,
            endTime: shift.endTime,
            checkInTime: assignment.checkInTime,
            checkOutTime: assignment.checkOutTime,
            hoursWorked,
            status: assignment.status
          });
        }
      }
    }

    // Convert to array and sort by total hours descending
    const records = Array.from(memberRecords.values())
      .map(record => ({
        ...record,
        totalHours: Math.round(record.totalHours * 100) / 100
      }))
      .sort((a, b) => b.totalHours - a.totalHours);

    // Calculate summary stats
    const summary = {
      totalMembers: records.length,
      totalShiftsScheduled: records.reduce((sum, r) => sum + r.totalShifts, 0),
      totalShiftsCompleted: records.reduce((sum, r) => sum + r.completedShifts, 0),
      totalHours: Math.round(records.reduce((sum, r) => sum + r.totalHours, 0) * 100) / 100
    };

    return NextResponse.json({
      success: true,
      strike: {
        id: strike.id,
        title: strike.title,
        status: strike.status,
        startDate: strike.startDate,
        endDate: strike.endDate
      },
      summary,
      records
    });
  } catch (error) {
    console.error('Error generating strike pay report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

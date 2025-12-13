import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, picketZones, picketShifts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ zoneId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = await context.params;
    const zoneIdNum = parseInt(zoneId);

    if (isNaN(zoneIdNum)) {
      return NextResponse.json({ error: 'Invalid zone ID' }, { status: 400 });
    }

    // Get zone with strike info
    const zone = await db.query.picketZones.findFirst({
      where: eq(picketZones.id, zoneIdNum),
      with: {
        strike: true
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, zone.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get shifts with assignments
    const shifts = await db.query.picketShifts.findMany({
      where: eq(picketShifts.zoneId, zoneIdNum),
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
      },
      orderBy: [picketShifts.date, picketShifts.startTime]
    });

    return NextResponse.json({ success: true, shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ zoneId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { zoneId } = await context.params;
    const zoneIdNum = parseInt(zoneId);

    if (isNaN(zoneIdNum)) {
      return NextResponse.json({ error: 'Invalid zone ID' }, { status: 400 });
    }

    const { date, startTime, endTime, maxMembers, notes } = await request.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'date, startTime, and endTime are required' },
        { status: 400 }
      );
    }

    // Get zone with strike info
    const zone = await db.query.picketZones.findFirst({
      where: eq(picketZones.id, zoneIdNum),
      with: {
        strike: true
      }
    });

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, zone.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can create shifts' },
        { status: 403 }
      );
    }

    // Create the shift
    const [newShift] = await db
      .insert(picketShifts)
      .values({
        zoneId: zoneIdNum,
        date: new Date(date),
        startTime,
        endTime,
        maxMembers: maxMembers || 10,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, shift: newShift });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

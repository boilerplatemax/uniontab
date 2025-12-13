import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, picketZones } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(
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

    const { name, location, notes, isActive } = await request.json();

    // Get the zone with strike info
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
        { error: 'Only admins can update zones' },
        { status: 403 }
      );
    }

    // Update the zone
    const [updatedZone] = await db
      .update(picketZones)
      .set({
        name: name ?? zone.name,
        location: location ?? zone.location,
        notes: notes ?? zone.notes,
        isActive: isActive ?? zone.isActive,
        updatedAt: new Date(),
      })
      .where(eq(picketZones.id, zoneIdNum))
      .returning();

    return NextResponse.json({ success: true, zone: updatedZone });
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get the zone with strike info
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
        { error: 'Only admins can delete zones' },
        { status: 403 }
      );
    }

    // Delete the zone (cascade will handle shifts and assignments)
    await db.delete(picketZones).where(eq(picketZones.id, zoneIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

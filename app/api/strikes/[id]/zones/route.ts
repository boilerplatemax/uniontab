import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, picketZones } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

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

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    // Get the strike to check union
    const [strike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get zones with shifts
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
                      columns: { id: true, name: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, zones });
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    const { name, location, notes } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      );
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
        { error: 'Only admins can create zones' },
        { status: 403 }
      );
    }

    // Create the zone
    const [newZone] = await db
      .insert(picketZones)
      .values({
        strikeId,
        name,
        location: location || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, zone: newZone });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, strikeIncidents } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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

    // Get the strike
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

    // Get incidents
    const incidents = await db.query.strikeIncidents.findMany({
      where: eq(strikeIncidents.strikeId, strikeId),
      with: {
        member: {
          with: {
            user: {
              columns: { id: true, name: true }
            }
          }
        },
        zone: true,
        resolvedBy: {
          columns: { id: true, name: true }
        }
      },
      orderBy: [desc(strikeIncidents.createdAt)]
    });

    return NextResponse.json({ success: true, incidents });
  } catch (error) {
    console.error('Error fetching incidents:', error);
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

    const { description, severity, incidentType, zoneId, fileUrl, fileName, fileType } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'description is required' },
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

    // Create incident
    const [newIncident] = await db
      .insert(strikeIncidents)
      .values({
        strikeId,
        memberId: membership.id,
        description,
        severity: severity || 'medium',
        incidentType: incidentType || null,
        zoneId: zoneId || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        status: 'reported',
      })
      .returning();

    return NextResponse.json({ success: true, incident: newIncident });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

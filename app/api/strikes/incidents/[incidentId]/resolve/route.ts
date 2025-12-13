import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members, strikeIncidents } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ incidentId: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentId } = await context.params;
    const incidentIdNum = parseInt(incidentId);

    if (isNaN(incidentIdNum)) {
      return NextResponse.json({ error: 'Invalid incident ID' }, { status: 400 });
    }

    const { status, resolutionNotes } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      );
    }

    // Get incident with strike info
    const incident = await db.query.strikeIncidents.findFirst({
      where: eq(strikeIncidents.id, incidentIdNum),
      with: {
        strike: true
      }
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, incident.strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can resolve incidents' },
        { status: 403 }
      );
    }

    // Update incident
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    if (status === 'resolved') {
      updateData.resolvedBy = user.id;
      updateData.resolvedAt = new Date();
    }

    const [updatedIncident] = await db
      .update(strikeIncidents)
      .set(updateData)
      .where(eq(strikeIncidents.id, incidentIdNum))
      .returning();

    return NextResponse.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('Error resolving incident:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

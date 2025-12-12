import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const VALID_STATUSES = [
  'draft',
  'submitted',
  'assigned',
  'under_review',
  'awaiting_response',
  'resolved',
  'closed'
];

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const grievanceId = parseInt(id);

    if (!grievanceId) {
      return NextResponse.json(
        { error: 'Invalid grievance ID' },
        { status: 400 }
      );
    }

    const { status, resolutionNotes, resolutionOutcome } = await request.json();

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Get the grievance
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!grievance) {
      return NextResponse.json(
        { error: 'Grievance not found' },
        { status: 404 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, grievance.unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this union' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isGrievanceCreator = grievance.memberId === membership.id;

    // Only owner/admin can change status (except member can submit from draft)
    if (!isOwnerOrAdmin) {
      if (!(isGrievanceCreator && grievance.status === 'draft' && status === 'submitted')) {
        return NextResponse.json(
          { error: 'Only union owners and admins can change grievance status' },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    // Set resolved_at when status changes to resolved
    if (status === 'resolved' && grievance.status !== 'resolved') {
      updateData.resolvedAt = new Date();
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
      if (resolutionOutcome) {
        updateData.resolutionOutcome = resolutionOutcome;
      }
    }

    // Set closed_at when status changes to closed
    if (status === 'closed' && grievance.status !== 'closed') {
      updateData.closedAt = new Date();
    }

    // Update the grievance
    const [updatedGrievance] = await db
      .update(grievances)
      .set(updateData)
      .where(eq(grievances.id, grievanceId))
      .returning();

    return NextResponse.json({ success: true, grievance: updatedGrievance });
  } catch (error) {
    console.error('Error updating grievance status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

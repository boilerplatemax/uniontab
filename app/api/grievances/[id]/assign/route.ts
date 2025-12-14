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

export async function POST(request: Request, { params }: RouteParams) {
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

    const { assignedTo } = await request.json();

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

    // Check if user is a member of the union with owner/admin role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, grievance.unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can assign grievances' },
        { status: 403 }
      );
    }

    // If assignedTo is provided, verify that user exists and is an approved member
    if (assignedTo) {
      const [assigneeMembership] = await db
        .select()
        .from(members)
        .where(and(
          eq(members.unionId, grievance.unionId),
          eq(members.userId, assignedTo),
          eq(members.status, 'approved')
        ))
        .limit(1);

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: 'Assignee must be an approved member of the union' },
          { status: 400 }
        );
      }
    }

    // Update the grievance assignment and status
    const updateData: any = {
      assignedTo: assignedTo || null,
      assignedAt: assignedTo ? new Date() : null,
      updatedAt: new Date(),
      updatedBy: user.id,
    };

    // Update status to 'assigned' if assigning, keep current status if unassigning
    if (assignedTo && grievance.status === 'submitted') {
      updateData.status = 'assigned';
    } else if (!assignedTo && grievance.status === 'assigned') {
      updateData.status = 'submitted';
    }

    const [updatedGrievance] = await db
      .update(grievances)
      .set(updateData)
      .where(eq(grievances.id, grievanceId))
      .returning();

    // Fetch the full grievance with assignedTo user details
    const grievanceWithDetails = await db.query.grievances.findFirst({
      where: eq(grievances.id, grievanceId),
      with: {
        assignedTo: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, grievance: grievanceWithDetails || updatedGrievance });
  } catch (error) {
    console.error('Error assigning grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

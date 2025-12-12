import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getGrievanceById } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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

    // Get the grievance
    const grievance = await getGrievanceById(grievanceId, false);

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

    // Check permissions
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isGrievanceCreator = grievance.memberId === membership.id;

    if (!isOwnerOrAdmin && !isGrievanceCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to view this grievance' },
        { status: 403 }
      );
    }

    // If owner/admin, include internal notes
    const fullGrievance = isOwnerOrAdmin
      ? await getGrievanceById(grievanceId, true)
      : grievance;

    return NextResponse.json({ success: true, grievance: fullGrievance });
  } catch (error) {
    console.error('Error fetching grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { title, description, category, priority } = body;

    // Get the existing grievance
    const [existingGrievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!existingGrievance) {
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
        eq(members.unionId, existingGrievance.unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this union' },
        { status: 403 }
      );
    }

    // Check permissions - only creator can edit (and only if in draft/submitted status)
    const isGrievanceCreator = existingGrievance.memberId === membership.id;

    if (!isGrievanceCreator) {
      return NextResponse.json(
        { error: 'Only the grievance creator can edit it' },
        { status: 403 }
      );
    }

    // Only allow editing if in draft or submitted status
    if (!['draft', 'submitted'].includes(existingGrievance.status)) {
      return NextResponse.json(
        { error: 'Grievance cannot be edited once it has been assigned' },
        { status: 403 }
      );
    }

    // Update the grievance
    const [updatedGrievance] = await db
      .update(grievances)
      .set({
        title: title || existingGrievance.title,
        description: description || existingGrievance.description,
        category: category !== undefined ? category : existingGrievance.category,
        priority: priority || existingGrievance.priority,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(grievances.id, grievanceId))
      .returning();

    return NextResponse.json({ success: true, grievance: updatedGrievance });
  } catch (error) {
    console.error('Error updating grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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

    // Get the existing grievance
    const [existingGrievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, grievanceId))
      .limit(1);

    if (!existingGrievance) {
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
        eq(members.unionId, existingGrievance.unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this union' },
        { status: 403 }
      );
    }

    // Check permissions - only creator can delete (and only if in draft status)
    const isGrievanceCreator = existingGrievance.memberId === membership.id;

    if (!isGrievanceCreator) {
      return NextResponse.json(
        { error: 'Only the grievance creator can delete it' },
        { status: 403 }
      );
    }

    // Only allow deleting if in draft status
    if (existingGrievance.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft grievances can be deleted' },
        { status: 403 }
      );
    }

    // Delete the grievance (cascade will delete comments and attachments)
    await db.delete(grievances).where(eq(grievances.id, grievanceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

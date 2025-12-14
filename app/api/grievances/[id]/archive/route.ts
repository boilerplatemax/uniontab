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

    const { isArchived } = await request.json();

    if (typeof isArchived !== 'boolean') {
      return NextResponse.json(
        { error: 'isArchived must be a boolean' },
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
        { error: 'Only union owners and admins can archive grievances' },
        { status: 403 }
      );
    }

    // Update the grievance archive status
    const [updatedGrievance] = await db
      .update(grievances)
      .set({
        isArchived,
        archivedAt: isArchived ? new Date() : null,
        archivedBy: isArchived ? user.id : null,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(grievances.id, grievanceId))
      .returning();

    return NextResponse.json({
      success: true,
      grievance: updatedGrievance,
      message: isArchived ? 'Grievance archived successfully' : 'Grievance unarchived successfully'
    });
  } catch (error) {
    console.error('Error archiving grievance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

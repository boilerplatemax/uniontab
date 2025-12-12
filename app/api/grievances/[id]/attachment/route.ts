import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievances, members, grievanceAttachments } from '@/lib/db/schema';
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

    const { fileName, fileUrl, fileType, fileSize } = await request.json();

    if (!fileName || !fileUrl || !fileType || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required file information' },
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

    // Check permissions
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isGrievanceCreator = grievance.memberId === membership.id;

    if (!isOwnerOrAdmin && !isGrievanceCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to add attachments to this grievance' },
        { status: 403 }
      );
    }

    // Create the attachment
    const [newAttachment] = await db
      .insert(grievanceAttachments)
      .values({
        grievanceId,
        fileName,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy: user.id,
      })
      .returning();

    // Update grievance's updatedAt timestamp
    await db
      .update(grievances)
      .set({ updatedAt: new Date() })
      .where(eq(grievances.id, grievanceId));

    return NextResponse.json({ success: true, attachment: newAttachment });
  } catch (error) {
    console.error('Error adding attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

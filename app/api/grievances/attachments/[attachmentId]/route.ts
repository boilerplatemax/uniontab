import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievanceAttachments, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{
    attachmentId: string;
  }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attachmentId } = await params;
    const attachmentIdNum = parseInt(attachmentId);

    if (!attachmentIdNum) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    // Get the attachment with grievance info
    const [attachmentData] = await db.query.grievanceAttachments.findMany({
      where: eq(grievanceAttachments.id, attachmentIdNum),
      with: {
        grievance: true
      },
      limit: 1
    });

    if (!attachmentData) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete (must be the uploader, grievance owner, or an admin)
    const canDelete = attachmentData.uploadedBy === user.id;

    if (!canDelete) {
      // Check if user is the grievance creator or an admin
      const [membership] = await db
        .select()
        .from(members)
        .where(and(
          eq(members.unionId, attachmentData.grievance.unionId),
          eq(members.userId, user.id)
        ))
        .limit(1);

      const isOwnerOrAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');
      const isGrievanceCreator = membership && attachmentData.grievance.memberId === membership.id;

      if (!isOwnerOrAdmin && !isGrievanceCreator) {
        return NextResponse.json(
          { error: 'You do not have permission to delete this attachment' },
          { status: 403 }
        );
      }
    }

    // Delete the attachment
    await db
      .delete(grievanceAttachments)
      .where(eq(grievanceAttachments.id, attachmentIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

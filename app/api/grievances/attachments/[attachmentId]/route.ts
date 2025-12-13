import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievanceAttachments, grievances, members } from '@/lib/db/schema';
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
    const attachmentIdInt = parseInt(attachmentId);

    if (!attachmentIdInt) {
      return NextResponse.json(
        { error: 'Invalid attachment ID' },
        { status: 400 }
      );
    }

    // Get the attachment
    const [attachment] = await db
      .select()
      .from(grievanceAttachments)
      .where(eq(grievanceAttachments.id, attachmentIdInt))
      .limit(1);

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Get the grievance
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, attachment.grievanceId))
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

    if (!membership || membership.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only union members can delete attachments' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const isGrievanceCreator = grievance.memberId === membership.id;

    // Only the grievance creator (in draft/submitted status) or admins can delete attachments
    if (!isOwnerOrAdmin && !isGrievanceCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this attachment' },
        { status: 403 }
      );
    }

    if (isGrievanceCreator && !['draft', 'submitted'].includes(grievance.status)) {
      return NextResponse.json(
        { error: 'Cannot delete attachments after grievance has been assigned' },
        { status: 403 }
      );
    }

    // Delete the attachment
    await db
      .delete(grievanceAttachments)
      .where(eq(grievanceAttachments.id, attachmentIdInt));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

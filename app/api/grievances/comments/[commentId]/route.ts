import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievanceComments, grievances, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{
    commentId: string;
  }>;
}

// Update comment
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const commentIdInt = parseInt(commentId);

    if (!commentIdInt) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const { comment, isInternal } = await request.json();

    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Get the comment
    const [existingComment] = await db
      .select()
      .from(grievanceComments)
      .where(eq(grievanceComments.id, commentIdInt))
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get the grievance to check union membership
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, existingComment.grievanceId))
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
        { error: 'Only union members can edit comments' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    // Only the comment creator or admins can edit
    if (existingComment.createdBy !== user.id && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Update the comment
    const [updatedComment] = await db
      .update(grievanceComments)
      .set({
        comment: comment.trim(),
        isInternal: isOwnerOrAdmin && isInternal !== undefined ? isInternal : existingComment.isInternal,
      })
      .where(eq(grievanceComments.id, commentIdInt))
      .returning();

    return NextResponse.json({ success: true, comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete comment
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const commentIdInt = parseInt(commentId);

    if (!commentIdInt) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Get the comment
    const [existingComment] = await db
      .select()
      .from(grievanceComments)
      .where(eq(grievanceComments.id, commentIdInt))
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get the grievance to check union membership
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.id, existingComment.grievanceId))
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
        { error: 'Only union members can delete comments' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    // Only the comment creator or admins can delete
    if (existingComment.createdBy !== user.id && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete the comment
    await db
      .delete(grievanceComments)
      .where(eq(grievanceComments.id, commentIdInt));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

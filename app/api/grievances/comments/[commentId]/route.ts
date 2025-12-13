import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { grievanceComments, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{
    commentId: string;
  }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId } = await params;
    const commentIdNum = parseInt(commentId);

    if (!commentIdNum) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const { comment } = await request.json();

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Get the existing comment with grievance info
    const [existingComment] = await db
      .select({
        comment: grievanceComments,
      })
      .from(grievanceComments)
      .where(eq(grievanceComments.id, commentIdNum))
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit (must be the comment creator or an admin)
    const canEdit = existingComment.comment.createdBy === user.id;

    if (!canEdit) {
      // Check if user is an admin/owner of the union
      const [grievanceData] = await db.query.grievanceComments.findMany({
        where: eq(grievanceComments.id, commentIdNum),
        with: {
          grievance: true
        },
        limit: 1
      });

      if (grievanceData) {
        const [membership] = await db
          .select()
          .from(members)
          .where(and(
            eq(members.unionId, grievanceData.grievance.unionId),
            eq(members.userId, user.id)
          ))
          .limit(1);

        const isOwnerOrAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

        if (!isOwnerOrAdmin) {
          return NextResponse.json(
            { error: 'You do not have permission to edit this comment' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'You do not have permission to edit this comment' },
          { status: 403 }
        );
      }
    }

    // Update the comment
    const [updatedComment] = await db
      .update(grievanceComments)
      .set({
        comment,
        updatedAt: new Date(),
      })
      .where(eq(grievanceComments.id, commentIdNum))
      .returning();

    // Fetch the updated comment with creator info
    const [commentWithCreator] = await db.query.grievanceComments.findMany({
      where: eq(grievanceComments.id, commentIdNum),
      with: {
        createdBy: {
          columns: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      limit: 1
    });

    return NextResponse.json({ success: true, comment: commentWithCreator });
  } catch (error) {
    console.error('Error updating comment:', error);
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

    const { commentId } = await params;
    const commentIdNum = parseInt(commentId);

    if (!commentIdNum) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Get the existing comment
    const [existingComment] = await db
      .select({
        comment: grievanceComments,
      })
      .from(grievanceComments)
      .where(eq(grievanceComments.id, commentIdNum))
      .limit(1);

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete (must be the comment creator or an admin)
    const canDelete = existingComment.comment.createdBy === user.id;

    if (!canDelete) {
      // Check if user is an admin/owner of the union
      const [grievanceData] = await db.query.grievanceComments.findMany({
        where: eq(grievanceComments.id, commentIdNum),
        with: {
          grievance: true
        },
        limit: 1
      });

      if (grievanceData) {
        const [membership] = await db
          .select()
          .from(members)
          .where(and(
            eq(members.unionId, grievanceData.grievance.unionId),
            eq(members.userId, user.id)
          ))
          .limit(1);

        const isOwnerOrAdmin = membership && (membership.role === 'owner' || membership.role === 'admin');

        if (!isOwnerOrAdmin) {
          return NextResponse.json(
            { error: 'You do not have permission to delete this comment' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'You do not have permission to delete this comment' },
          { status: 403 }
        );
      }
    }

    // Delete the comment
    await db
      .delete(grievanceComments)
      .where(eq(grievanceComments.id, commentIdNum));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { posts, postComments, members, unions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const editCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be 2000 characters or less'),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = editCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Fetch the comment
    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment || comment.deletedAt) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Only the comment author can edit
    if (comment.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    // Get post to check union
    const [post] = await db
      .select({ unionId: posts.unionId })
      .from(posts)
      .where(eq(posts.id, comment.postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify user is a member of this union
    const [membership] = await db
      .select({ status: members.status })
      .from(members)
      .where(and(eq(members.unionId, post.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.status !== 'approved')) {
      return NextResponse.json({ error: 'Not an approved member' }, { status: 403 });
    }

    // Check demo mode
    const [union] = await db
      .select({ isDemo: unions.isDemo })
      .from(unions)
      .where(eq(unions.id, post.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json(
        { error: 'Mutations are disabled in demo mode' },
        { status: 403 }
      );
    }

    // Update the comment
    const [updated] = await db
      .update(postComments)
      .set({
        content,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(postComments.id, commentId))
      .returning();

    return NextResponse.json({
      comment: {
        id: updated.id,
        postId: updated.postId,
        userId: updated.userId,
        content: updated.content,
        isEdited: updated.isEdited,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        isDeleted: false,
      },
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr, 10);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    // Fetch the comment
    const [comment] = await db
      .select()
      .from(postComments)
      .where(eq(postComments.id, commentId))
      .limit(1);

    if (!comment || comment.deletedAt) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Get post to check union
    const [post] = await db
      .select({ unionId: posts.unionId })
      .from(posts)
      .where(eq(posts.id, comment.postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check demo mode
    const [union] = await db
      .select({ isDemo: unions.isDemo })
      .from(unions)
      .where(eq(unions.id, post.unionId))
      .limit(1);

    if (union?.isDemo) {
      return NextResponse.json(
        { error: 'Mutations are disabled in demo mode' },
        { status: 403 }
      );
    }

    // Authorization: own comment OR admin/owner
    const isOwnComment = comment.userId === user.id;

    if (!isOwnComment) {
      const [membership] = await db
        .select({ role: members.role })
        .from(members)
        .where(
          and(eq(members.unionId, post.unionId), eq(members.userId, user.id))
        )
        .limit(1);

      const isAdminOrOwner =
        membership?.role === 'owner' || membership?.role === 'admin';
      if (!isAdminOrOwner) {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }
    }

    // Soft-delete
    await db
      .update(postComments)
      .set({ deletedAt: new Date() })
      .where(eq(postComments.id, commentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

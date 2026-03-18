import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { posts, members, postAttachments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

interface PostAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Get the post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, post.unionId),
          eq(members.userId, user.id),
          eq(members.role, 'owner')
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized - Only union owners can edit posts' }, { status: 403 });
    }

    // Update the post
    const body = await request.json();
    const { title, content, imageUrl, isPrivate, commentsEnabled, authorType, attachments } = body;

    await db
      .update(posts)
      .set({
        title,
        content,
        imageUrl,
        isPrivate,
        commentsEnabled: commentsEnabled ?? true,
        authorType: authorType || 'union',
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(posts.id, postId));

    // Update attachments if provided
    if (attachments !== undefined) {
      // Delete all existing attachments
      await db
        .delete(postAttachments)
        .where(eq(postAttachments.postId, postId));

      // Insert new attachments
      if (Array.isArray(attachments) && attachments.length > 0) {
        await db.insert(postAttachments).values(
          attachments.map((attachment: PostAttachment) => ({
            postId: postId,
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

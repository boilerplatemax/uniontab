import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { posts, members, postAttachments, postLikes, postComments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Missing post ID' },
        { status: 400 }
      );
    }

    // Get the post to check ownership
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Owners and admins can delete posts (matches the create-post permissions)
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, post.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can delete posts' },
        { status: 403 }
      );
    }

    // Defensively delete related rows before the post itself. The schema declares
    // ON DELETE CASCADE for these FKs, but some production databases were created
    // before the cascade was added and still hold the old NO ACTION constraint,
    // which makes `DELETE FROM posts` fail with a foreign key violation. Each
    // delete is best-effort so that a missing table (e.g. post_comments on an
    // older database) does not block the post deletion.
    const tryDelete = async (label: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err) {
        console.warn(`Skipped cleanup for ${label} while deleting post ${postId}:`, err);
      }
    };
    await tryDelete('post_comments', () =>
      db.delete(postComments).where(eq(postComments.postId, postId))
    );
    await tryDelete('post_likes', () =>
      db.delete(postLikes).where(eq(postLikes.postId, postId))
    );
    await tryDelete('post_attachments', () =>
      db.delete(postAttachments).where(eq(postAttachments.postId, postId))
    );

    await db.delete(posts).where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

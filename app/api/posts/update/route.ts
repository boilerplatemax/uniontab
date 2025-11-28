import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { posts, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, title, content, imageUrl, isPrivate } = await request.json();

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

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, post.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can update posts' },
        { status: 403 }
      );
    }

    // Update the post
    const [updatedPost] = await db
      .update(posts)
      .set({
        title: title !== undefined ? title : post.title,
        content: content !== undefined ? content : post.content,
        imageUrl: imageUrl !== undefined ? imageUrl : post.imageUrl,
        isPrivate: isPrivate !== undefined ? isPrivate : post.isPrivate,
        updatedBy: user.id,
      })
      .where(eq(posts.id, postId))
      .returning();

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

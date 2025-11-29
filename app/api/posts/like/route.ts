import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { postLikes } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check if user has already liked the post
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)))
      .limit(1);

    let isLiked: boolean;

    if (existingLike) {
      // Unlike - delete the like
      await db
        .delete(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)));
      isLiked = false;
    } else {
      // Like - insert a new like
      await db.insert(postLikes).values({
        postId,
        userId: user.id,
      });
      isLiked = true;
    }

    // Get updated like count
    const [{ value: likeCount }] = await db
      .select({ value: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    return NextResponse.json({
      success: true,
      isLiked,
      likeCount: Number(likeCount),
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { posts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

const TogglePinSchema = z.object({
  postId: z.number(),
  isPinned: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, isPinned } = TogglePinSchema.parse(body);

    // Verify user is owner
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Update the post
    await db
      .update(posts)
      .set({ isPinned, updatedAt: new Date() })
      .where(eq(posts.id, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling post pin:', error);
    return NextResponse.json(
      { error: 'Failed to toggle post pin' },
      { status: 500 }
    );
  }
}

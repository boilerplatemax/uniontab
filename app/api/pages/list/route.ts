import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unionPages, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's union where they are owner
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.role, 'owner')
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const pages = await db
      .select({
        id: unionPages.id,
        title: unionPages.title,
        slug: unionPages.slug,
        isPublished: unionPages.isPublished,
      })
      .from(unionPages)
      .where(eq(unionPages.unionId, membership.unionId))
      .orderBy(unionPages.title);

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

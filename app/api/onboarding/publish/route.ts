import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userWithUnion = await getUserWithTeam(user.id);
    if (!userWithUnion?.unionId) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    // Set publishedAt to make the site public
    await db
      .update(unions)
      .set({
        publishedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(unions.id, userWithUnion.unionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error publishing union:', error);
    return NextResponse.json(
      { error: 'Failed to publish site' },
      { status: 500 }
    );
  }
}

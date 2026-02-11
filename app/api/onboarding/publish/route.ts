import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { seedDefaultNavigation } from '@/lib/db/seed-navigation';

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

    // Check if user is an owner - only owners can publish the site
    const [membership] = await db
      .select()
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Forbidden: Only union owners can publish the site' },
        { status: 403 }
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

    // Seed default navigation items (non-blocking)
    seedDefaultNavigation(userWithUnion.unionId)
      .then(() => {
        console.log(`✅ Navigation seeded for union ${userWithUnion.unionId}`);
      })
      .catch((error) => {
        console.error(`❌ Navigation seed failed for union ${userWithUnion.unionId}:`, error);
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error publishing union:', error);
    return NextResponse.json(
      { error: 'Failed to publish site' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  unions,
  members,
  posts,
  events,
  files,
  unionPages,
  activityLogs,
  users
} from '@/lib/db/schema';
import { eq, count, desc, sql } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    // Verify user is webmaster
    const sessionCookie = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie);

    // Get user to check role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all unions with stats
    const allUnions = await db
      .select({
        id: unions.id,
        name: unions.name,
        slug: unions.slug,
        publicName: unions.publicName,
        email: unions.email,
        createdAt: unions.createdAt,
        updatedAt: unions.updatedAt,
        publishedAt: unions.publishedAt,
        subscriptionStatus: unions.subscriptionStatus,
        planName: unions.planName,
      })
      .from(unions)
      .orderBy(desc(unions.createdAt));

    // Get stats for each union
    const unionsWithStats = await Promise.all(
      allUnions.map(async (union) => {
        // Get member count
        const [memberCountResult] = await db
          .select({ count: count() })
          .from(members)
          .where(eq(members.unionId, union.id));

        // Get activity count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [activityCountResult] = await db
          .select({ count: count() })
          .from(activityLogs)
          .where(eq(activityLogs.unionId, union.id));

        // Get content counts for onboarding completion
        const [postsCount] = await db
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.unionId, union.id));

        const [eventsCount] = await db
          .select({ count: count() })
          .from(events)
          .where(eq(events.unionId, union.id));

        const [filesCount] = await db
          .select({ count: count() })
          .from(files)
          .where(eq(files.unionId, union.id));

        const [pagesCount] = await db
          .select({ count: count() })
          .from(unionPages)
          .where(eq(unionPages.unionId, union.id));

        // Calculate onboarding completion percentage
        const onboardingSteps = [
          union.publicName ? 1 : 0,
          union.publishedAt ? 1 : 0,
          postsCount.count > 0 ? 1 : 0,
          eventsCount.count > 0 ? 1 : 0,
          filesCount.count > 0 ? 1 : 0,
          pagesCount.count > 0 ? 1 : 0,
        ];
        const onboardingCompletion = Math.round(
          (onboardingSteps.filter(Boolean).length / onboardingSteps.length) * 100
        );

        // Get last activity date
        const [lastActivity] = await db
          .select({ timestamp: activityLogs.timestamp })
          .from(activityLogs)
          .where(eq(activityLogs.unionId, union.id))
          .orderBy(desc(activityLogs.timestamp))
          .limit(1);

        return {
          ...union,
          memberCount: memberCountResult.count,
          activityCount: activityCountResult.count,
          postsCount: postsCount.count,
          eventsCount: eventsCount.count,
          filesCount: filesCount.count,
          pagesCount: pagesCount.count,
          onboardingCompletion,
          lastActivityAt: lastActivity?.timestamp,
        };
      })
    );

    return NextResponse.json({ unions: unionsWithStats });
  } catch (error) {
    console.error('Error fetching unions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unions' },
      { status: 500 }
    );
  }
}

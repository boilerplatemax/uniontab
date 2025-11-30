import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { dismissedAnnouncements } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { announcementId } = await request.json();

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Missing announcement ID' },
        { status: 400 }
      );
    }

    // Check if already dismissed
    const [existing] = await db
      .select()
      .from(dismissedAnnouncements)
      .where(
        and(
          eq(dismissedAnnouncements.announcementId, announcementId),
          eq(dismissedAnnouncements.userId, user.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already dismissed' });
    }

    // Create dismissal record
    await db.insert(dismissedAnnouncements).values({
      announcementId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

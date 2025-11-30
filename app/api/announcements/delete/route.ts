import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { announcements, members } from '@/lib/db/schema';
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

    // Get the announcement to check ownership
    const [announcement] = await db
      .select()
      .from(announcements)
      .where(eq(announcements.id, announcementId))
      .limit(1);

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, announcement.unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can delete announcements' },
        { status: 403 }
      );
    }

    // Delete the announcement (attachments and dismissals will cascade)
    await db.delete(announcements).where(eq(announcements.id, announcementId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

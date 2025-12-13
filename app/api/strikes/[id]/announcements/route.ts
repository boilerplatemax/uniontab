import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, strikeAnnouncements } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    // Get the strike
    const [strike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check membership
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get announcements
    const announcements = await db.query.strikeAnnouncements.findMany({
      where: eq(strikeAnnouncements.strikeId, strikeId),
      with: {
        createdBy: {
          columns: { id: true, name: true }
        }
      },
      orderBy: [desc(strikeAnnouncements.createdAt)]
    });

    return NextResponse.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const strikeId = parseInt(id);

    if (isNaN(strikeId)) {
      return NextResponse.json({ error: 'Invalid strike ID' }, { status: 400 });
    }

    const { title, message, sendMethod, isUrgent } = await request.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title and message are required' },
        { status: 400 }
      );
    }

    // Get the strike
    const [strike] = await db
      .select()
      .from(strikes)
      .where(eq(strikes.id, strikeId))
      .limit(1);

    if (!strike) {
      return NextResponse.json({ error: 'Strike not found' }, { status: 404 });
    }

    // Check if user is an admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, strike.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can create announcements' },
        { status: 403 }
      );
    }

    // Create announcement
    const [newAnnouncement] = await db
      .insert(strikeAnnouncements)
      .values({
        strikeId,
        title,
        message,
        sendMethod: sendMethod || 'in_app',
        isUrgent: isUrgent || false,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, announcement: newAnnouncement });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { events, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      title,
      description,
      location,
      mediaUrl,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      isPrivate,
      category,
    } = body;

    if (!eventId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the event to check ownership
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, event.unionId),
          eq(members.role, 'owner')
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Only union owners can update events' },
        { status: 403 }
      );
    }

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({
        title,
        description: description || null,
        location: location || null,
        mediaUrl: mediaUrl || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime: startTime || null,
        endTime: endTime || null,
        isAllDay: isAllDay || false,
        isPrivate: isPrivate || false,
        category: category || null,
      })
      .where(eq(events.id, eventId))
      .returning();

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

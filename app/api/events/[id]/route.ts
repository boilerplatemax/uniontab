import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { events, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
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
        { error: 'Only union owners can edit events' },
        { status: 403 }
      );
    }

    // Update the event
    const [updatedEvent] = await db
      .update(events)
      .set({
        title: title || event.title,
        description: description !== undefined ? description : event.description,
        location: location !== undefined ? location : event.location,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : event.mediaUrl,
        startDate: startDate ? new Date(startDate) : event.startDate,
        endDate: endDate ? new Date(endDate) : event.endDate,
        startTime: startTime !== undefined ? startTime : event.startTime,
        endTime: endTime !== undefined ? endTime : event.endTime,
        isAllDay: isAllDay !== undefined ? isAllDay : event.isAllDay,
        isPrivate: isPrivate !== undefined ? isPrivate : event.isPrivate,
        category: category !== undefined ? category : event.category,
        updatedAt: new Date(),
        updatedBy: user.id,
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

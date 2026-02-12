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
      unionId,
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

    if (!unionId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.userId, user.id),
          eq(members.unionId, unionId),
        )
      )
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can create events' },
        { status: 403 }
      );
    }

    // Create the event
    const [newEvent] = await db
      .insert(events)
      .values({
        unionId,
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
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

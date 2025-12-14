import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { createZoomMeeting, isZoomConfigured } from '@/lib/zoom/zoom-api';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Zoom is configured
    if (!isZoomConfigured()) {
      return NextResponse.json(
        { error: 'Zoom integration is not configured. Please contact your administrator.' },
        { status: 503 }
      );
    }

    const {
      unionId,
      title,
      agenda,
      scheduledDate,
      startTime,
      endTime,
      timezone,
    } = await request.json();

    if (!unionId || !title || !scheduledDate || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: unionId, title, scheduledDate, startTime' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member to create a Zoom meeting' },
        { status: 403 }
      );
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can create Zoom meetings' },
        { status: 403 }
      );
    }

    // Parse the scheduled date and start time
    const meetingDate = new Date(scheduledDate);
    const [hours, minutes] = startTime.split(':').map(Number);
    meetingDate.setHours(hours, minutes, 0, 0);

    // Calculate duration in minutes (default to 60 if no end time)
    let duration = 60;
    if (endTime) {
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutesTotal = endHours * 60 + endMinutes;
      duration = endMinutesTotal - startMinutes;
      if (duration <= 0) duration = 60; // Fallback if times are invalid
    }

    // Create the Zoom meeting
    const zoomMeeting = await createZoomMeeting({
      topic: title,
      startTime: meetingDate,
      duration,
      timezone: timezone || 'America/New_York',
      agenda: agenda || undefined,
    });

    return NextResponse.json({
      success: true,
      zoomMeeting: {
        id: zoomMeeting.id,
        joinUrl: zoomMeeting.join_url,
        startUrl: zoomMeeting.start_url,
        password: zoomMeeting.password,
        topic: zoomMeeting.topic,
        startTime: zoomMeeting.start_time,
        duration: zoomMeeting.duration,
        timezone: zoomMeeting.timezone,
      },
    });
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

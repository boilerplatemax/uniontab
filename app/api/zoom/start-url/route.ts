import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { getZoomMeeting, isZoomConfigured } from '@/lib/zoom/zoom-api';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isZoomConfigured()) {
      return NextResponse.json(
        { error: 'Zoom integration is not configured.' },
        { status: 503 }
      );
    }

    const { meetingId } = await request.json();

    if (!meetingId) {
      return NextResponse.json(
        { error: 'Missing required field: meetingId' },
        { status: 400 }
      );
    }

    // Get the meeting to verify access
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, meeting.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can get the host link' },
        { status: 403 }
      );
    }

    if (!meeting.meetingId) {
      return NextResponse.json(
        { error: 'This meeting does not have a Zoom meeting ID' },
        { status: 400 }
      );
    }

    // Fetch fresh meeting details from Zoom to get the start_url
    const zoomMeeting = await getZoomMeeting(meeting.meetingId);

    return NextResponse.json({
      success: true,
      startUrl: zoomMeeting.start_url,
    });
  } catch (error) {
    console.error('Error fetching Zoom start URL:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

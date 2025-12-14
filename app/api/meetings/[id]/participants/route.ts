import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, members, meetingParticipants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// GET - Get meeting participants
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    const { id } = await params;
    const meetingId = parseInt(id);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isNaN(meetingId)) {
      return NextResponse.json({ error: 'Invalid meeting ID' }, { status: 400 });
    }

    // Get meeting
    const [meeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is owner or admin
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
        { error: 'Only owners and admins can view participants' },
        { status: 403 }
      );
    }

    // Get participants
    const participants = await db
      .select({
        id: meetingParticipants.id,
        meetingId: meetingParticipants.meetingId,
        memberId: meetingParticipants.memberId,
        createdAt: meetingParticipants.createdAt,
      })
      .from(meetingParticipants)
      .where(eq(meetingParticipants.meetingId, meetingId));

    return NextResponse.json({ success: true, participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

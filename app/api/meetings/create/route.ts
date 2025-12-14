import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      unionId,
      title,
      description,
      agenda,
      scheduledDate,
      startTime,
      endTime,
      timezone,
      platform,
      meetingLink,
      meetingId,
      meetingPassword,
      isPrivate,
      status,
    } = await request.json();

    if (!unionId || !title || !scheduledDate || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'You must be an approved member to create a meeting' },
        { status: 403 }
      );
    }

    if (membership.role !== 'owner' && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can create meetings' },
        { status: 403 }
      );
    }

    // Create the meeting
    const [newMeeting] = await db
      .insert(meetings)
      .values({
        unionId,
        title,
        description: description || null,
        agenda: agenda || null,
        scheduledDate: new Date(scheduledDate),
        startTime,
        endTime: endTime || null,
        timezone: timezone || 'America/New_York',
        platform: platform || 'zoom',
        meetingLink: meetingLink || null,
        meetingId: meetingId || null,
        meetingPassword: meetingPassword || null,
        isPrivate: isPrivate !== false,
        status: status || 'scheduled',
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, meeting: newMeeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, members, users, meetingInvites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// GET - Get meeting details
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

    // Get meeting with creator info
    const [meeting] = await db
      .select({
        id: meetings.id,
        unionId: meetings.unionId,
        title: meetings.title,
        description: meetings.description,
        agenda: meetings.agenda,
        scheduledDate: meetings.scheduledDate,
        startTime: meetings.startTime,
        endTime: meetings.endTime,
        timezone: meetings.timezone,
        platform: meetings.platform,
        meetingLink: meetings.meetingLink,
        meetingId: meetings.meetingId,
        meetingPassword: meetings.meetingPassword,
        status: meetings.status,
        isPrivate: meetings.isPrivate,
        createdAt: meetings.createdAt,
        updatedAt: meetings.updatedAt,
        createdBy: {
          id: users.id,
          name: users.name,
        },
      })
      .from(meetings)
      .leftJoin(users, eq(meetings.createdBy, users.id))
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, meeting.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member of this union' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    // Get invite count for admins
    let inviteCount = 0;
    if (isOwnerOrAdmin) {
      const invites = await db
        .select()
        .from(meetingInvites)
        .where(eq(meetingInvites.meetingId, meetingId));
      inviteCount = invites.length;
    }

    return NextResponse.json({
      success: true,
      meeting,
      isOwnerOrAdmin,
      inviteCount,
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update meeting
export async function PUT(
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

    const body = await request.json();

    // Get existing meeting
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, existingMeeting.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can update meetings' },
        { status: 403 }
      );
    }

    // Update meeting
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        title: body.title ?? existingMeeting.title,
        description: body.description ?? existingMeeting.description,
        agenda: body.agenda ?? existingMeeting.agenda,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : existingMeeting.scheduledDate,
        startTime: body.startTime ?? existingMeeting.startTime,
        endTime: body.endTime ?? existingMeeting.endTime,
        timezone: body.timezone ?? existingMeeting.timezone,
        platform: body.platform ?? existingMeeting.platform,
        meetingLink: body.meetingLink ?? existingMeeting.meetingLink,
        meetingId: body.meetingId ?? existingMeeting.meetingId,
        meetingPassword: body.meetingPassword ?? existingMeeting.meetingPassword,
        isPrivate: body.isPrivate ?? existingMeeting.isPrivate,
        status: body.status ?? existingMeeting.status,
        updatedAt: new Date(),
        updatedBy: user.id,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete meeting
export async function DELETE(
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

    // Get existing meeting
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId))
      .limit(1);

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, existingMeeting.unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can delete meetings' },
        { status: 403 }
      );
    }

    // Delete meeting (cascade will handle invites)
    await db.delete(meetings).where(eq(meetings.id, meetingId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

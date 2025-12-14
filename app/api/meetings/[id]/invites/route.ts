import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { meetings, members, users, meetingInvites, unions, meetingParticipants } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { sendMeetingInviteEmail } from '@/lib/email/sendgrid';

// GET - Get all invites for a meeting
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
        { error: 'Only owners and admins can view meeting invites' },
        { status: 403 }
      );
    }

    // Get invites with member and user info
    const invites = await db
      .select({
        id: meetingInvites.id,
        meetingId: meetingInvites.meetingId,
        memberId: meetingInvites.memberId,
        status: meetingInvites.status,
        sentAt: meetingInvites.sentAt,
        respondedAt: meetingInvites.respondedAt,
        createdAt: meetingInvites.createdAt,
        member: {
          id: members.id,
          userId: members.userId,
          role: members.role,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(meetingInvites)
      .innerJoin(members, eq(meetingInvites.memberId, members.id))
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(meetingInvites.meetingId, meetingId));

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    console.error('Error fetching meeting invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Send invites to members
export async function POST(
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

    const { memberIds, recipientFilter } = await request.json();

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
        { error: 'Only owners and admins can send meeting invites' },
        { status: 403 }
      );
    }

    // Get union info
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, meeting.unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Determine which members to invite based on participantMode
    let targetMemberIds: number[] = [];

    // Check if meeting has selected participants mode
    if (meeting.participantMode === 'selected') {
      // Get selected participants from meetingParticipants table
      const participants = await db
        .select({ memberId: meetingParticipants.memberId })
        .from(meetingParticipants)
        .where(eq(meetingParticipants.meetingId, meetingId));

      targetMemberIds = participants.map(p => p.memberId);

      if (targetMemberIds.length === 0) {
        return NextResponse.json(
          { error: 'No participants have been selected for this meeting' },
          { status: 400 }
        );
      }
    } else if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      // Specific members selected from the dialog
      targetMemberIds = memberIds;
    } else if (recipientFilter === 'all' || recipientFilter === 'approved') {
      // All approved members
      const allMembers = await db
        .select({ id: members.id })
        .from(members)
        .where(and(
          eq(members.unionId, meeting.unionId),
          eq(members.status, 'approved')
        ));
      targetMemberIds = allMembers.map(m => m.id);
    } else {
      return NextResponse.json(
        { error: 'No recipients specified' },
        { status: 400 }
      );
    }

    if (targetMemberIds.length === 0) {
      return NextResponse.json(
        { error: 'No members to invite' },
        { status: 400 }
      );
    }

    // Get existing invites to avoid duplicates
    const existingInvites = await db
      .select({ memberId: meetingInvites.memberId })
      .from(meetingInvites)
      .where(and(
        eq(meetingInvites.meetingId, meetingId),
        inArray(meetingInvites.memberId, targetMemberIds)
      ));

    const existingMemberIds = new Set(existingInvites.map(i => i.memberId));
    const newMemberIds = targetMemberIds.filter(id => !existingMemberIds.has(id));

    if (newMemberIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected members have already been invited' },
        { status: 400 }
      );
    }

    // Create invite records
    const inviteRecords = newMemberIds.map(memberId => ({
      meetingId,
      memberId,
      status: 'sent' as const,
      sentAt: new Date(),
    }));

    await db.insert(meetingInvites).values(inviteRecords);

    // Get member details for sending emails
    const membersToInvite = await db
      .select({
        memberId: members.id,
        userName: users.name,
        userEmail: users.email,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(inArray(members.id, newMemberIds));

    // Send email invites
    let successCount = 0;
    let failureCount = 0;

    for (const member of membersToInvite) {
      try {
        await sendMeetingInviteEmail({
          to: member.userEmail,
          memberName: member.userName,
          meeting: {
            title: meeting.title,
            description: meeting.description,
            scheduledDate: meeting.scheduledDate,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            timezone: meeting.timezone,
            platform: meeting.platform,
            meetingLink: meeting.meetingLink,
            meetingPassword: meeting.meetingPassword,
          },
          unionInfo: {
            id: union.id,
            name: union.name,
            localNumber: union.localNumber,
            logoUrl: union.logoUrl,
            slug: union.slug,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send invite to ${member.userEmail}:`, error);
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} invites${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error('Error sending meeting invites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

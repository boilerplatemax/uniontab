import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { meetings, members, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, or } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');
    const status = searchParams.get('status') || undefined;
    const upcoming = searchParams.get('upcoming') === 'true';
    const past = searchParams.get('past') === 'true';

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
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
        { error: 'You must be an approved member of this union' },
        { status: 403 }
      );
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const now = new Date();

    // Build conditions
    const conditions = [eq(meetings.unionId, unionId)];

    // Non-admins can only see scheduled and completed meetings
    if (!isOwnerOrAdmin) {
      conditions.push(
        or(
          eq(meetings.status, 'scheduled'),
          eq(meetings.status, 'in_progress'),
          eq(meetings.status, 'completed')
        )!
      );
    }

    // Filter by status if provided
    if (status) {
      conditions.push(eq(meetings.status, status));
    }

    // Filter upcoming meetings
    if (upcoming) {
      conditions.push(gte(meetings.scheduledDate, now));
    }

    // Filter past meetings
    if (past) {
      conditions.push(lte(meetings.scheduledDate, now));
    }

    const meetingsList = await db
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
      .where(and(...conditions))
      .orderBy(desc(meetings.scheduledDate));

    return NextResponse.json({ success: true, meetings: meetingsList, isOwnerOrAdmin });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

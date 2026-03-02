import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, meetings, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;
  const meetingId = parseInt(id);

  if (isNaN(meetingId)) {
    return NextResponse.redirect(new URL(`/${slug}`, process.env.NEXT_PUBLIC_APP_URL || 'https://uniontab.com'));
  }

  const [union] = await db
    .select({ id: unions.id, publishedAt: unions.publishedAt })
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  if (!union || !union.publishedAt) {
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'https://uniontab.com'));
  }

  const [meeting] = await db
    .select({
      id: meetings.id,
      unionId: meetings.unionId,
      meetingLink: meetings.meetingLink,
      isPrivate: meetings.isPrivate,
      status: meetings.status,
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);

  const meetingPageUrl = `/${slug}/meeting/${meetingId}`;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://uniontab.com';

  if (!meeting || meeting.unionId !== union.id) {
    return NextResponse.redirect(new URL(`/${slug}/meetings`, base));
  }

  // Enforce the same access control as the meeting detail page
  if (meeting.isPrivate) {
    const user = await getUser();
    if (!user) {
      return NextResponse.redirect(new URL(`/${slug}/sign-in`, base));
    }
    const [membership] = await db
      .select({ id: members.id })
      .from(members)
      .where(
        and(
          eq(members.unionId, union.id),
          eq(members.userId, user.id),
          eq(members.status, 'approved'),
        ),
      )
      .limit(1);
    if (!membership) {
      return NextResponse.redirect(new URL(`/${slug}/sign-in`, base));
    }
  }

  // Redirect to the actual meeting platform link if available
  if (meeting.meetingLink && meeting.status !== 'cancelled') {
    return NextResponse.redirect(meeting.meetingLink);
  }

  // Fall back to the meeting detail page
  return NextResponse.redirect(new URL(meetingPageUrl, base));
}

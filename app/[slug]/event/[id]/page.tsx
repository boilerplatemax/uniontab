import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, events, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { ShareButton } from '@/components/share-button';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatDate as formatSimpleDate } from '@/lib/utils/date';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getEvent(eventId: number) {
  const [event] = await db
    .select({
      id: events.id,
      unionId: events.unionId,
      title: events.title,
      description: events.description,
      location: events.location,
      mediaUrl: events.mediaUrl,
      startDate: events.startDate,
      endDate: events.endDate,
      startTime: events.startTime,
      endTime: events.endTime,
      isAllDay: events.isAllDay,
      isPrivate: events.isPrivate,
      category: events.category,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(events)
    .innerJoin(users, eq(events.createdBy, users.id))
    .where(eq(events.id, eventId))
    .limit(1);

  return event;
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      user: users,
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
    .limit(1);

  return membership;
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) {
    notFound();
  }

  const event = await getEvent(eventId);
  if (!event || event.unionId !== union.id) {
    notFound();
  }

  // Check if event is private and user has access
  if (event.isPrivate) {
    const membership = await checkMembership(union.id);
    if (!membership) {
      redirect(`/login?redirect=/${slug}/event/${id}`);
    }
  }

  const membership = await checkMembership(union.id);
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href={`/${slug}/events`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {union.publicName || `${union.name.toUpperCase()}${union.localNumber || ''}`}
        </Link>

        <Card className="shadow-sm">
          <CardContent className="p-8">
            {event.mediaUrl && (
              <img
                src={event.mediaUrl}
                alt={event.title}
                className="w-full rounded-lg mb-6 max-h-96 object-cover"
              />
            )}

            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {event.title}
            </h1>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 text-gray-700">
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">
                    {formatDate(event.startDate)}
                    {new Date(event.startDate).toDateString() !==
                      new Date(event.endDate).toDateString() &&
                      ` - ${formatDate(event.endDate)}`}
                  </div>
                  {!event.isAllDay && (event.startTime || event.endTime) && (
                    <div className="text-sm text-gray-500">
                      {event.startTime && formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                  )}
                  {event.isAllDay && (
                    <div className="text-sm text-gray-500">All day</div>
                  )}
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>{event.location}</div>
                </div>
              )}

              {event.category && (
                <div className="inline-block">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {event.category}
                  </span>
                </div>
              )}
            </div>

            {/* Share Button */}
            <div className="mb-6">
              <ShareButton
                itemType="event"
                itemId={event.id}
                itemTitle={event.title}
                itemUrl={`/${slug}/event/${id}`}
                slug={slug}
                isOwnerOrAdmin={isOwnerOrAdmin}
              />
            </div>

            {event.description && (
              <>
                <div className="border-t pt-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    About this event
                  </h2>
                  <RichTextContent content={event.description} />
                </div>
              </>
            )}

            <div className="border-t pt-4 text-sm text-gray-500">
              Created by {event.createdBy.name} •{' '}
              {formatSimpleDate(event.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, meetings, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, ExternalLink, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);
  return union;
}

async function getMeeting(meetingId: number) {
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
    })
    .from(meetings)
    .where(eq(meetings.id, meetingId))
    .limit(1);
  return meeting;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function getPlatformName(platform: string) {
  switch (platform) {
    case 'zoom': return 'Zoom';
    case 'google_meet': return 'Google Meet';
    default: return 'Video Conference';
  }
}

function getTimezoneAbbr(timezone: string) {
  const abbrs: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HT',
    'UTC': 'UTC',
  };
  return abbrs[timezone] || timezone;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
    case 'in_progress':
      return <Badge className="bg-green-100 text-green-800">In Progress</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const meetingId = parseInt(id);

  if (isNaN(meetingId)) notFound();

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) notFound();

  const meeting = await getMeeting(meetingId);
  if (!meeting || meeting.unionId !== union.id) notFound();

  // If meeting is private, require membership
  if (meeting.isPrivate) {
    const user = await getUser();
    if (!user) {
      notFound();
    }
    const [membership] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(
        eq(members.unionId, union.id),
        eq(members.userId, user.id),
        eq(members.status, 'approved'),
      ))
      .limit(1);
    if (!membership) notFound();
  }

  const themeColor = union.themeColor || '#1d4ed8';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="py-8 px-4 text-white" style={{ backgroundColor: themeColor }}>
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/${slug}/meetings`}
            className="inline-flex items-center gap-2 text-sm mb-4 opacity-80 hover:opacity-100 transition-opacity"
            style={{ color: 'inherit' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meetings
          </Link>
          <div className="flex items-center gap-3 mb-2">
            {getStatusBadge(meeting.status)}
          </div>
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          {meeting.description && (
            <p className="mt-2 opacity-90 text-sm max-w-xl">{meeting.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Details card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(meeting.scheduledDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Time</p>
                  <p className="font-semibold text-gray-900">
                    {formatTime(meeting.startTime)}
                    {meeting.endTime && ` – ${formatTime(meeting.endTime)}`}
                    <span className="text-gray-500 text-sm ml-1">({getTimezoneAbbr(meeting.timezone)})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: themeColor }} />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Platform</p>
                  <p className="font-semibold text-gray-900">{getPlatformName(meeting.platform)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Join card */}
        {meeting.meetingLink && meeting.status !== 'cancelled' && (
          <Card style={{ borderColor: `${themeColor}40` }}>
            <CardContent className="p-6">
              <p
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: themeColor }}
              >
                Join the Meeting
              </p>
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-medium text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                <ExternalLink className="h-4 w-4" />
                Join {getPlatformName(meeting.platform)}
              </a>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {meeting.meetingId && (
                  <p>
                    <span className="font-medium">Meeting ID:</span> {meeting.meetingId}
                  </p>
                )}
                {meeting.meetingPassword && (
                  <p className="bg-yellow-50 border border-yellow-200 rounded px-3 py-1.5 inline-block">
                    <span className="font-medium">Password:</span> {meeting.meetingPassword}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agenda card */}
        {meeting.agenda && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-gray-500" />
                <h2 className="font-semibold text-gray-900">Agenda</h2>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                {meeting.agenda}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          {union.name}{union.localNumber ? ` Local ${union.localNumber}` : ''}
        </p>
      </div>
    </div>
  );
}

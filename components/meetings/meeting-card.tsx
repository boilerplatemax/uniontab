'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar, Clock, Video, MoreVertical, ExternalLink, Mail, FileText, Trash, Edit, Users } from 'lucide-react';
import { MeetingPosterDialog } from './meeting-poster-dialog';
import { SendInvitesDialog } from './send-invites-dialog';
import { EditMeetingDialog } from './edit-meeting-dialog';

interface Meeting {
  id: number;
  unionId: number;
  title: string;
  description: string | null;
  agenda: string | null;
  scheduledDate: Date;
  startTime: string;
  endTime: string | null;
  timezone: string;
  platform: string;
  meetingLink: string | null;
  meetingId: string | null;
  meetingPassword: string | null;
  status: string;
  isPrivate: boolean;
  participantMode?: string;
  createdAt: Date;
  createdBy: {
    id: number;
    name: string;
  } | null;
}

interface UnionInfo {
  id: number;
  name: string;
  localNumber: string | null;
  logoUrl: string | null;
  slug: string;
  themeColor?: string | null;
}

interface MeetingCardProps {
  meeting: Meeting;
  unionInfo: UnionInfo;
  isOwnerOrAdmin: boolean;
  onMeetingUpdated: () => void;
}

export function MeetingCard({ meeting, unionInfo, isOwnerOrAdmin, onMeetingUpdated }: MeetingCardProps) {
  const [showPoster, setShowPoster] = useState(false);
  const [showInvites, setShowInvites] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return 'Zoom';
      case 'google_meet':
        return 'Google Meet';
      default:
        return 'Video Call';
    }
  };

  const getStatusBadge = (status: string) => {
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
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/meetings/${meeting.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete meeting');
      }

      onMeetingUpdated();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const isPast = new Date(meeting.scheduledDate) < new Date();

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(meeting.status)}
                {meeting.isPrivate && (
                  <Badge variant="outline" className="text-xs">Members Only</Badge>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {meeting.title}
              </h3>

              <div className="space-y-1.5 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{formatDate(meeting.scheduledDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {formatTime(meeting.startTime)}
                    {meeting.endTime && ` - ${formatTime(meeting.endTime)}`}
                    <span className="text-gray-400 ml-1">({meeting.timezone})</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 flex-shrink-0" />
                  <span>{getPlatformName(meeting.platform)}</span>
                </div>
              </div>

              {meeting.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                  {meeting.description}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              {meeting.meetingLink && meeting.status !== 'cancelled' && (
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => window.open(meeting.meetingLink!, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Join
                </Button>
              )}

              {isOwnerOrAdmin && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEdit(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowInvites(true)}>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowPoster(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Poster
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-red-600"
                      disabled={deleting}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      {deleting ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <MeetingPosterDialog
        open={showPoster}
        onOpenChange={setShowPoster}
        meeting={meeting}
        unionInfo={unionInfo}
      />

      <SendInvitesDialog
        open={showInvites}
        onOpenChange={setShowInvites}
        meetingId={meeting.id}
        meetingTitle={meeting.title}
        unionId={meeting.unionId}
        participantMode={meeting.participantMode}
      />

      <EditMeetingDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        meeting={meeting}
        onMeetingUpdated={onMeetingUpdated}
      />
    </>
  );
}

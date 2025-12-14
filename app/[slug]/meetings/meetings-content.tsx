'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, Loader2 } from 'lucide-react';
import { CreateMeetingDialog } from '@/components/meetings/create-meeting-dialog';
import { MeetingCard } from '@/components/meetings/meeting-card';

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
  createdAt: Date;
  updatedAt: Date;
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
}

interface MeetingsContentProps {
  unionInfo: UnionInfo;
}

export function MeetingsContent({ unionInfo }: MeetingsContentProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meetings/list?unionId=${unionInfo.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch meetings');
      }

      setMeetings(data.meetings);
      setIsOwnerOrAdmin(data.isOwnerOrAdmin);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [unionInfo.id]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const now = new Date();

  const upcomingMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduledDate);
    return meetingDate >= now && m.status !== 'cancelled' && m.status !== 'completed';
  }).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const pastMeetings = meetings.filter(m => {
    const meetingDate = new Date(m.scheduledDate);
    return meetingDate < now || m.status === 'completed';
  }).sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

  const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchMeetings} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="h-6 w-6" />
            Online Meetings
          </h1>
          <p className="text-gray-600 mt-1">
            View and join scheduled online meetings
          </p>
        </div>
        {isOwnerOrAdmin && (
          <CreateMeetingDialog
            unionId={unionInfo.id}
            onMeetingCreated={fetchMeetings}
          />
        )}
      </div>

      {/* Meetings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming ({upcomingMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Clock className="h-4 w-4" />
            Past ({pastMeetings.length})
          </TabsTrigger>
          {isOwnerOrAdmin && cancelledMeetings.length > 0 && (
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledMeetings.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Upcoming Meetings
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {isOwnerOrAdmin
                    ? "There are no upcoming meetings scheduled. Create one to get started."
                    : "There are no upcoming meetings scheduled at this time."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  unionInfo={unionInfo}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  onMeetingUpdated={fetchMeetings}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastMeetings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Past Meetings
                </h3>
                <p className="text-gray-500">
                  Completed meetings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  unionInfo={unionInfo}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  onMeetingUpdated={fetchMeetings}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isOwnerOrAdmin && (
          <TabsContent value="cancelled" className="mt-6">
            {cancelledMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">
                    No cancelled meetings.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {cancelledMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    unionInfo={unionInfo}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    onMeetingUpdated={fetchMeetings}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Help section for admins */}
      {isOwnerOrAdmin && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">Setting Up Video Meetings</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-3">
            <p>
              <strong>Zoom:</strong> Create a meeting in your Zoom account, then paste the join link here.
              To get a Zoom account, visit <a href="https://zoom.us/signup" target="_blank" rel="noopener noreferrer" className="underline">zoom.us/signup</a>.
              Free accounts allow up to 40-minute meetings with up to 100 participants.
            </p>
            <p>
              <strong>Google Meet:</strong> Create a meeting in Google Calendar or at <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" className="underline">meet.google.com</a>,
              then paste the meeting link here. A Google account is required.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Video, Calendar, Clock, Link, Lock, Zap, Loader2, Users, KeyRound } from 'lucide-react';
import { MeetingParticipantSelector } from './meeting-participant-selector';

interface CreateMeetingDialogProps {
  unionId: number;
  onMeetingCreated: () => void;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
];

export function CreateMeetingDialog({ unionId, onMeetingCreated }: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomConfigured, setZoomConfigured] = useState(false);
  const [autoCreateZoom, setAutoCreateZoom] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [creatingZoom, setCreatingZoom] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    agenda: '',
    scheduledDate: '',
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    platform: 'zoom',
    meetingLink: '',
    meetingId: '',
    meetingPassword: '',
    isPrivate: true,
  });

  const [participantMode, setParticipantMode] = useState<'all' | 'selected'>('all');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Check if Zoom API is configured
  useEffect(() => {
    async function checkZoomStatus() {
      try {
        const response = await fetch('/api/zoom/status');
        if (response.ok) {
          const data = await response.json();
          setZoomConfigured(data.configured);
          // Auto-enable if Zoom is configured and platform is zoom
          if (data.configured && formData.platform === 'zoom') {
            setAutoCreateZoom(true);
          }
        }
      } catch (err) {
        console.error('Failed to check Zoom status:', err);
      }
    }
    checkZoomStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let meetingDetails = { ...formData };

      // If Zoom is configured and auto-create is enabled, create Zoom meeting first
      if (formData.platform === 'zoom' && autoCreateZoom && zoomConfigured) {
        setCreatingZoom(true);

        const zoomResponse = await fetch('/api/zoom/create-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unionId,
            title: formData.title,
            agenda: formData.agenda,
            scheduledDate: formData.scheduledDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            timezone: formData.timezone,
            usePassword,
          }),
        });

        const zoomData = await zoomResponse.json();
        setCreatingZoom(false);

        if (!zoomResponse.ok) {
          throw new Error(zoomData.error || 'Failed to create Zoom meeting');
        }

        // Use the Zoom meeting details
        meetingDetails = {
          ...formData,
          meetingLink: zoomData.zoomMeeting.joinUrl,
          meetingId: String(zoomData.zoomMeeting.id),
          meetingPassword: usePassword ? (zoomData.zoomMeeting.password || '') : '',
        };
      }

      const response = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          ...meetingDetails,
          participantMode,
          selectedMemberIds: participantMode === 'selected' ? selectedMemberIds : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting');
      }

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        agenda: '',
        scheduledDate: '',
        startTime: '',
        endTime: '',
        timezone: 'America/New_York',
        platform: 'zoom',
        meetingLink: '',
        meetingId: '',
        meetingPassword: '',
        isPrivate: true,
      });
      setParticipantMode('all');
      setSelectedMemberIds([]);
      setAutoCreateZoom(zoomConfigured); // Reset to default
      setUsePassword(false);
      onMeetingCreated();
    } catch (err: any) {
      setError(err.message);
      setCreatingZoom(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Schedule Online Meeting
          </DialogTitle>
          <DialogDescription>
            Create a new online meeting and send invites to members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Meeting Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Monthly Members Meeting"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the meeting purpose..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="agenda">Agenda</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="Meeting agenda items..."
                rows={4}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date & Time
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Video Platform */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Link className="h-4 w-4" />
              Video Conference
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => {
                    setFormData({ ...formData, platform: value });
                    // Auto-enable Zoom creation when switching to Zoom if configured
                    if (value === 'zoom' && zoomConfigured) {
                      setAutoCreateZoom(true);
                    } else {
                      setAutoCreateZoom(false);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google_meet">Google Meet</SelectItem>
                    <SelectItem value="custom">Other / Custom Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zoom API Integration Option */}
              {formData.platform === 'zoom' && zoomConfigured && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <Label htmlFor="autoCreateZoom" className="text-blue-900 font-medium">
                        Auto-create Zoom meeting
                      </Label>
                    </div>
                    <Switch
                      id="autoCreateZoom"
                      checked={autoCreateZoom}
                      onCheckedChange={setAutoCreateZoom}
                    />
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    {autoCreateZoom
                      ? 'A Zoom meeting will be automatically created with the details above. Meeting link and ID will be generated for you.'
                      : 'Turn this on to automatically create a Zoom meeting, or paste your own meeting link below.'}
                  </p>

                  {autoCreateZoom && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-blue-600" />
                        <Label htmlFor="usePassword" className="text-blue-900 font-medium text-sm">
                          Require meeting password
                        </Label>
                      </div>
                      <Switch
                        id="usePassword"
                        checked={usePassword}
                        onCheckedChange={setUsePassword}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Manual link entry - show when not auto-creating */}
              {!(formData.platform === 'zoom' && autoCreateZoom && zoomConfigured) && (
                <>
                  <div>
                    <Label htmlFor="meetingLink">Meeting Link</Label>
                    <Input
                      id="meetingLink"
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                      placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the meeting join link from your video platform
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meetingId">Meeting ID (optional)</Label>
                      <Input
                        id="meetingId"
                        value={formData.meetingId}
                        onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
                        placeholder="e.g., 123-456-7890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="meetingPassword">Password (optional)</Label>
                      <Input
                        id="meetingPassword"
                        value={formData.meetingPassword}
                        onChange={(e) => setFormData({ ...formData, meetingPassword: e.target.value })}
                        placeholder="Meeting password"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Privacy */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <Label htmlFor="isPrivate">Members Only</Label>
              </div>
              <Switch
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              When enabled, only approved members can view this meeting
            </p>
          </div>

          {/* Participant Selection */}
          {formData.isPrivate && (
            <div className="border-t pt-4">
              <MeetingParticipantSelector
                unionId={unionId}
                participantMode={participantMode}
                onParticipantModeChange={setParticipantMode}
                selectedMemberIds={selectedMemberIds}
                onSelectedMembersChange={setSelectedMemberIds}
                disabled={loading}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {creatingZoom ? 'Creating Zoom Meeting...' : 'Creating...'}
                </span>
              ) : (
                'Create Meeting'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

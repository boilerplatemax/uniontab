'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2 } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: (Omit<Event, 'createdBy'> & { createdBy: { name: string } }) | null;
  onSuccess: () => void;
}

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  onSuccess,
}: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setMediaUrl(event.mediaUrl || '');

      // Convert dates to YYYY-MM-DD format for date inputs
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);

      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setIsAllDay(event.isAllDay);
      setIsPrivate(event.isPrivate);
      setCategory(event.category || '');
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!event) return;

    if (!title || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate dates. Parse both start/end in the same local-time format so
    // the comparison is apples-to-apples (bare "YYYY-MM-DD" parses as UTC,
    // while "YYYY-MM-DDTHH:mm" parses as local). If no end time is given,
    // default it to the start time so a same-day event is never "backwards".
    const startTimeStr = startTime || '00:00';
    const endTimeStr = endTime || startTimeStr;
    const effectiveEndDate = endDate || startDate;
    const start = new Date(`${startDate}T${startTimeStr}`);
    const end = new Date(`${effectiveEndDate}T${endTimeStr}`);

    if (end < start) {
      setError('End date cannot be before start date');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          mediaUrl,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          startTime: isAllDay ? null : startTime,
          endTime: isAllDay ? null : endTime,
          isAllDay,
          isPrivate,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] !flex !flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder="Event description"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location"
              />
            </div>

            <div>
              <Label>Event Image (Optional)</Label>
              <FileUpload
                onFileSelect={(file, url) => {
                  if (url) setMediaUrl(url);
                  if (file === null) setMediaUrl('');
                }}
                accept="image/*"
                maxSize={5}
                currentUrl={mediaUrl}
                hint="Upload event image"
                bucket="union-files"
                path="events"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">
                  End Date (Optional - defaults to start date)
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAllDay"
                checked={isAllDay}
                onCheckedChange={setIsAllDay}
              />
              <Label htmlFor="isAllDay" className="cursor-pointer">
                All day event
              </Label>
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    step="900"
                    className="cursor-pointer"
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    step="900"
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Meeting, Social, Training"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                Private (members only)
              </Label>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

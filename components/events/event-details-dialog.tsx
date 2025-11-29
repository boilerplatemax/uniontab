'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Calendar, User, Edit, Trash2 } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: (Event & { createdBy: { name: string } }) | null;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventDetailsDialog({
  open,
  onOpenChange,
  event,
  isOwner,
  onEdit,
  onDelete,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isMultiDay =
    endDate.getDate() !== startDate.getDate() ||
    endDate.getMonth() !== startDate.getMonth() ||
    endDate.getFullYear() !== startDate.getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl pr-8">{event.title}</DialogTitle>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit?.();
                    onOpenChange(false);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDelete?.();
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Image */}
          {event.mediaUrl && (
            <div className="w-full">
              <img
                src={event.mediaUrl}
                alt={event.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  {isMultiDay ? (
                    <>
                      {formatDate(startDate)} - {formatDate(endDate)}
                    </>
                  ) : (
                    formatDate(startDate)
                  )}
                </div>
                {!event.isAllDay && (
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    {event.startTime && formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </div>
                )}
                {event.isAllDay && (
                  <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <Clock className="h-4 w-4" />
                    All day event
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="font-medium text-gray-900">{event.location}</div>
              </div>
            )}

            {/* Created By */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-gray-700">
                Organized by <span className="font-medium">{event.createdBy.name}</span>
              </div>
            </div>

            {/* Category and Privacy */}
            <div className="flex items-center gap-2">
              {event.category && (
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {event.category}
                </span>
              )}
              {event.isPrivate && (
                <span className="text-sm bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  Private Event
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">About this event</h3>
              <div
                className="prose prose-sm max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

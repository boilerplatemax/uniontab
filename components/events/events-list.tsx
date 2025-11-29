'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { MapPin, Clock, Calendar, Edit, Trash2, Loader2 } from 'lucide-react';
import type { Event } from '@/lib/db/schema';
import { useState } from 'react';

interface EventsListProps {
  events: (Event & { createdBy: { name: string } })[];
  isOwner: boolean;
  onEventClick?: (event: Event & { createdBy: { name: string } }) => void;
  onEdit?: (event: Event & { createdBy: { name: string } }) => void;
  onDelete?: (eventId: number) => void;
}

export function EventsList({ events, isOwner, onEventClick, onEdit, onDelete }: EventsListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const handleDeleteClick = (eventId: number) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    setDeletingId(eventToDelete);
    try {
      await onDelete?.(eventToDelete);
    } finally {
      setDeletingId(null);
      setEventToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  // Sort events by start date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Group events by month
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const month = new Date(event.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(event);
    return acc;
  }, {} as Record<string, typeof sortedEvents>);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500">
            {isOwner
              ? 'Create your first event to get started!'
              : 'Check back later for upcoming events.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{month}</h3>
          <div className="space-y-3">
            {monthEvents.map((event) => {
              const startDate = new Date(event.startDate);
              const endDate = new Date(event.endDate);
              const isMultiDay =
                endDate.getDate() !== startDate.getDate() ||
                endDate.getMonth() !== startDate.getMonth() ||
                endDate.getFullYear() !== startDate.getFullYear();

              return (
                <Card
                  key={event.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onEventClick?.(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Date Badge */}
                      <div className="flex-shrink-0">
                        <div className="bg-blue-600 text-white rounded-lg p-3 text-center w-16">
                          <div className="text-xs font-semibold">
                            {startDate.toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className="text-2xl font-bold">{startDate.getDate()}</div>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {event.title}
                              {event.isPrivate && (
                                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                              {event.category && (
                                <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {event.category}
                                </span>
                              )}
                            </h4>

                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {event.isAllDay ? (
                                  <span>All day</span>
                                ) : (
                                  <span>
                                    {event.startTime && formatTime(event.startTime)}
                                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                                  </span>
                                )}
                                {isMultiDay && (
                                  <span className="text-gray-500">
                                    • {formatDate(startDate)} - {formatDate(endDate)}
                                  </span>
                                )}
                              </div>

                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>

                            {event.description && (
                              <div className="mt-2 line-clamp-2">
                                <RichTextContent content={event.description} className="text-sm" />
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {isOwner && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(event);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(event.id);
                                }}
                                disabled={deletingId === event.id}
                              >
                                {deletingId === event.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Event Image */}
                        {event.mediaUrl && (
                          <div className="mt-3">
                            <img
                              src={event.mediaUrl}
                              alt={event.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingId !== null}
      />
    </div>
  );
}

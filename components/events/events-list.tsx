'use client';

import { Button } from '@/components/ui/button';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { ShareButton } from '@/components/share-button';
import { MapPin, Clock, Calendar, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react';
import type { Event } from '@/lib/db/schema';
import { useState } from 'react';
import { getContrastColor, DEFAULT_THEME_COLOR } from '@/lib/utils/color';

interface EventsListProps {
  events: (Omit<Event, 'createdBy'> & { createdBy: { name: string } })[];
  isOwner: boolean;
  onEventClick?: (event: Omit<Event, 'createdBy'> & { createdBy: { name: string } }) => void;
  onEdit?: (event: Omit<Event, 'createdBy'> & { createdBy: { name: string } }) => void;
  onDelete?: (eventId: number) => void;
  slug: string;
  themeColor?: string | null;
}

const DAY_ABBREVS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_ABBREVS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function EventsList({ events, isOwner, onEventClick, onEdit, onDelete, slug, themeColor }: EventsListProps) {
  const bgColor = themeColor || DEFAULT_THEME_COLOR;
  const textColor = getContrastColor(bgColor);
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

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatMonthYear = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Sort events by start date
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Group events by month
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const d = new Date(event.startDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!acc[key]) {
      acc[key] = { label: formatMonthYear(d), events: [] };
    }
    acc[key].events.push(event);
    return acc;
  }, {} as Record<string, { label: string; events: typeof sortedEvents }>);

  if (events.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <Calendar className="h-14 w-14 text-gray-200 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No events yet</h3>
        <p className="text-sm text-gray-400">
          {isOwner ? 'Create your first event to get started.' : 'Check back later for upcoming events.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Object.entries(groupedEvents).map(([key, { label, events: monthEvents }]) => (
        <div key={key}>
          {/* Month / Year header */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-bold uppercase tracking-widest text-gray-500">{label}</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="space-y-0 divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            {monthEvents.map((event) => {
              const startDate = new Date(event.startDate);
              const endDate = new Date(event.endDate);
              const dayAbbrev = DAY_ABBREVS[startDate.getDay()];
              const dayNum = startDate.getDate();
              const monthAbbrev = MONTH_ABBREVS[startDate.getMonth()];
              const isMultiDay =
                endDate.getDate() !== startDate.getDate() ||
                endDate.getMonth() !== startDate.getMonth() ||
                endDate.getFullYear() !== startDate.getFullYear();

              return (
                <article
                  key={event.id}
                  className="flex gap-0 bg-white hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => onEventClick?.(event)}
                >
                  {/* Left date column */}
                  <div
                    className="flex-shrink-0 w-20 sm:w-24 flex flex-col items-center justify-center py-5 px-2 text-center select-none"
                    style={{ backgroundColor: bgColor, color: textColor }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">{dayAbbrev}</span>
                    <span className="text-3xl font-extrabold leading-none mt-0.5">{dayNum}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mt-0.5">{monthAbbrev}</span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 flex gap-4 py-4 px-4 sm:px-5">
                    <div className="flex-1 min-w-0">
                      {/* Time / date row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mb-1.5">
                        {event.isAllDay ? (
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">All Day</span>
                        ) : (
                          <span className="text-xs font-semibold text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1 -mt-0.5 text-gray-400" />
                            {event.startTime && formatTime(event.startTime)}
                            {event.endTime && <span className="text-gray-400"> – {formatTime(event.endTime)}</span>}
                          </span>
                        )}
                        {isMultiDay && (
                          <span className="text-xs text-gray-400">
                            – {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {event.category && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            {event.category}
                          </span>
                        )}
                        {event.isPrivate && (
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                            Private
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors leading-tight mb-1.5">
                        {event.title}
                      </h3>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      {/* Description */}
                      {event.description && (
                        <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                          <RichTextContent content={event.description} className="text-sm" />
                        </div>
                      )}
                    </div>

                    {/* Event image */}
                    {event.mediaUrl && (
                      <div className="hidden sm:block flex-shrink-0 w-28 h-24 rounded-lg overflow-hidden bg-gray-100 self-start">
                        <img
                          src={event.mediaUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div
                      className="flex flex-col items-end justify-between flex-shrink-0 py-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <ShareButton
                          itemType="event"
                          itemId={event.id}
                          itemTitle={event.title}
                          itemUrl={`/${slug}/event/${event.id}`}
                          slug={slug}
                          isOwnerOrAdmin={isOwner}
                          size="sm"
                        />
                        {isOwner && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700"
                              onClick={() => onEdit?.(event)}
                              title="Edit event"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                              onClick={() => handleDeleteClick(event.id)}
                              disabled={deletingId === event.id}
                              title="Delete event"
                            >
                              {deletingId === event.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>

                      {/* View details link */}
                      <span className="text-xs text-gray-400 group-hover:text-gray-600 flex items-center gap-0.5 transition-colors mt-2">
                        Details <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </div>
                  </div>
                </article>
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

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import type { Event } from '@/lib/db/schema';

interface EventsCalendarProps {
  events: (Omit<Event, 'createdBy'> & { createdBy: { name: string } })[];
  onEventClick?: (event: Omit<Event, 'createdBy'> & { createdBy: { name: string } }) => void;
}

export function EventsCalendar({ events, onEventClick }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return (
        (eventStart <= dayEnd && eventEnd >= dayStart) ||
        (eventStart >= dayStart && eventStart <= dayEnd)
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const isTodayDate = isToday(day);
              const isCurrentMonthDate = isCurrentMonth(day);

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-r border-b last:border-r-0 ${
                    !isCurrentMonthDate ? 'bg-gray-50' : ''
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isTodayDate
                        ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
                        : isCurrentMonthDate
                        ? 'text-gray-900'
                        : 'text-gray-400'
                    }`}
                  >
                    {day.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const eventStart = new Date(event.startDate);
                      const eventEnd = new Date(event.endDate);
                      const isMultiDay =
                        eventEnd.getDate() !== eventStart.getDate() ||
                        eventEnd.getMonth() !== eventStart.getMonth() ||
                        eventEnd.getFullYear() !== eventStart.getFullYear();

                      const isFirstDay =
                        day.getDate() === eventStart.getDate() &&
                        day.getMonth() === eventStart.getMonth() &&
                        day.getFullYear() === eventStart.getFullYear();

                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className={`w-full text-left px-2 py-1 rounded text-xs hover:opacity-80 transition-opacity ${
                            event.isPrivate
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          <div className="font-medium truncate">
                            {isMultiDay && !isFirstDay && '→ '}
                            {event.title}
                          </div>
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

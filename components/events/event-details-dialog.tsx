'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { MapPin, Clock, Calendar, User, Edit, Trash2 } from 'lucide-react'
import type { Event } from '@/lib/db/schema'

interface EventDetailsDialogProps {
  event: (Event & { createdBy: { name: string } }) | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isOwner?: boolean
  onEdit?: (event: Event & { createdBy: { name: string } }) => void
  onDelete?: (eventId: number) => void
}

export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
  isOwner = false,
  onEdit,
  onDelete,
}: EventDetailsDialogProps) {
  if (!event) return null

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const isMultiDay =
    endDate.getDate() !== startDate.getDate() ||
    endDate.getMonth() !== startDate.getMonth() ||
    endDate.getFullYear() !== startDate.getFullYear()

  const handleEdit = () => {
    onOpenChange(false)
    onEdit?.(event)
  }

  const handleDelete = () => {
    onOpenChange(false)
    onDelete?.(event.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <Badge variant="secondary">{event.category}</Badge>
            )}
            {event.isPrivate && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Private Event
              </Badge>
            )}
            {event.isAllDay && (
              <Badge variant="outline">All Day</Badge>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {formatDate(startDate)}
                </p>
                {isMultiDay && (
                  <p className="text-sm text-gray-600">
                    to {formatDate(endDate)}
                  </p>
                )}
              </div>
            </div>

            {!event.isAllDay && (event.startTime || event.endTime) && (
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-gray-900">
                    {event.startTime && formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-gray-900">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">
                  Created by <span className="font-medium text-gray-900">{event.createdBy.name}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">About this event</h4>
              <RichTextContent content={event.description} />
            </div>
          )}

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

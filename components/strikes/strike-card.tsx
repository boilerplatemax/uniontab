'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StrikeStatusBadge } from './strike-status-badge';
import {
  Calendar,
  MapPin,
  Megaphone,
  AlertTriangle,
  FileText,
  ChevronRight,
  Trash2,
  Loader2,
} from 'lucide-react';
import type { Strike, PicketZone, StrikeAnnouncement, StrikeIncident, StrikeResource, User } from '@/lib/db/schema';

type StrikeWithRelations = Strike & {
  zones: PicketZone[];
  announcements: StrikeAnnouncement[];
  incidents: StrikeIncident[];
  resources: StrikeResource[];
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
};

interface StrikeCardProps {
  strike: StrikeWithRelations;
  onView: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

export function StrikeCard({ strike, onView, onDelete, isOwner }: StrikeCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the strike "${strike.title}"? This will also delete all associated zones, shifts, announcements, incidents, and resources.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/strikes/${strike.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete strike');
      }

      onDelete?.();
    } catch (error: any) {
      console.error('Error deleting strike:', error);
      alert(error.message || 'Failed to delete strike');
    } finally {
      setIsDeleting(false);
    }
  };

  const unresolvedIncidents = strike.incidents.filter(i => i.status !== 'resolved').length;

  return (
    <Card className={`hover:shadow-md transition-shadow ${strike.status === 'active' ? 'border-red-200 dark:border-red-800' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <CardTitle className="text-xl">{strike.title}</CardTitle>
              <StrikeStatusBadge status={strike.status} />
            </div>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(strike.startDate)}
              {strike.endDate && ` - ${formatDate(strike.endDate)}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete strike"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onView}>
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {strike.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {strike.description}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{strike.zones.length} zone{strike.zones.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <Megaphone className="w-4 h-4" />
            <span>{strike.announcements.length} announcement{strike.announcements.length !== 1 ? 's' : ''}</span>
          </div>
          {unresolvedIncidents > 0 ? (
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{unresolvedIncidents} open incident{unresolvedIncidents !== 1 ? 's' : ''}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <AlertTriangle className="w-4 h-4" />
              <span>No open incidents</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <FileText className="w-4 h-4" />
            <span>{strike.resources.length} resource{strike.resources.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

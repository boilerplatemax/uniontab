'use client';

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
}

export function StrikeCard({ strike, onView }: StrikeCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
          <Button variant="ghost" size="sm" onClick={onView}>
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
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

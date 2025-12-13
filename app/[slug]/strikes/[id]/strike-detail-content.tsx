'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrikeStatusBadge } from '@/components/strikes/strike-status-badge';
import { PicketScheduleTab } from '@/components/strikes/picket-schedule-tab';
import { AnnouncementsTab } from '@/components/strikes/announcements-tab';
import { IncidentsTab } from '@/components/strikes/incidents-tab';
import { ResourcesTab } from '@/components/strikes/resources-tab';
import { StrikePayTab } from '@/components/strikes/strike-pay-tab';
import { EditStrikeDialog } from '@/components/strikes/edit-strike-dialog';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Megaphone,
  AlertTriangle,
  FileText,
  DollarSign,
  Settings,
  Edit,
} from 'lucide-react';
import type { Union, User, Strike, PicketZone, PicketShift, PicketAssignment, StrikeAnnouncement, StrikeIncident, StrikeResource, Member } from '@/lib/db/schema';

type AssignmentWithMember = PicketAssignment & {
  member: Member & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  };
};

type ShiftWithAssignments = PicketShift & {
  assignments: AssignmentWithMember[];
};

type ZoneWithShifts = PicketZone & {
  shifts: ShiftWithAssignments[];
};

type AnnouncementWithCreator = StrikeAnnouncement & {
  createdBy: Pick<User, 'id' | 'name'>;
};

type IncidentWithDetails = StrikeIncident & {
  member: Member & {
    user: Pick<User, 'id' | 'name'>;
  };
  zone: PicketZone | null;
  resolvedBy: Pick<User, 'id' | 'name'> | null;
};

type ResourceWithCreator = StrikeResource & {
  createdBy: Pick<User, 'id' | 'name'>;
};

type StrikeWithRelations = Strike & {
  zones: ZoneWithShifts[];
  announcements: AnnouncementWithCreator[];
  incidents: IncidentWithDetails[];
  resources: ResourceWithCreator[];
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
};

interface StrikeDetailContentProps {
  union: Union;
  user: User;
  role: string;
  memberId: number;
  strike: StrikeWithRelations;
  isAdmin: boolean;
}

export function StrikeDetailContent({
  union,
  user,
  role,
  memberId,
  strike,
  isAdmin
}: StrikeDetailContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('schedule');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    router.push(`/${union.slug}/strikes`);
  };

  const handleStrikeUpdated = () => {
    router.refresh();
    setIsEditDialogOpen(false);
  };

  // Calculate stats
  const totalShifts = strike.zones.reduce((acc, zone) => acc + zone.shifts.length, 0);
  const totalAssignments = strike.zones.reduce((acc, zone) =>
    acc + zone.shifts.reduce((shiftAcc, shift) => shiftAcc + shift.assignments.length, 0), 0
  );
  const unresolvedIncidents = strike.incidents.filter(i => i.status !== 'resolved').length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Strikes
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{strike.title}</h1>
            <StrikeStatusBadge status={strike.status} />
          </div>
          {strike.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">
              {strike.description}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Start: {formatDate(strike.startDate)}
            </span>
            {strike.endDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                End: {formatDate(strike.endDate)}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Strike
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Picket Zones
            </CardDescription>
            <CardTitle className="text-2xl">{strike.zones.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Shifts
            </CardDescription>
            <CardTitle className="text-2xl">{totalShifts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Announcements
            </CardDescription>
            <CardTitle className="text-2xl">{strike.announcements.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={unresolvedIncidents > 0 ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20' : ''}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Open Incidents
            </CardDescription>
            <CardTitle className={`text-2xl ${unresolvedIncidents > 0 ? 'text-orange-600' : ''}`}>
              {unresolvedIncidents}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rules Section */}
      {strike.rules && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Strike Rules & Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {strike.rules}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            <span className="hidden sm:inline">Announcements</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Resources</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="strikepay" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Strike Pay</span>
            </TabsTrigger>
          )}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="schedule">
            <PicketScheduleTab
              strikeId={strike.id}
              zones={strike.zones}
              memberId={memberId}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsTab
              strikeId={strike.id}
              announcements={strike.announcements}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="incidents">
            <IncidentsTab
              strikeId={strike.id}
              incidents={strike.incidents}
              zones={strike.zones}
              memberId={memberId}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourcesTab
              strikeId={strike.id}
              resources={strike.resources}
              isAdmin={isAdmin}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="strikepay">
              <StrikePayTab
                strikeId={strike.id}
                strike={strike}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {/* Edit Strike Dialog */}
      {isAdmin && (
        <EditStrikeDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          strike={strike}
          onSuccess={handleStrikeUpdated}
        />
      )}
    </div>
  );
}

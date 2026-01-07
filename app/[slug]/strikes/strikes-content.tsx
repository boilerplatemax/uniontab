'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateStrikeDialog } from '@/components/strikes/create-strike-dialog';
import { StrikeCard } from '@/components/strikes/strike-card';
import { StrikeStatusBadge } from '@/components/strikes/strike-status-badge';
import {
  Plus,
  Megaphone,
  MapPin,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
} from 'lucide-react';
import type { Union, User, Strike, PicketZone, StrikeAnnouncement, StrikeIncident, StrikeResource } from '@/lib/db/schema';

type StrikeWithRelations = Strike & {
  zones: PicketZone[];
  announcements: StrikeAnnouncement[];
  incidents: StrikeIncident[];
  resources: StrikeResource[];
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
};

interface StrikeSummary {
  total: number;
  preparing: number;
  active: number;
  resolved: number;
}

interface StrikesContentProps {
  union: Union;
  user: User;
  role: string;
  memberId: number;
  strikes: StrikeWithRelations[];
  summary: StrikeSummary | null;
}

export function StrikesContent({
  union,
  user,
  role,
  memberId,
  strikes,
  summary
}: StrikesContentProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const isAdmin = role === 'owner' || role === 'admin';

  const filteredStrikes = strikes.filter(strike => {
    if (activeTab === 'all') return true;
    return strike.status === activeTab;
  });

  const handleStrikeCreated = () => {
    router.refresh();
    setIsCreateDialogOpen(false);
  };

  const handleViewStrike = (strikeId: number) => {
    router.push(`/${union.slug}/strikes/${strikeId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Strike Hub</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage strike actions, picket schedules, and coordination
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Strike
          </Button>
        )}
      </div>

      {/* Summary Cards (Admin only) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Strikes</CardDescription>
              <CardTitle className="text-2xl">{summary.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Preparing</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{summary.preparing}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-red-600">{summary.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-2xl text-green-600">{summary.resolved}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Quick Stats for Active Strikes */}
      {strikes.some(s => s.status === 'active') && (
        <Card className="mb-8 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Strike
            </CardTitle>
          </CardHeader>
          <CardContent>
            {strikes.filter(s => s.status === 'active').map(strike => (
              <div key={strike.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{strike.title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {strike.zones.length} zones
                    </span>
                    <span className="flex items-center gap-1">
                      <Megaphone className="w-4 h-4" />
                      {strike.announcements.length} announcements
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {strike.incidents.length} incidents
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleViewStrike(strike.id)}>
                  View Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Strikes</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="preparing">Preparing</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Strikes List */}
      {filteredStrikes.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No strikes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'all'
                ? 'There are no strikes scheduled yet.'
                : `There are no ${activeTab} strikes.`}
            </p>
            {isAdmin && activeTab === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Strike
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredStrikes.map(strike => (
            <StrikeCard
              key={strike.id}
              strike={strike}
              onView={() => handleViewStrike(strike.id)}
              onDelete={() => router.refresh()}
              isOwner={role === 'owner'}
            />
          ))}
        </div>
      )}

      {/* Create Strike Dialog */}
      {isAdmin && (
        <CreateStrikeDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          unionId={union.id}
          onSuccess={handleStrikeCreated}
        />
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GrievanceCard } from '@/components/grievances/grievance-card';
import { CreateGrievanceDialog } from '@/components/grievances/create-grievance-dialog';
import { Plus, Search, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { GrievanceStatus } from '@/lib/db/schema';

interface GrievancesContentProps {
  union: any;
  user: any;
  role: string;
  memberId: number;
  grievances: any[];
  summary: any;
  adminMembers: any[];
}

export function GrievancesContent({
  union,
  user,
  role,
  memberId,
  grievances: initialGrievances,
  summary,
  adminMembers,
}: GrievancesContentProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [grievances, setGrievances] = useState(initialGrievances);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';

  const handleRefresh = async () => {
    const params = new URLSearchParams({ unionId: union.id.toString() });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);

    const response = await fetch(`/api/grievances/list?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setGrievances(data.grievances);
    }
  };

  const handleExport = async () => {
    window.open(`/api/grievances/export?unionId=${union.id}`, '_blank');
  };

  // Filter grievances based on search query
  const filteredGrievances = grievances.filter((g) => {
    const matchesSearch = searchQuery
      ? g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesSearch;
  });

  // Apply status and priority filters via API when changed
  const handleStatusFilterChange = async (value: string) => {
    setStatusFilter(value);
    const params = new URLSearchParams({ unionId: union.id.toString() });
    if (value !== 'all') params.set('status', value);
    if (priorityFilter !== 'all') params.set('priority', priorityFilter);

    const response = await fetch(`/api/grievances/list?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setGrievances(data.grievances);
    }
  };

  const handlePriorityFilterChange = async (value: string) => {
    setPriorityFilter(value);
    const params = new URLSearchParams({ unionId: union.id.toString() });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (value !== 'all') params.set('priority', value);

    const response = await fetch(`/api/grievances/list?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      setGrievances(data.grievances);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Grievances</h1>
          <p className="text-muted-foreground mt-1">
            {isOwnerOrAdmin
              ? 'Manage and track grievances for your union'
              : 'View and submit your grievances'}
          </p>
        </div>
        <div className="flex gap-2">
          {isOwnerOrAdmin && (
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Grievance
          </Button>
        </div>
      </div>

      {/* Summary Stats (Admin only) */}
      {isOwnerOrAdmin && summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span>Total Grievances</span>
            </div>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span>Active</span>
            </div>
            <p className="text-2xl font-bold">
              {summary.submittedCount + summary.assignedCount + summary.underReviewCount}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span>Urgent</span>
            </div>
            <p className="text-2xl font-bold">{summary.urgentCount}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Resolved</span>
            </div>
            <p className="text-2xl font-bold">{summary.resolvedCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search grievances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={GrievanceStatus.DRAFT}>Draft</SelectItem>
                <SelectItem value={GrievanceStatus.SUBMITTED}>Submitted</SelectItem>
                <SelectItem value={GrievanceStatus.ASSIGNED}>Assigned</SelectItem>
                <SelectItem value={GrievanceStatus.UNDER_REVIEW}>Under Review</SelectItem>
                <SelectItem value={GrievanceStatus.AWAITING_RESPONSE}>Awaiting Response</SelectItem>
                <SelectItem value={GrievanceStatus.RESOLVED}>Resolved</SelectItem>
                <SelectItem value={GrievanceStatus.CLOSED}>Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grievances List */}
      {filteredGrievances.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No grievances found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : isOwnerOrAdmin
              ? 'No grievances have been filed yet'
              : "You haven't filed any grievances yet"}
          </p>
          {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              File Your First Grievance
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGrievances.map((grievance) => (
            <GrievanceCard
              key={grievance.id}
              grievance={grievance}
              unionSlug={union.slug}
              isAdmin={isOwnerOrAdmin}
            />
          ))}
        </div>
      )}

      {/* Create Grievance Dialog */}
      <CreateGrievanceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        unionId={union.id}
        unionSlug={union.slug}
        onSuccess={handleRefresh}
      />
    </div>
  );
}

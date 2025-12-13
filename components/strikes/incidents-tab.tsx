'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  FileText,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { StrikeIncident, PicketZone, Member, User as UserType } from '@/lib/db/schema';

type IncidentWithDetails = StrikeIncident & {
  member: Member & {
    user: Pick<UserType, 'id' | 'name'>;
  };
  zone: PicketZone | null;
  resolvedBy: Pick<UserType, 'id' | 'name'> | null;
};

type ZoneBasic = Pick<PicketZone, 'id' | 'name'>;

interface IncidentsTabProps {
  strikeId: number;
  incidents: IncidentWithDetails[];
  zones: ZoneBasic[];
  memberId: number;
  isAdmin: boolean;
}

export function IncidentsTab({ strikeId, incidents, zones, memberId, isAdmin }: IncidentsTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [reportForm, setReportForm] = useState({
    description: '',
    severity: 'medium',
    incidentType: '',
    zoneId: '',
    fileUrl: '',
    fileName: '',
    fileType: ''
  });

  const [resolveForm, setResolveForm] = useState({
    status: 'resolved',
    resolutionNotes: ''
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Reported
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Under Review
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </Badge>
        );
      case 'escalated':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Escalated
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('report');
    setError(null);

    try {
      const response = await fetch(`/api/strikes/${strikeId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportForm,
          zoneId: reportForm.zoneId ? parseInt(reportForm.zoneId) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to report incident');
      }

      setReportForm({
        description: '',
        severity: 'medium',
        incidentType: '',
        zoneId: '',
        fileUrl: '',
        fileName: '',
        fileType: ''
      });
      setShowReportDialog(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const handleResolve = async (e: React.FormEvent, incidentId: number) => {
    e.preventDefault();
    setIsLoading(`resolve-${incidentId}`);
    setError(null);

    try {
      const response = await fetch(`/api/strikes/incidents/${incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolveForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update incident');
      }

      setResolveForm({ status: 'resolved', resolutionNotes: '' });
      setShowResolveDialog(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(null);
    }
  };

  const openIncidents = incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Incident Reports</h2>
        <Button onClick={() => setShowReportDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Report Incident
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Open Incidents */}
      {openIncidents.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 text-orange-700 dark:text-orange-400">
            Open Incidents ({openIncidents.length})
          </h3>
          <div className="space-y-4">
            {openIncidents.map(incident => (
              <Card key={incident.id} className="border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                      {incident.incidentType && (
                        <Badge variant="outline">{incident.incidentType}</Badge>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowResolveDialog(incident.id)}
                      >
                        Update Status
                      </Button>
                    )}
                  </div>
                  <CardDescription className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {incident.member.user.name}
                    </span>
                    {incident.zone && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {incident.zone.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(incident.createdAt)}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{incident.description}</p>
                  {incident.fileUrl && (
                    <a
                      href={incident.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-3 text-blue-600 hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      {incident.fileName || 'View attachment'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Incidents */}
      {resolvedIncidents.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4 text-green-700 dark:text-green-400">
            Resolved Incidents ({resolvedIncidents.length})
          </h3>
          <div className="space-y-4">
            {resolvedIncidents.map(incident => (
              <Card key={incident.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(incident.severity)}
                      {getStatusBadge(incident.status)}
                    </div>
                  </div>
                  <CardDescription className="flex flex-wrap gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {incident.member.user.name}
                    </span>
                    {incident.resolvedBy && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Resolved by {incident.resolvedBy.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{incident.description}</p>
                  {incident.resolutionNotes && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded">
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">Resolution:</p>
                      <p className="text-sm">{incident.resolutionNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {incidents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">No incidents reported</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Keep it up! Report any issues that arise during the strike.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Incident Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Report Incident</DialogTitle>
            <DialogDescription>
              Document any incident that occurred during the strike.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReport}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  placeholder="Describe what happened..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={reportForm.severity}
                    onValueChange={(value) => setReportForm({ ...reportForm, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="incidentType">Type</Label>
                  <Select
                    value={reportForm.incidentType}
                    onValueChange={(value) => setReportForm({ ...reportForm, incidentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="confrontation">Confrontation</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zone">Zone (Optional)</Label>
                <Select
                  value={reportForm.zoneId}
                  onValueChange={(value) => setReportForm({ ...reportForm, zoneId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific zone</SelectItem>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fileUrl">Attachment URL (Optional)</Label>
                <Input
                  id="fileUrl"
                  value={reportForm.fileUrl}
                  onChange={(e) => setReportForm({ ...reportForm, fileUrl: e.target.value })}
                  placeholder="Link to photo, video, or document"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading === 'report'}>
                {isLoading === 'report' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Incident Dialog */}
      <Dialog open={showResolveDialog !== null} onOpenChange={() => setShowResolveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Incident Status</DialogTitle>
            <DialogDescription>
              Change the status and add resolution notes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => showResolveDialog && handleResolve(e, showResolveDialog)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={resolveForm.status}
                  onValueChange={(value) => setResolveForm({ ...resolveForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  placeholder="How was this incident handled?"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowResolveDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading?.startsWith('resolve-')}>
                {isLoading?.startsWith('resolve-') && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

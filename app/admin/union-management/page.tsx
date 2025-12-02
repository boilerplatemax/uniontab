'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Download, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnionStats {
  id: number;
  name: string;
  slug: string;
  localNumber: string | null;
  publicName: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  subscriptionStatus: string | null;
  planName: string | null;
  memberCount: number;
  activityCount: number;
  postsCount: number;
  eventsCount: number;
  filesCount: number;
  pagesCount: number;
  onboardingCompletion: number;
  lastActivityAt: Date | null;
  ownerName?: string;
  ownerEmail?: string;
  lastLoginAt: Date | null;
}

export default function UnionManagementPage() {
  const [unions, setUnions] = useState<UnionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [selectedUnion, setSelectedUnion] = useState<UnionStats | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUnions();
  }, []);

  const fetchUnions = async () => {
    try {
      const response = await fetch('/api/admin/unions');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch unions');
      }

      setUnions(data.unions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async (unionId: number, unionSlug: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/unions/${unionId}/backup`);

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${unionSlug}-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to backup union: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUnion) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/unions/${selectedUnion.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete union');
      }

      // Refresh the list
      await fetchUnions();
      setDeleteDialogOpen(false);
      setSelectedUnion(null);
    } catch (err: any) {
      alert('Failed to delete union: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWarning = async () => {
    if (!selectedUnion) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/unions/${selectedUnion.id}/warning`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send warning');
      }

      alert('Warning email sent successfully!');
      setWarningDialogOpen(false);
      setSelectedUnion(null);
    } catch (err: any) {
      alert('Failed to send warning: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getActivityStatus = (lastActivityAt: Date | null) => {
    if (!lastActivityAt) return { status: 'Inactive', variant: 'destructive' as const };

    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity <= 7) return { status: 'Active', variant: 'default' as const };
    if (daysSinceActivity <= 30) return { status: 'Moderate', variant: 'secondary' as const };
    return { status: 'Inactive', variant: 'destructive' as const };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Union Management Dashboard</CardTitle>
            <p className="text-sm text-gray-600">
              View and manage all unions on the platform
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Union</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unions.map((union) => {
                    const activityStatus = getActivityStatus(union.lastActivityAt);
                    return (
                      <TableRow key={union.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {union.publicName || union.name}
                              </span>
                              <a
                                href={`/${union.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            <span className="text-xs text-gray-500">/{union.slug}</span>
                            {union.localNumber && (
                              <span className="text-xs text-gray-500">Local: {union.localNumber}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {union.ownerName ? (
                              <>
                                <span className="text-sm font-medium">{union.ownerName}</span>
                                <span className="text-xs text-gray-500">{union.ownerEmail}</span>
                                {union.lastLoginAt && (
                                  <span className="text-xs text-gray-400">
                                    Last login: {new Date(union.lastLoginAt).toLocaleDateString()}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">No owner</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{union.memberCount}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={activityStatus.variant}>
                              {activityStatus.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {union.activityCount} logs
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${union.onboardingCompletion}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">
                              {union.onboardingCompletion}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {union.publishedAt ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(union.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleBackup(union.id, union.slug)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Backup Union
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUnion(union);
                                  setWarningDialogOpen(true);
                                }}
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Send Warning
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUnion(union);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Union
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {unions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No unions found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Union</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete "{selectedUnion?.publicName || selectedUnion?.name}"?
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside mt-2">
                  <li>All {selectedUnion?.memberCount} members</li>
                  <li>All {selectedUnion?.postsCount} posts</li>
                  <li>All {selectedUnion?.eventsCount} events</li>
                  <li>All {selectedUnion?.filesCount} files</li>
                  <li>All {selectedUnion?.pagesCount} pages</li>
                  <li>All activity logs and other related data</li>
                </ul>
                <p className="mt-2 font-semibold">
                  A deletion notification will be sent to {selectedUnion?.email || 'the union contact'}.
                </p>
                <p className="mt-2 text-red-600 font-semibold">
                  This action cannot be undone!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Union'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Dialog */}
      <AlertDialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Suspension Warning</AlertDialogTitle>
            <AlertDialogDescription>
              Send a warning email to "{selectedUnion?.publicName || selectedUnion?.name}"
              notifying them that their account will be suspended in 2 weeks due to inactivity.
              The email will be sent to: {selectedUnion?.email || 'No email on file'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendWarning}
              disabled={actionLoading || !selectedUnion?.email}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Warning'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

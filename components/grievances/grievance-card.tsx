'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { GrievanceStatusBadge } from './grievance-status-badge';
import { GrievancePriorityBadge } from './grievance-priority-badge';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Paperclip, User, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GrievanceCardProps {
  grievance: any;
  unionSlug: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  onDelete?: () => void;
  onArchiveToggle?: () => void;
}

export function GrievanceCard({
  grievance,
  unionSlug,
  isAdmin = false,
  isOwner = false,
  onDelete,
  onArchiveToggle
}: GrievanceCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [wasResolved, setWasResolved] = useState<string>('no');

  const commentCount = grievance.comments?.length || 0;
  const attachmentCount = grievance.attachments?.length || 0;
  const canDelete = isAdmin || (isOwner && grievance.status === 'draft');
  const canArchive = isAdmin;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on a button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/${unionSlug}/grievances/${grievance.id}`);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        if (onDelete) onDelete();
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete grievance');
      }
    } catch (error) {
      console.error('Error deleting grievance:', error);
      alert('Failed to delete grievance');
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveToggle = async () => {
    setArchiving(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isArchived: !grievance.isArchived,
          markAsResolved: !grievance.isArchived && wasResolved === 'yes'
        }),
      });

      if (response.ok) {
        setShowArchiveDialog(false);
        setWasResolved('no'); // Reset for next time
        if (onArchiveToggle) {
          onArchiveToggle();
        } else {
          // Fallback to router refresh if no callback provided
          router.refresh();
        }
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to archive grievance');
      }
    } catch (error) {
      console.error('Error archiving grievance:', error);
      alert('Failed to archive grievance');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
      <Card
        className="hover:border-primary/50 transition-all cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg mb-2 line-clamp-1">
                {grievance.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {grievance.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <GrievanceStatusBadge status={grievance.status} />
              {grievance.priority && (
                <GrievancePriorityBadge priority={grievance.priority} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            {grievance.category && (
              <Badge variant="outline" className="bg-gray-50">
                {grievance.category}
              </Badge>
            )}
            {isAdmin && grievance.member?.user && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
                <User className="h-3 w-3" />
                {grievance.member.user.name}
              </Badge>
            )}
            {grievance.assignedTo && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 gap-1">
                <User className="h-3 w-3" />
                Assigned to {grievance.assignedTo.name}
              </Badge>
            )}
            {grievance.isArchived && (
              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                Archived
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              {commentCount > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{commentCount}</span>
                </div>
              )}
              {attachmentCount > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{attachmentCount}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDistanceToNow(new Date(grievance.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              {canArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowArchiveDialog(true);
                  }}
                >
                  {grievance.isArchived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4 mr-1" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grievance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grievance? This action cannot be undone and will permanently remove all comments and attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grievance.isArchived ? 'Unarchive' : 'Archive'} Grievance
            </AlertDialogTitle>
            <AlertDialogDescription>
              {grievance.isArchived
                ? 'Are you sure you want to unarchive this grievance? It will be visible in the main grievances list again.'
                : 'Are you sure you want to archive this grievance? It will be hidden from the main grievances list, but you can unarchive it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {!grievance.isArchived && (
            <div className="py-4">
              <Label className="text-sm font-medium mb-3 block">
                Was this grievance resolved?
              </Label>
              <RadioGroup value={wasResolved} onValueChange={setWasResolved}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="yes" id="resolved-yes" />
                  <Label htmlFor="resolved-yes" className="font-normal cursor-pointer">
                    Yes, the issue was resolved
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="resolved-no" />
                  <Label htmlFor="resolved-no" className="font-normal cursor-pointer">
                    No, the issue was not resolved
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveToggle}
              disabled={archiving}
            >
              {archiving ? 'Processing...' : grievance.isArchived ? 'Unarchive' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { GrievanceStatusBadge } from '@/components/grievances/grievance-status-badge';
import { GrievancePriorityBadge } from '@/components/grievances/grievance-priority-badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, User, Send, Paperclip, Download } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { GrievanceStatus } from '@/lib/db/schema';

interface GrievanceDetailContentProps {
  union: any;
  user: any;
  role: string;
  memberId: number;
  grievance: any;
  adminMembers: any[];
}

export function GrievanceDetailContent({
  union,
  user,
  role,
  memberId,
  grievance: initialGrievance,
  adminMembers,
}: GrievanceDetailContentProps) {
  const router = useRouter();
  const [grievance, setGrievance] = useState(initialGrievance);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isGrievanceOwner = grievance.memberId === memberId;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          isInternal: isInternalNote,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setIsInternalNote(false);
        // Refresh the page to show new comment
        router.refresh();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (assignedToId: string) => {
    setAssignLoading(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: assignedToId ? parseInt(assignedToId) : null,
        }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error assigning grievance:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async () => {
    await handleStatusChange(GrievanceStatus.SUBMITTED);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(`/${union.slug}/grievances`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Grievances
      </Button>

      {/* Main Grievance Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <GrievanceStatusBadge status={grievance.status} />
                {grievance.priority && (
                  <GrievancePriorityBadge priority={grievance.priority} />
                )}
                {grievance.category && (
                  <Badge variant="outline">{grievance.category}</Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{grievance.title}</CardTitle>
              <CardDescription>
                Grievance #{grievance.id} • Filed{' '}
                {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
              </CardDescription>
            </div>
            {isGrievanceOwner && grievance.status === 'draft' && (
              <Button onClick={handleSubmit}>Submit Grievance</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <Label className="text-base font-semibold">Description</Label>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {grievance.description}
            </p>
          </div>

          {/* Member Info (for admins) */}
          {isOwnerOrAdmin && grievance.member && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Submitted By</Label>
              <div className="mt-2 flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{grievance.member.user.name}</span>
                <span className="text-muted-foreground">({grievance.member.user.email})</span>
              </div>
            </div>
          )}

          {/* Assignment (for admins) */}
          {isOwnerOrAdmin && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Assigned To</Label>
              <Select
                value={grievance.assignedTo?.id.toString() || 'unassigned'}
                onValueChange={handleAssign}
                disabled={assignLoading}
              >
                <SelectTrigger className="mt-2 w-full max-w-md">
                  <SelectValue placeholder="Assign to someone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {adminMembers.map((admin) => (
                    <SelectItem key={admin.user.id} value={admin.user.id.toString()}>
                      {admin.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Management (for admins) */}
          {isOwnerOrAdmin && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Update Status</Label>
              <Select
                value={grievance.status}
                onValueChange={handleStatusChange}
                disabled={statusLoading}
              >
                <SelectTrigger className="mt-2 w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GrievanceStatus.SUBMITTED}>Submitted</SelectItem>
                  <SelectItem value={GrievanceStatus.ASSIGNED}>Assigned</SelectItem>
                  <SelectItem value={GrievanceStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={GrievanceStatus.AWAITING_RESPONSE}>
                    Awaiting Response
                  </SelectItem>
                  <SelectItem value={GrievanceStatus.RESOLVED}>Resolved</SelectItem>
                  <SelectItem value={GrievanceStatus.CLOSED}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Attachments */}
          {grievance.attachments && grievance.attachments.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold">Attachments</Label>
              <div className="mt-2 space-y-2">
                {grievance.attachments.map((attachment: any) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{attachment.fileName}</span>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments/Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Comments & Updates</CardTitle>
          <CardDescription>
            Communication thread for this grievance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing Comments */}
          {grievance.comments && grievance.comments.length > 0 ? (
            <div className="space-y-4">
              {grievance.comments.map((comment: any) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg border ${
                    comment.isInternal ? 'bg-yellow-50 border-yellow-200' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.createdBy.name}</span>
                      {comment.isInternal && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Internal Note
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No comments yet. Start the conversation below.
            </p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t pt-4">
            <Label htmlFor="comment">Add a Comment</Label>
            <Textarea
              id="comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              className="mt-2"
            />
            {isOwnerOrAdmin && (
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  id="internal"
                  checked={isInternalNote}
                  onCheckedChange={setIsInternalNote}
                />
                <Label htmlFor="internal" className="text-sm cursor-pointer">
                  Internal note (visible only to admins)
                </Label>
              </div>
            )}
            <Button type="submit" className="mt-4" disabled={loading || !newComment.trim()}>
              {loading ? (
                'Posting...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

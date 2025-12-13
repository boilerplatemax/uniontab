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
import { Badge } from '@/components/ui/badge';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { ArrowLeft, Calendar, User, Send, Paperclip, Download, AlertTriangle, Trash2, Edit2, X, Check, Upload } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { GrievanceStatus } from '@/lib/db/schema';

interface GrievanceDetailContentProps {
  union: any;
  user: any;
  role: string;
  memberId: number;
  grievance: any;
  adminMembers: any[];
  allMembers: any[];
}

export function GrievanceDetailContent({
  union,
  user,
  role,
  memberId,
  grievance: initialGrievance,
  adminMembers,
  allMembers,
}: GrievanceDetailContentProps) {
  const router = useRouter();
  const [grievance, setGrievance] = useState(initialGrievance);
  const [newComment, setNewComment] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showNonAdminWarning, setShowNonAdminWarning] = useState(false);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [newAttachments, setNewAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isGrievanceOwner = grievance.memberId === memberId;
  const canManageFiles = isOwnerOrAdmin || isGrievanceOwner;

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
        const data = await response.json();
        // Update grievance state with new comment
        setGrievance((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
        setNewComment('');
        setIsInternalNote(false);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (assignedToId: string) => {
    if (assignedToId === 'unassigned') {
      handleAssign(assignedToId);
      return;
    }

    // Check if the selected user is a non-admin
    const selectedMember = allMembers.find(m => m.user.id.toString() === assignedToId);
    const isNonAdmin = selectedMember && selectedMember.member.role !== 'owner' && selectedMember.member.role !== 'admin';

    if (isNonAdmin) {
      setPendingAssignmentId(assignedToId);
      setShowNonAdminWarning(true);
    } else {
      handleAssign(assignedToId);
    }
  };

  const confirmNonAdminAssignment = () => {
    if (pendingAssignmentId) {
      handleAssign(pendingAssignmentId);
      setShowNonAdminWarning(false);
      setPendingAssignmentId(null);
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
        const data = await response.json();
        // Update grievance state with new assignment
        setGrievance((prev: any) => ({
          ...prev,
          assignedTo: data.grievance.assignedTo,
          assignedAt: data.grievance.assignedAt,
        }));
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
        const data = await response.json();
        // Update grievance state with new status
        setGrievance((prev: any) => ({
          ...prev,
          status: data.grievance.status,
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubmit = async () => {
    await handleStatusChange(GrievanceStatus.SUBMITTED);
    // Navigate back to grievances list after successful submission
    router.push(`/${union.slug}/grievances`);
  };

  const handleEditComment = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await fetch(`/api/grievances/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editingCommentText }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the comment in the grievance state
        setGrievance((prev: any) => ({
          ...prev,
          comments: prev.comments.map((c: any) =>
            c.id === commentId ? data.comment : c
          ),
        }));
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/grievances/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the comment from the grievance state
        setGrievance((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c.id !== commentId),
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/grievances/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the attachment from the grievance state
        setGrievance((prev: any) => ({
          ...prev,
          attachments: prev.attachments.filter((a: any) => a.id !== attachmentId),
        }));
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleUploadAttachments = async () => {
    if (newAttachments.length === 0) return;

    setUploading(true);
    try {
      // Upload each attachment
      for (const attachment of newAttachments) {
        const response = await fetch(`/api/grievances/${grievance.id}/attachment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachment),
        });

        if (response.ok) {
          const data = await response.json();
          // Add the new attachment to the grievance state
          setGrievance((prev: any) => ({
            ...prev,
            attachments: [...(prev.attachments || []), data.attachment],
          }));
        }
      }

      setNewAttachments([]);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error uploading attachments:', error);
    } finally {
      setUploading(false);
    }
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
                onValueChange={handleAssignmentChange}
                disabled={assignLoading}
              >
                <SelectTrigger className="mt-2 w-full max-w-md">
                  <SelectValue placeholder="Assign to someone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {allMembers.map((member) => {
                    const isAdmin = member.member.role === 'owner' || member.member.role === 'admin';
                    return (
                      <SelectItem key={member.user.id} value={member.user.id.toString()}>
                        {member.user.name} {!isAdmin && '(Member)'}
                      </SelectItem>
                    );
                  })}
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
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">Attachments</Label>
              {canManageFiles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Files
                </Button>
              )}
            </div>

            {showFileUpload && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <MultiFileUpload
                  onFilesChange={(files) => {
                    setNewAttachments(prev => [...prev, ...files]);
                  }}
                  path="grievances"
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={handleUploadAttachments}
                    disabled={uploading || newAttachments.length === 0}
                  >
                    {uploading ? 'Uploading...' : `Upload ${newAttachments.length} file(s)`}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowFileUpload(false);
                      setNewAttachments([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {grievance.attachments && grievance.attachments.length > 0 ? (
              <div className="space-y-2">
                {grievance.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 hover:underline"
                    >
                      {attachment.fileName}
                    </a>
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                    {canManageFiles && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !showFileUpload && <p className="text-sm text-muted-foreground">No attachments</p>
            )}
          </div>
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
              {grievance.comments.map((comment: any) => {
                const isAdminComment = comment.createdBy.id !== grievance.member?.user?.id;
                const isCommentOwner = comment.createdBy.id === user.id;
                const canEditOrDelete = isCommentOwner || isOwnerOrAdmin;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border ${
                      comment.isInternal
                        ? 'bg-yellow-50 border-yellow-200'
                        : isAdminComment
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
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
                        {isAdminComment && !comment.isInternal && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            Union Admin
                          </Badge>
                        )}
                        {!isAdminComment && !comment.isInternal && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            Member
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {canEditOrDelete && !isEditing && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(comment.id, comment.comment)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          rows={3}
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editingCommentText.trim()}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-muted-foreground">{comment.comment}</p>
                    )}
                  </div>
                );
              })}
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

      {/* Non-Admin Assignment Warning Dialog */}
      <AlertDialog open={showNonAdminWarning} onOpenChange={setShowNonAdminWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Assigning to Non-Admin Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to assign this grievance to a regular member who is not an admin or executive.
              Regular members may not have the authority or tools to properly handle grievances.
              <br /><br />
              Are you sure you want to proceed with this assignment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowNonAdminWarning(false);
              setPendingAssignmentId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmNonAdminAssignment}>
              Assign Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GrievanceStatusBadge } from '@/components/grievances/grievance-status-badge';
import { GrievancePriorityBadge } from '@/components/grievances/grievance-priority-badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import {
  ArrowLeft,
  User,
  Send,
  Paperclip,
  Download,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  Check,
  Upload,
  UserPlus,
  Users,
  Search,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  const [participants, setParticipants] = useState<any[]>(
    (initialGrievance.participants || []).map((p: any) => ({
      id: p.id,
      memberId: p.memberId,
      createdAt: p.createdAt,
      userName: p.userName ?? p.member?.user?.name ?? '',
      userEmail: p.userEmail ?? p.member?.user?.email ?? '',
    }))
  );
  const [selectedGrievorId, setSelectedGrievorId] = useState<string>('');
  const [grievorSearch, setGrievorSearch] = useState('');
  const [showGrievorDropdown, setShowGrievorDropdown] = useState(false);
  const [addingGrievor, setAddingGrievor] = useState(false);
  const [removeGrievorId, setRemoveGrievorId] = useState<number | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<number | null>(null);
  const [showDeleteGrievanceDialog, setShowDeleteGrievanceDialog] = useState(false);
  const [deletingGrievance, setDeletingGrievance] = useState(false);

  const isOwnerOrAdmin = role === 'owner' || role === 'admin';
  const isGrievanceOwner = grievance.memberId === memberId;
  const isAssignedMember = grievance.assignedTo?.id === user.id;
  const isParticipant = participants.some((p: any) => p.memberId === memberId);
  const canManageFiles = isOwnerOrAdmin || isGrievanceOwner || isAssignedMember || isParticipant;

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
        setGrievance((prev: any) => ({
          ...prev,
          status: data.grievance.status,
          resolvedAt: data.grievance.resolvedAt,
          closedAt: data.grievance.closedAt,
        }));
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
    try {
      const response = await fetch(`/api/grievances/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGrievance((prev: any) => ({
          ...prev,
          comments: prev.comments.filter((c: any) => c.id !== commentId),
        }));
        setDeleteCommentId(null);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch(`/api/grievances/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setGrievance((prev: any) => ({
          ...prev,
          attachments: prev.attachments.filter((a: any) => a.id !== attachmentId),
        }));
        setDeleteAttachmentId(null);
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleDeleteGrievance = async () => {
    setDeletingGrievance(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push(`/${union.slug}/grievances`);
        router.refresh();
      } else {
        const data = await response.json();
        console.error('Error deleting grievance:', data.error);
      }
    } catch (error) {
      console.error('Error deleting grievance:', error);
    } finally {
      setDeletingGrievance(false);
    }
  };

  const handleUploadAttachments = async () => {
    if (newAttachments.length === 0) return;

    setUploading(true);
    try {
      for (const attachment of newAttachments) {
        const response = await fetch(`/api/grievances/${grievance.id}/attachment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attachment),
        });

        if (response.ok) {
          const data = await response.json();
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

  const handleAddGrievor = async () => {
    if (!selectedGrievorId) return;
    setAddingGrievor(true);
    try {
      const response = await fetch(`/api/grievances/${grievance.id}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: parseInt(selectedGrievorId) }),
      });
      if (response.ok) {
        const listRes = await fetch(`/api/grievances/${grievance.id}/participants`);
        if (listRes.ok) {
          const data = await listRes.json();
          setParticipants(data.participants);
        }
        setSelectedGrievorId('');
        setGrievorSearch('');
        setShowGrievorDropdown(false);
      } else {
        const data = await response.json();
        console.error('Error adding grievor:', data.error);
      }
    } catch (error) {
      console.error('Error adding grievor:', error);
    } finally {
      setAddingGrievor(false);
    }
  };

  const handleRemoveGrievor = async (participantId: number) => {
    try {
      const response = await fetch(
        `/api/grievances/${grievance.id}/participants?participantId=${participantId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        setParticipants((prev) => prev.filter((p) => p.id !== participantId));
      }
    } catch (error) {
      console.error('Error removing grievor:', error);
    } finally {
      setRemoveGrievorId(null);
    }
  };

  const participantMemberIds = new Set(participants.map((p: any) => p.memberId));
  const availableGrievors = allMembers.filter(
    (m) =>
      m.member.id !== grievance.memberId &&
      !participantMemberIds.has(m.member.id) &&
      (m.member.role === 'member' || m.member.role === 'admin' || m.member.role === 'owner')
  );
  const filteredGrievors = grievorSearch
    ? availableGrievors.filter((m) =>
        m.user.name.toLowerCase().includes(grievorSearch.toLowerCase()) ||
        m.user.email.toLowerCase().includes(grievorSearch.toLowerCase())
      )
    : availableGrievors;
  const selectedGrievor = availableGrievors.find((m) => m.member.id.toString() === selectedGrievorId);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">

      {/* ── TOP HEADER ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b bg-background px-4 py-3">
        <div className="flex items-start justify-between gap-3 max-w-screen-2xl mx-auto">
          <div className="flex items-start gap-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${union.slug}/grievances`)}
              className="flex-shrink-0 mt-0.5 -ml-2 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="min-w-0 pl-1">
              <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                <GrievanceStatusBadge status={grievance.status} />
                {grievance.priority && (
                  <GrievancePriorityBadge priority={grievance.priority} />
                )}
                {grievance.category && (
                  <Badge variant="outline" className="text-xs">{grievance.category}</Badge>
                )}
              </div>
              <h1 className="text-base font-semibold leading-tight">{grievance.title}</h1>
              <p className="text-xs text-muted-foreground">
                #{grievance.id} · Filed {formatDistanceToNow(new Date(grievance.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex gap-2">
            {isGrievanceOwner && grievance.status === 'draft' && (
              <Button size="sm" onClick={handleSubmit}>Submit Grievance</Button>
            )}
            {isOwnerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteGrievanceDialog(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">

        {/* ── CHAT COLUMN ──────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {(!grievance.comments || grievance.comments.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No messages yet. Start the conversation below.</p>
              </div>
            ) : (
              grievance.comments.map((comment: any) => {
                const isAdminComment = comment.createdBy.id !== grievance.member?.user?.id;
                const isCommentOwner = comment.createdBy.id === user.id;
                const canEditOrDelete = isCommentOwner || isOwnerOrAdmin;
                const isEditing = editingCommentId === comment.id;
                const isMine = comment.createdBy.id === user.id;

                return (
                  <div
                    key={comment.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        comment.isInternal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : isMine
                          ? 'bg-primary text-primary-foreground'
                          : isAdminComment
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-muted'
                      }`}
                    >
                      {/* Message header */}
                      <div className={`flex items-center gap-2 mb-1 flex-wrap ${isMine ? 'justify-end' : ''}`}>
                        {!isMine && (
                          <span className={`text-xs font-semibold ${
                            comment.isInternal ? 'text-yellow-900' : isAdminComment ? 'text-blue-900' : ''
                          }`}>
                            {comment.createdBy.name}
                          </span>
                        )}
                        {comment.isInternal && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-yellow-100 text-yellow-800 border-yellow-300 gap-0.5">
                            <Lock className="h-2.5 w-2.5" />
                            Internal
                          </Badge>
                        )}
                        {!comment.isInternal && isAdminComment && !isMine && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-100 text-blue-800 border-blue-200">
                            Admin
                          </Badge>
                        )}
                        <span className={`text-[11px] ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                        {canEditOrDelete && !isEditing && (
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditComment(comment.id, comment.comment)}
                              className={`h-5 w-5 p-0 ${
                                isMine
                                  ? 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCommentId(comment.id)}
                              className={`h-5 w-5 p-0 ${
                                isMine
                                  ? 'text-primary-foreground/60 hover:text-red-300 hover:bg-primary-foreground/10'
                                  : 'text-muted-foreground hover:text-red-600'
                              }`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Message content */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            rows={3}
                            className="w-full bg-background text-foreground text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editingCommentText.trim()}
                              className="h-7 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 text-xs">
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm whitespace-pre-wrap ${isMine ? 'text-primary-foreground' : ''}`}>
                          {comment.comment}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ── INPUT BAR ──────────────────────────────────────────── */}
          <div className="flex-shrink-0 border-t bg-background px-4 py-3">
            {isOwnerOrAdmin && (
              <div className="flex items-center gap-2 mb-2">
                <Switch
                  id="internal"
                  checked={isInternalNote}
                  onCheckedChange={setIsInternalNote}
                  className="scale-90"
                />
                <Label htmlFor="internal" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Internal note (visible to admins only)
                </Label>
              </div>
            )}
            <form onSubmit={handleAddComment} className="flex gap-2 items-end">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newComment.trim()) handleAddComment(e as any);
                  }
                }}
                placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                rows={2}
                className={`flex-1 resize-none text-sm ${
                  isInternalNote ? 'bg-yellow-50 border-yellow-300 focus-visible:ring-yellow-400' : ''
                }`}
              />
              <Button
                type="submit"
                size="icon"
                className="flex-shrink-0 self-end h-[4.5rem] w-10 rounded-xl"
                disabled={loading || !newComment.trim()}
              >
                {loading ? (
                  <span className="text-xs">…</span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* ── SIDEBAR ──────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-72 lg:w-80 flex-shrink-0 border-l overflow-y-auto">
          <div className="p-4 space-y-5">

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm whitespace-pre-wrap text-foreground/80 leading-relaxed">
                {grievance.description}
              </p>
            </div>

            {/* Filed by (admin only) */}
            {isOwnerOrAdmin && grievance.member && (
              <div className="border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Filed By
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{grievance.member.user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{grievance.member.user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Grievors — admin editable */}
            {isOwnerOrAdmin && (
              <div className="border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Grievors
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Members added here can view this grievance.
                </p>

                {participants.length > 0 ? (
                  <div className="space-y-1.5 mb-3">
                    {participants.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50 text-sm"
                      >
                        <span className="truncate">{p.userName}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveGrievorId(p.id)}
                          className="h-5 w-5 p-0 flex-shrink-0 text-muted-foreground hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mb-3">No grievors added yet.</p>
                )}

                {availableGrievors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        value={grievorSearch}
                        onChange={(e) => {
                          setGrievorSearch(e.target.value);
                          setShowGrievorDropdown(true);
                          if (!e.target.value) setSelectedGrievorId('');
                        }}
                        onFocus={() => setShowGrievorDropdown(true)}
                        onBlur={() => setTimeout(() => setShowGrievorDropdown(false), 150)}
                        placeholder={selectedGrievor ? selectedGrievor.user.name : 'Search members…'}
                        className="pl-8 h-8 text-xs"
                      />
                      {showGrievorDropdown && filteredGrievors.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-36 overflow-y-auto">
                          {filteredGrievors.map((m) => (
                            <button
                              key={m.member.id}
                              type="button"
                              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-muted flex flex-col"
                              onMouseDown={() => {
                                setSelectedGrievorId(m.member.id.toString());
                                setGrievorSearch('');
                                setShowGrievorDropdown(false);
                              }}
                            >
                              <span className="font-medium">
                                {m.user.name}
                                {(m.member.role === 'admin' || m.member.role === 'owner') && (
                                  <span className="ml-1 font-normal text-muted-foreground">(Admin)</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">{m.user.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {showGrievorDropdown && grievorSearch && filteredGrievors.length === 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                          No members found
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddGrievor}
                      disabled={!selectedGrievorId || addingGrievor}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Grievors — member read-only */}
            {!isOwnerOrAdmin && participants.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Grievors
                </h3>
                <div className="space-y-1.5">
                  {participants.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 text-sm"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{p.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> Attachments
                </h3>
                {canManageFiles && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="h-6 px-2 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                )}
              </div>

              {showFileUpload && (
                <div className="mb-3 p-3 border rounded-lg bg-muted/30">
                  <MultiFileUpload
                    onFilesChange={(files) => {
                      setNewAttachments(prev => [...prev, ...files]);
                    }}
                    path="grievances"
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      onClick={handleUploadAttachments}
                      disabled={uploading || newAttachments.length === 0}
                      className="h-7 text-xs"
                    >
                      {uploading ? 'Uploading…' : `Upload ${newAttachments.length} file(s)`}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowFileUpload(false);
                        setNewAttachments([]);
                      }}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {grievance.attachments && grievance.attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {grievance.attachments.map((attachment: any) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50 group"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs truncate hover:underline"
                      >
                        {attachment.fileName}
                      </a>
                      <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </a>
                      {canManageFiles && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteAttachmentId(attachment.id)}
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !showFileUpload && <p className="text-xs text-muted-foreground">No attachments</p>
              )}
            </div>

            {/* Admin controls */}
            {isOwnerOrAdmin && (
              <>
                {/* Assignment */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Assigned To
                  </h3>
                  <Select
                    value={grievance.assignedTo?.id.toString() || 'unassigned'}
                    onValueChange={handleAssignmentChange}
                    disabled={assignLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign to someone…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {allMembers.map((member) => {
                        const isAdminMember = member.member.role === 'owner' || member.member.role === 'admin';
                        return (
                          <SelectItem key={member.user.id} value={member.user.id.toString()}>
                            {member.user.name} {!isAdminMember && '(Member)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Status
                  </h3>
                  <Select
                    value={grievance.status}
                    onValueChange={handleStatusChange}
                    disabled={statusLoading}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GrievanceStatus.SUBMITTED}>Submitted</SelectItem>
                      <SelectItem value={GrievanceStatus.ASSIGNED}>Assigned</SelectItem>
                      <SelectItem value={GrievanceStatus.UNDER_REVIEW}>Under Review</SelectItem>
                      <SelectItem value={GrievanceStatus.AWAITING_RESPONSE}>Awaiting Response</SelectItem>
                      <SelectItem value={GrievanceStatus.RESOLVED}>Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── DIALOGS ──────────────────────────────────────────────────── */}

      {/* Delete Comment */}
      <AlertDialog open={deleteCommentId !== null} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Attachment */}
      <AlertDialog open={deleteAttachmentId !== null} onOpenChange={(open) => !open && setDeleteAttachmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttachmentId && handleDeleteAttachment(deleteAttachmentId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Non-Admin Assignment Warning */}
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

      {/* Delete Grievance */}
      <AlertDialog open={showDeleteGrievanceDialog} onOpenChange={setShowDeleteGrievanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Grievance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this grievance? This will also delete all comments and attachments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGrievance}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGrievance}
              disabled={deletingGrievance}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingGrievance ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Grievor */}
      <AlertDialog open={removeGrievorId !== null} onOpenChange={(open) => !open && setRemoveGrievorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Grievor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this grievor? They will no longer be able to see this grievance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeGrievorId && handleRemoveGrievor(removeGrievorId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

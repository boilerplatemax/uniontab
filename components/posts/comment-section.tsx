'use client';

import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, Pencil, Trash2, Loader2 } from 'lucide-react';

interface CommentUser {
  id: number;
  name: string | null;
  profilePhotoUrl: string | null;
}

interface Comment {
  id: number;
  postId: number;
  userId?: number;
  content?: string;
  isEdited?: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  isDeleted: boolean;
  user?: CommentUser;
}

interface CommentSectionProps {
  postId: number;
  commentsEnabled: boolean;
  postCommentsEnabled: boolean;
  currentUserId: number | null;
  isApprovedMember: boolean;
  isOwnerOrAdmin: boolean;
  unionSlug: string;
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function linkifyText(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function CommentSection({
  postId,
  commentsEnabled,
  postCommentsEnabled,
  currentUserId,
  isApprovedMember,
  isOwnerOrAdmin,
  unionSlug,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/comments?postId=${postId}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch {
      console.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (commentsEnabled && postCommentsEnabled) {
      fetchComments();
    } else {
      setLoading(false);
    }
  }, [commentsEnabled, postCommentsEnabled, fetchComments]);

  if (!commentsEnabled || !postCommentsEnabled) {
    return null;
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/posts/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: newComment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: number) => {
    if (!editContent.trim() || editSubmitting) return;
    setEditSubmitting(true);

    try {
      const res = await fetch(`/api/posts/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to edit comment');
      }

      const data = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: data.comment.content, isEdited: true, updatedAt: data.comment.updatedAt }
            : c
        )
      );
      setEditingId(null);
      setEditContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit comment');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      const res = await fetch(`/api/posts/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, isDeleted: true, deletedAt: new Date().toISOString(), content: undefined, user: undefined }
            : c
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const activeCommentCount = comments.filter((c) => !c.isDeleted).length;

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        Comments {activeCommentCount > 0 && `(${activeCommentCount})`}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No comments yet. {isApprovedMember ? 'Be the first to comment!' : ''}
            </p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id}>
                  {comment.isDeleted ? (
                    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400 italic">Comment removed</p>
                    </div>
                  ) : editingId === comment.id ? (
                    /* Edit mode */
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                        {comment.user?.profilePhotoUrl && (
                          <AvatarImage src={comment.user.profilePhotoUrl} alt={comment.user?.name || ''} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getInitials(comment.user?.name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] text-sm"
                          maxLength={2000}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(comment.id)}
                            disabled={editSubmitting || !editContent.trim()}
                          >
                            {editSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                          <span className="text-xs text-gray-400 ml-auto">
                            {editContent.length}/2000
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex gap-3 group">
                      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
                        {comment.user?.profilePhotoUrl && (
                          <AvatarImage src={comment.user.profilePhotoUrl} alt={comment.user?.name || ''} />
                        )}
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                          {getInitials(comment.user?.name || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">
                            {comment.user?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                          {comment.isEdited && (
                            <span className="text-xs text-gray-400 italic">(edited)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
                          {linkifyText(comment.content || '')}
                        </div>
                        {/* Action buttons */}
                        {currentUserId && (
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {currentUserId === comment.userId && (
                              <button
                                onClick={() => startEdit(comment)}
                                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                            )}
                            {(currentUserId === comment.userId || isOwnerOrAdmin) && (
                              <button
                                onClick={() => handleDelete(comment.id)}
                                className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* New comment form */}
          {currentUserId && isApprovedMember ? (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xs font-medium text-blue-700">You</span>
              </div>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] text-sm"
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSubmit();
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {newComment.length}/2000 · Ctrl+Enter to submit
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          ) : currentUserId && !isApprovedMember ? (
            <p className="text-sm text-gray-500 py-2">
              Your membership must be approved before you can comment.
            </p>
          ) : (
            <p className="text-sm text-gray-500 py-2">
              <a href={`/${unionSlug}/sign-in`} className="text-blue-600 hover:underline">
                Sign in
              </a>{' '}
              to leave a comment.
            </p>
          )}
        </>
      )}
    </div>
  );
}

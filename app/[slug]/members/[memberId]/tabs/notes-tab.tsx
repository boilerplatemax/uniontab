'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextContent } from '@/components/ui/rich-text-content';
import {
  Loader2,
  Plus,
  StickyNote,
  Trash2,
  Edit,
  AlertTriangle,
  Award,
  MessageSquare,
  Users,
} from 'lucide-react';
import type { Member, MemberNote } from '@/lib/db/schema';

interface MemberData {
  member: Member;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface NoteWithCreator {
  note: MemberNote;
  createdBy: {
    id: number;
    name: string | null;
  } | null;
}

interface NotesTabProps {
  member: MemberData;
  notes: NoteWithCreator[];
  unionId: number;
  currentUserId: number;
  onUpdate: () => void;
}

const NOTE_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
  { value: 'commendation', label: 'Commendation', icon: Award, color: 'bg-green-100 text-green-800' },
  { value: 'meeting', label: 'Meeting Note', icon: Users, color: 'bg-blue-100 text-blue-800' },
];

export function NotesTab({
  member,
  notes,
  unionId,
  currentUserId,
  onUpdate,
}: NotesTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<MemberNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    content: '',
    noteType: 'general',
  });

  const resetForm = () => {
    setFormData({
      content: '',
      noteType: 'general',
    });
    setEditingNote(null);
  };

  const openEditDialog = (note: MemberNote) => {
    setEditingNote(note);
    setFormData({
      content: note.content,
      noteType: note.noteType || 'general',
    });
    setShowAddDialog(true);
  };

  const getNoteTypeInfo = (type: string | null) => {
    return NOTE_TYPES.find((t) => t.value === type) || NOTE_TYPES[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      setError('Please enter note content');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/members/notes', {
        method: editingNote ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingNote && { noteId: editingNote.id }),
          memberId: member.member.id,
          unionId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save note');
      }

      setShowAddDialog(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setDeleteLoading(noteId);
    try {
      const response = await fetch('/api/members/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, unionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      onUpdate();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Sort notes by date, most recent first
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.note.createdAt).getTime() - new Date(a.note.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Admin Notes</h2>
          <p className="text-sm text-gray-500 mt-1">
            These notes are only visible to admins and owners.
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>

      {sortedNotes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-4">
              Add administrative notes about this member. Notes are only visible to admins and owners.
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedNotes.map((item) => {
            const typeInfo = getNoteTypeInfo(item.note.noteType);
            const TypeIcon = typeInfo.icon;
            return (
              <Card key={item.note.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeInfo.color.split(' ')[0]}`}>
                      <TypeIcon className={`h-5 w-5 ${typeInfo.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(item.note.createdAt).toLocaleString()}
                        </span>
                        {item.createdBy?.name && (
                          <span className="text-xs text-gray-500">
                            by {item.createdBy.name}
                          </span>
                        )}
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <RichTextContent content={item.note.content} />
                      </div>
                      {item.note.updatedAt && item.note.updatedAt > item.note.createdAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Edited: {new Date(item.note.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item.note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.note.id)}
                        disabled={deleteLoading === item.note.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleteLoading === item.note.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="noteType">Note Type</Label>
              <Select
                value={formData.noteType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, noteType: value }))
                }
              >
                <SelectTrigger id="noteType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="content">Note Content *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData((prev) => ({ ...prev, content }))}
                placeholder="Enter note content..."
                className="min-h-[200px]"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-900">
              This note will only be visible to admins and owners.
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingNote ? (
                  'Save Changes'
                ) : (
                  'Add Note'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

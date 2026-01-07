'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Mail, Phone, User, Loader2 } from 'lucide-react';
import { ExecutiveDialog } from './executive-dialog';
import type { UnionExecutive } from '@/lib/db/schema';

interface ExecutiveListProps {
  unionId: number;
  executives: UnionExecutive[];
  isOwner: boolean;
  onExecutivesChange: () => void;
}

export function ExecutiveList({
  unionId,
  executives,
  isOwner,
  onExecutivesChange,
}: ExecutiveListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState<UnionExecutive | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [reorderingId, setReorderingId] = useState<number | null>(null);

  const handleAdd = () => {
    setEditingExecutive(null);
    setDialogOpen(true);
  };

  const handleEdit = (exec: UnionExecutive) => {
    setEditingExecutive(exec);
    setDialogOpen(true);
  };

  const handleDelete = async (execId: number) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    setDeletingId(execId);
    try {
      const response = await fetch('/api/executives/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executiveId: execId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete executive');
      }

      onExecutivesChange();
    } catch (error) {
      console.error('Error deleting executive:', error);
      alert('Failed to remove team member');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMoveUp = async (execId: number) => {
    const currentIndex = executives.findIndex(e => e.id === execId);
    if (currentIndex <= 0) return; // Already at top

    setReorderingId(execId);
    try {
      // Swap with the executive above
      const newOrder = [...executives];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];

      await fetch('/api/executives/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          executiveIds: newOrder.map(e => e.id),
        }),
      });
      onExecutivesChange();
    } catch (error) {
      console.error('Error reordering executives:', error);
    } finally {
      setReorderingId(null);
    }
  };

  const handleMoveDown = async (execId: number) => {
    const currentIndex = executives.findIndex(e => e.id === execId);
    if (currentIndex >= executives.length - 1) return; // Already at bottom

    setReorderingId(execId);
    try {
      // Swap with the executive below
      const newOrder = [...executives];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

      await fetch('/api/executives/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          executiveIds: newOrder.map(e => e.id),
        }),
      });
      onExecutivesChange();
    } catch (error) {
      console.error('Error reordering executives:', error);
    } finally {
      setReorderingId(null);
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingExecutive(null);
    onExecutivesChange();
  };

  if (executives.length === 0 && !isOwner) {
    return (
      <p className="text-gray-500 text-center py-6">
        Leadership team information coming soon.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      )}

      {executives.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          No team members added yet. Click &quot;Add Team Member&quot; to get started.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {executives.map((exec, index) => (
            <Card
              key={exec.id}
              className={`p-4 relative transition-all ${reorderingId === exec.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Reorder Buttons - Only for owners */}
                {isOwner && (
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(exec.id)}
                      disabled={index === 0 || reorderingId !== null}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      title="Move up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(exec.id)}
                      disabled={index === executives.length - 1 || reorderingId !== null}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      title="Move down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Photo */}
                <div className="flex-shrink-0">
                  {exec.photoUrl ? (
                    <img
                      src={exec.photoUrl}
                      alt={exec.name}
                      className="w-16 h-16 rounded-full object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">
                    {exec.name}
                  </h4>
                  <p className="text-sm text-blue-600 truncate">
                    {exec.title}
                  </p>

                  <div className="mt-2 space-y-1">
                    {exec.email && (
                      <a
                        href={`mailto:${exec.email}`}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{exec.email}</span>
                      </a>
                    )}
                    {exec.phone && (
                      <a
                        href={`tel:${exec.phone}`}
                        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{exec.phone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isOwner && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exec)}
                      className="h-8 w-8 p-0"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exec.id)}
                      disabled={deletingId === exec.id}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      {deletingId === exec.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ExecutiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        unionId={unionId}
        executive={editingExecutive}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}

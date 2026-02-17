'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EditElectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  election: any;
  onSuccess: () => void;
}

export function EditElectionDialog({ open, onOpenChange, election, onSuccess }: EditElectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [allowRevotes, setAllowRevotes] = useState(false);
  const [resultsVisibility, setResultsVisibility] = useState<'hidden' | 'members' | 'public'>('hidden');
  const [status, setStatus] = useState<'draft' | 'active' | 'closed'>('draft');

  useEffect(() => {
    if (election && open) {
      setTitle(election.title || '');
      setDescription(election.description || '');
      setTimezone(election.timezone || 'UTC');
      setAllowRevotes(election.allowRevotes || false);
      setResultsVisibility(election.resultsVisibility || 'hidden');
      setStatus(election.status || 'draft');

      // Convert ISO dates to datetime-local format
      if (election.openTime) {
        const d = new Date(election.openTime);
        setOpenTime(toLocalDatetimeString(d));
      }
      if (election.closeTime) {
        const d = new Date(election.closeTime);
        setCloseTime(toLocalDatetimeString(d));
      }

      setError('');
    }
  }, [election, open]);

  const toLocalDatetimeString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!title || !openTime || !closeTime) {
        throw new Error('Please fill in all required fields');
      }

      const openTimeISO = new Date(openTime).toISOString();
      const closeTimeISO = new Date(closeTime).toISOString();

      const response = await fetch(`/api/elections/${election.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          openTime: openTimeISO,
          closeTime: closeTimeISO,
          timezone,
          allowRevotes,
          resultsVisibility,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update election');
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Election</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Election Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Board of Directors Election 2025"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this election..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-openTime">Opening Date & Time *</Label>
                <Input
                  id="edit-openTime"
                  type="datetime-local"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  step="900"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-closeTime">Closing Date & Time *</Label>
                <Input
                  id="edit-closeTime"
                  type="datetime-local"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  step="900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-timezone">Timezone</Label>
                <select
                  id="edit-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-resultsVisibility">Results Visibility</Label>
                <select
                  id="edit-resultsVisibility"
                  value={resultsVisibility}
                  onChange={(e) => setResultsVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hidden">Hidden (Admin Only)</option>
                  <option value="members">Members Only</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={allowRevotes}
                    onChange={(e) => setAllowRevotes(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Allow members to change their vote</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, Users, CheckCircle } from 'lucide-react';

interface SendInvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: number;
  meetingTitle: string;
  unionId: number;
  participantMode?: string;
}

export function SendInvitesDialog({ open, onOpenChange, meetingId, meetingTitle, unionId, participantMode }: SendInvitesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientFilter, setRecipientFilter] = useState('all');
  const [existingInvites, setExistingInvites] = useState<number>(0);
  const [participantCount, setParticipantCount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      fetchExistingInvites();
      if (participantMode === 'selected') {
        fetchParticipantCount();
      }
    }
  }, [open, meetingId, participantMode]);

  const fetchExistingInvites = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/invites`);
      const data = await response.json();
      if (data.success) {
        setExistingInvites(data.invites.length);
      }
    } catch (err) {
      console.error('Failed to fetch existing invites:', err);
    }
  };

  const fetchParticipantCount = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}/participants`);
      const data = await response.json();
      if (data.success) {
        setParticipantCount(data.participants.length);
      }
    } catch (err) {
      console.error('Failed to fetch participant count:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientFilter }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invites');
      }

      setSuccess(data.message);
      fetchExistingInvites();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Meeting Invites
          </DialogTitle>
          <DialogDescription>
            Send email invitations for: <strong>{meetingTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          {existingInvites > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm">
              {existingInvites} invite(s) already sent. New invites will only be sent to members who haven&apos;t received one.
            </div>
          )}

          {participantMode === 'selected' ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  This meeting is set to <strong>selected participants only</strong>.
                  {participantCount > 0
                    ? ` ${participantCount} member${participantCount !== 1 ? 's' : ''} will receive invites.`
                    : ' No participants have been selected yet.'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                To change who receives invites, edit the meeting and modify the participant selection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Who would you like to invite?</Label>
              <RadioGroup value={recipientFilter} onValueChange={setRecipientFilter}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="cursor-pointer">
                    <span className="font-medium">All Approved Members</span>
                    <p className="text-sm text-gray-500">Send to everyone in the union</p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              <Mail className="h-4 w-4" />
              {loading ? 'Sending...' : 'Send Invites'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

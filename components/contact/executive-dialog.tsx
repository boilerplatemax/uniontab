'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { FileUpload } from '@/components/ui/file-upload';
import type { UnionExecutive } from '@/lib/db/schema';

interface ExecutiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  executive: UnionExecutive | null;
  onSuccess: () => void;
}

export function ExecutiveDialog({
  open,
  onOpenChange,
  unionId,
  executive,
  onSuccess,
}: ExecutiveDialogProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!executive;

  useEffect(() => {
    if (open && executive) {
      setName(executive.name);
      setTitle(executive.title);
      setEmail(executive.email || '');
      setPhone(executive.phone || '');
      setPhotoUrl(executive.photoUrl || '');
    } else if (open && !executive) {
      // Reset form for new executive
      setName('');
      setTitle('');
      setEmail('');
      setPhone('');
      setPhotoUrl('');
    }
    setError(null);
  }, [open, executive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !title.trim()) {
      setError('Name and title are required');
      return;
    }

    setSaving(true);

    try {
      const endpoint = isEditing
        ? '/api/executives/update'
        : '/api/executives/create';

      const body = isEditing
        ? {
            executiveId: executive.id,
            name: name.trim(),
            title: title.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            photoUrl: photoUrl || null,
          }
        : {
            unionId,
            name: name.trim(),
            title: title.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            photoUrl: photoUrl || null,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save executive');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelect = (file: File | null, url?: string) => {
    setPhotoUrl(url || '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this team member\'s information.'
              : 'Add a new member to your leadership team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="execName">Name *</Label>
            <Input
              id="execName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="execTitle">Title / Position *</Label>
            <Input
              id="execTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="President"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="execEmail">Email Address</Label>
            <Input
              id="execEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@union.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="execPhone">Phone Number</Label>
            <Input
              id="execPhone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <FileUpload
            onFileSelect={handlePhotoSelect}
            accept="image/*"
            maxSize={5}
            currentUrl={photoUrl}
            label="Profile Photo"
            hint="Upload a photo (optional)"
            bucket="union-files"
            path={`executives/${unionId}`}
            recommendedDimensions={{ width: 200, height: 200 }}
            smartCrop
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { Loader2 } from 'lucide-react';
import { GrievancePriority } from '@/lib/db/schema';

interface CreateGrievanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  unionSlug: string;
  onSuccess: () => void;
  categories?: Array<{ id: number; name: string }>;
}

interface GrievanceAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function CreateGrievanceDialog({
  open,
  onOpenChange,
  unionId,
  unionSlug,
  onSuccess,
  categories = [],
}: CreateGrievanceDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState(GrievancePriority.MEDIUM);
  const [attachments, setAttachments] = useState<GrievanceAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  const handleSubmit = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsDraft(saveAsDraft);

    try {
      const response = await fetch('/api/grievances/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          title,
          description,
          category: category || null,
          priority,
          status: saveAsDraft ? 'draft' : 'submitted',
          attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create grievance');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority(GrievancePriority.MEDIUM);
      setAttachments([]);

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsDraft(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>File a New Grievance</DialogTitle>
          <DialogDescription>
            Provide details about your workplace concern or issue. You can save as a draft or submit it for review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title">Grievance Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                required
                maxLength={255}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of your grievance, including dates, times, locations, and people involved..."
                required
                rows={6}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workplace">Workplace Issue</SelectItem>
                    <SelectItem value="disciplinary">Disciplinary Action</SelectItem>
                    <SelectItem value="contract">Contract Violation</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="safety">Safety Concern</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GrievancePriority.LOW}>Low</SelectItem>
                    <SelectItem value={GrievancePriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={GrievancePriority.HIGH}>High</SelectItem>
                    <SelectItem value={GrievancePriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Supporting Documents</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Upload any relevant documents, emails, photos, or other evidence
              </p>
              <MultiFileUpload
                unionSlug={unionSlug}
                folder="grievances"
                onFilesUploaded={(files) => {
                  setAttachments(files.map(f => ({
                    fileName: f.name,
                    fileUrl: f.url,
                    fileType: f.type,
                    fileSize: f.size,
                  })));
                }}
                maxFiles={10}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading || !title || !description}
            >
              {loading && isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Draft...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="submit"
              disabled={loading || !title || !description}
            >
              {loading && !isDraft ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Grievance'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

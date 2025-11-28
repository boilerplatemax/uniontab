'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  unionSlug: string;
  onSuccess: () => void;
}

export function UploadFileDialog({
  open,
  onOpenChange,
  unionId,
  unionSlug,
  onSuccess,
}: UploadFileDialogProps) {
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fileSizeBytes = parseInt(fileSize) * 1024 * 1024; // Convert MB to bytes

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          name: `${unionSlug}/${Date.now()}_${fileName}`,
          originalName: fileName,
          fileUrl,
          fileType: fileType || 'application/octet-stream',
          fileSize: fileSizeBytes,
          isPrivate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      // Reset form
      setFileUrl('');
      setFileName('');
      setFileType('');
      setFileSize('');
      setIsPrivate(false);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                📋 How to upload files to Supabase Storage:
              </p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Go to your Supabase project dashboard</li>
                <li>Navigate to Storage → union-files bucket</li>
                <li>Upload your file and copy the public URL</li>
                <li>Paste the URL below</li>
              </ol>
            </div>

            <div>
              <Label htmlFor="fileName">File Name *</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf"
                required
              />
            </div>

            <div>
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://your-project.supabase.co/storage/..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fileType">File Type</Label>
                <Input
                  id="fileType"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  placeholder="application/pdf"
                />
              </div>

              <div>
                <Label htmlFor="fileSize">File Size (MB) *</Label>
                <Input
                  id="fileSize"
                  type="number"
                  step="0.01"
                  value={fileSize}
                  onChange={(e) => setFileSize(e.target.value)}
                  placeholder="2.5"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="isPrivate" className="text-base">
                  Private File
                </Label>
                <p className="text-sm text-gray-600">
                  Only approved members can access this file
                </p>
              </div>
              <Switch
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
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
import { FileUpload } from '@/components/ui/file-upload';
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch existing categories when dialog opens
  useEffect(() => {
    if (open && unionId) {
      fetch('/api/files/categories/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.categories) {
            setCategories(data.categories.map((c: any) => c.name));
          }
        })
        .catch((error) => {
          console.error('Error fetching categories:', error);
        });
    }
  }, [open, unionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadedFile || !fileUrl) {
      setError('Please upload a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          name: `${unionSlug}/${Date.now()}_${fileName || uploadedFile.name}`,
          originalName: fileName || uploadedFile.name,
          fileUrl,
          fileType: uploadedFile.type || 'application/octet-stream',
          fileSize: uploadedFile.size,
          isPrivate,
          category: category || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      // Reset form
      setUploadedFile(null);
      setFileUrl('');
      setFileName('');
      setCategory('');
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
      <DialogContent className="max-w-2xl">
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

            <FileUpload
              onFileSelect={(file, url) => {
                setUploadedFile(file);
                if (url) setFileUrl(url);
                if (file) setFileName(file.name);
              }}
              accept="*"
              maxSize={50}
              label="Select File"
              hint="Click to browse or drag and drop any file"
              bucket="union-files"
              path={`files/${unionSlug}`}
            />

            <div>
              <Label htmlFor="fileName">Display Name (Optional)</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Leave blank to use original filename"
              />
            </div>

            <div>
              <Label htmlFor="category">Category (Optional)</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Bylaws, Contracts, Meeting Minutes"
                list="category-suggestions"
              />
              {categories.length > 0 && (
                <datalist id="category-suggestions">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Group files into categories for better organization
              </p>
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

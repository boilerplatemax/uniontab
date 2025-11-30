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
import { FileUpload } from '@/components/ui/file-upload';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2 } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  onSuccess: () => void;
}

interface PostAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  unionId,
  onSuccess,
}: CreatePostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          title,
          content,
          imageUrl: imageUrl || null,
          isPrivate,
          attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setAttachments([]);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                required
              />
            </div>

            <div>
              <Label>Content *</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your post content..."
              />
            </div>

            <div>
              <FileUpload
                onFileSelect={(file, url) => {
                  if (url) setImageUrl(url);
                }}
                accept="image/*"
                maxSize={10}
                currentUrl={imageUrl}
                label="Post Image (optional)"
                hint="Click to browse or drag and drop an image"
                bucket="union-files"
                path="posts"
                recommendedDimensions={{ width: 1200, height: 800 }}
                autoResize={true}
              />
            </div>

            <div>
              <MultiFileUpload
                onFilesChange={(files) => {
                  setAttachments(prev => [...prev, ...files]);
                }}
                accept="*"
                maxSize={50}
                maxFiles={5}
                bucket="union-files"
                path="post-attachments"
                label="File Attachments (optional)"
                hint="Attach documents, PDFs, or other files to this post"
              />
              <p className="text-xs text-gray-500 mt-2">
                {isPrivate
                  ? 'Files will be accessible only to approved members (private post)'
                  : 'Files will be publicly accessible (public post)'}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="isPrivate" className="text-base">
                  Private Post
                </Label>
                <p className="text-sm text-gray-600">
                  Only approved members can see this post
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
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

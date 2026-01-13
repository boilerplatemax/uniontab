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
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2, X, File as FileIcon, User, Building2 } from 'lucide-react';

interface PostAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  isPrivate: boolean;
  authorType?: string;
  attachments?: PostAttachment[];
}

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  unionName?: string;
  onSuccess: () => void;
}

export function EditPostDialog({
  open,
  onOpenChange,
  post,
  unionName,
  onSuccess,
}: EditPostDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [authorType, setAuthorType] = useState<'user' | 'union'>('union');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setImageUrl(post.imageUrl || '');
      setAttachments(post.attachments || []);
      setIsPrivate(post.isPrivate);
      setAuthorType((post.authorType as 'user' | 'union') || 'union');
    }
  }, [post]);

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!post) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          imageUrl: imageUrl || null,
          isPrivate,
          authorType,
          attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update post');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
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
                  if (file === null) setImageUrl('');
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
              <Label>File Attachments (optional)</Label>

              {/* Display existing attachments */}
              {attachments.length > 0 && (
                <div className="space-y-2 mb-4 mt-2">
                  <p className="text-sm text-gray-600">Current attachments:</p>
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <FileIcon className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAttachment(index)}
                        className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new attachments */}
              <MultiFileUpload
                onFilesChange={(files) => {
                  setAttachments(prev => [...prev, ...files]);
                }}
                accept="*"
                maxSize={50}
                maxFiles={5}
                bucket="union-files"
                path="post-attachments"
                label=""
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

            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <Label className="text-base">Post Author</Label>
                <p className="text-sm text-gray-600">
                  Choose how the author is displayed on this post
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthorType('union')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    authorType === 'union'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{unionName ? unionName.toUpperCase() : 'Union'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthorType('user')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    authorType === 'user'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span className="font-medium">Your Name</span>
                </button>
              </div>
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

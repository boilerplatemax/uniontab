'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { MultiFileUpload } from '@/components/ui/multi-file-upload';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2, Mail, User, Building2 } from 'lucide-react';

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  slug: string;
  unionName?: string;
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
  slug,
  unionName,
  onSuccess,
}: CreatePostDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [authorType, setAuthorType] = useState<'user' | 'union'>('union');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [createdPost, setCreatedPost] = useState<{
    title: string;
    content: string;
    attachments: PostAttachment[];
  } | null>(null);

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
          authorType,
          attachments,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      // Store created post data for sharing
      setCreatedPost({
        title,
        content,
        attachments,
      });

      // Show share confirmation dialog
      setShowShareDialog(true);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareYes = () => {
    if (!createdPost) return;

    // Navigate to mass-email with pre-filled post content
    const params = new URLSearchParams();
    params.set('subject', `New Post: ${createdPost.title}`);
    params.set('content', createdPost.content);

    if (createdPost.attachments.length > 0) {
      params.set('attachments', JSON.stringify(createdPost.attachments));
    }

    router.push(`/${slug}/mass-email?${params.toString()}`);
    handleShareNo();
  };

  const handleShareNo = () => {
    // Reset form and close share dialog
    setTitle('');
    setContent('');
    setImageUrl('');
    setAttachments([]);
    setIsPrivate(false);
    setAuthorType('union');
    setCreatedPost(null);
    setShowShareDialog(false);
    onSuccess();
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] !flex !flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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

          <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
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

    {/* Share Confirmation Dialog */}
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Post Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Would you like to share this post with members via email?
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Selecting "Yes" will open the mass email page with your post content pre-filled, allowing you to send it to your members.
          </p>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleShareNo}
          >
            No, Thanks
          </Button>
          <Button
            onClick={handleShareYes}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Mail className="mr-2 h-4 w-4" />
            Yes, Share via Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

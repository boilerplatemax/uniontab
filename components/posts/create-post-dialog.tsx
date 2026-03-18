'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { RichTextContent } from '@/components/ui/rich-text-content';
import { Loader2, Mail, User, Building2, PenLine } from 'lucide-react';

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
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [authorType, setAuthorType] = useState<'user' | 'union'>('union');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [createdPost, setCreatedPost] = useState<{
    title: string;
    content: string;
    attachments: PostAttachment[];
  } | null>(null);
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null);
  const [appendSignature, setAppendSignature] = useState(false);

  // Fetch user's email signature
  useEffect(() => {
    if (!open) return;
    const fetchSignature = async () => {
      try {
        const response = await fetch(`/api/signature?unionId=${unionId}`);
        if (response.ok) {
          const data = await response.json();
          setSignatureHtml(data.signatureHtml || null);
        }
      } catch (error) {
        console.error('Error fetching signature:', error);
      }
    };
    fetchSignature();
  }, [unionId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Append signature if toggle is on
    let finalContent = content;
    if (appendSignature && signatureHtml) {
      finalContent = `${content}<hr style="margin-top:20px;border:none;border-top:1px solid #e5e7eb"><div>${signatureHtml}</div>`;
    }

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          title,
          content: finalContent,
          imageUrl: imageUrl || null,
          isPrivate,
          commentsEnabled,
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
        content: finalContent,
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
    setCommentsEnabled(true);
    setAuthorType('union');
    setAppendSignature(false);
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

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="commentsEnabled" className="text-base">
                  Allow Comments
                </Label>
                <p className="text-sm text-gray-600">
                  Members can comment on this post
                </p>
              </div>
              <Switch
                id="commentsEnabled"
                checked={commentsEnabled}
                onCheckedChange={setCommentsEnabled}
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

            {/* Email Signature Toggle */}
            {signatureHtml ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PenLine className="h-5 w-5 text-gray-600" />
                    <div>
                      <Label htmlFor="appendSignature" className="text-base">
                        Append Signature
                      </Label>
                      <p className="text-sm text-gray-600">
                        Add your email signature to the end of this post
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="appendSignature"
                    checked={appendSignature}
                    onCheckedChange={setAppendSignature}
                  />
                </div>

                {/* Signature Preview */}
                {appendSignature && signatureHtml && (
                  <div className="border rounded-lg p-4 bg-white">
                    <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Signature Preview</p>
                    <hr className="border-t border-gray-300 my-2" />
                    <RichTextContent content={signatureHtml} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <PenLine className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">No email signature set</p>
                    <p className="text-sm text-gray-500">
                      Create a signature to append to your posts.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/${slug}/profile`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  Create Signature
                </Link>
              </div>
            )}
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

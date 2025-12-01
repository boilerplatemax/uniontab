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
import { LimitedRichTextEditor } from '@/components/ui/limited-rich-text-editor';
import { Loader2, AlertCircle } from 'lucide-react';

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unionId: number;
  initialType?: 'popup' | 'banner';
  onSuccess: () => void;
}

interface AnnouncementAttachment {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  unionId,
  initialType = 'popup',
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const [type, setType] = useState<'popup' | 'banner'>('popup');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set initial type when dialog opens
  useEffect(() => {
    if (open) {
      setType(initialType);
    }
  }, [open, initialType]);

  const contentLength = content.replace(/<[^>]*>/g, '').length; // Strip HTML tags for count

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate banner content length
    if (type === 'banner' && contentLength > 300) {
      setError('Banner content must be 300 characters or less');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/announcements/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unionId,
          type,
          title: type === 'popup' ? title : null,
          content,
          imageUrl: type === 'popup' && imageUrl ? imageUrl : null,
          isPrivate,
          attachments: type === 'popup' ? attachments : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create announcement');
      }

      // Reset form
      setType('popup');
      setTitle('');
      setContent('');
      setImageUrl('');
      setAttachments([]);
      setIsPrivate(true);
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
          <DialogTitle>Create New Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Type Selection */}
            <div>
              <Label>Announcement Type *</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <button
                  type="button"
                  onClick={() => setType('popup')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    type === 'popup'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Popup</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Full modal announcement with title, rich content, images, and attachments
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setType('banner')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    type === 'banner'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Banner</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Top-of-page banner with limited content (300 chars max)
                  </div>
                </button>
              </div>
            </div>

            {/* Title (Popup only) */}
            {type === 'popup' && (
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Important Announcement"
                  required
                />
              </div>
            )}

            {/* Content */}
            <div>
              <Label htmlFor="content">
                Content *
                {type === 'banner' && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({contentLength}/300 characters)
                  </span>
                )}
              </Label>
              {type === 'popup' ? (
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Write your announcement content..."
                />
              ) : (
                <LimitedRichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Short banner message..."
                  maxLength={300}
                />
              )}
            </div>

            {/* Featured Image (Popup only) */}
            {type === 'popup' && (
              <div>
                <Label htmlFor="image">Featured Image (Optional)</Label>
                <FileUpload
                  onFileSelect={(file, url) => {
                    if (url) {
                      setImageUrl(url);
                    } else {
                      setImageUrl('');
                    }
                  }}
                  accept="image/*"
                  maxSize={5}
                  currentUrl={imageUrl}
                  bucket="union-files"
                  path="announcements"
                />
              </div>
            )}

            {/* File Attachments (Popup only) */}
            {type === 'popup' && (
              <div>
                <Label>File Attachments (Optional)</Label>
                <MultiFileUpload
                  unionSlug=""
                  folder="announcement-attachments"
                  onFilesChange={setAttachments}
                  maxFiles={5}
                />
              </div>
            )}

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="isPrivate" className="text-base">
                  Private Announcement
                </Label>
                <p className="text-sm text-gray-600">
                  Only approved members can see this announcement
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
                'Create Announcement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

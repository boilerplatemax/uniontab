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
import type { Announcement, AnnouncementAttachment } from '@/lib/db/schema';

interface AnnouncementWithDetails extends Announcement {
  attachments: AnnouncementAttachment[];
}

interface EditAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: AnnouncementWithDetails | null;
  onSuccess: () => void;
}

interface AnnouncementAttachmentData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
  onSuccess,
}: EditAnnouncementDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<AnnouncementAttachmentData[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title || '');
      setContent(announcement.content || '');
      setImageUrl(announcement.imageUrl || '');
      setIsPrivate(announcement.isPrivate);
      setAttachments(announcement.attachments || []);
    }
  }, [announcement]);

  if (!announcement) return null;

  const contentLength = content.replace(/<[^>]*>/g, '').length;
  const isBanner = announcement.type === 'banner';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate banner content length
    if (isBanner && contentLength > 300) {
      setError('Banner content must be 300 characters or less');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/announcements/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          announcementId: announcement.id,
          title: isBanner ? null : title,
          content,
          imageUrl: !isBanner && imageUrl ? imageUrl : null,
          isPrivate,
          attachments: !isBanner ? attachments : [],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update announcement');
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
          <DialogTitle>Edit {isBanner ? 'Banner' : 'Popup'} Announcement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Title (Popup only) */}
            {!isBanner && (
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
                {isBanner && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({contentLength}/300 characters)
                  </span>
                )}
              </Label>
              {!isBanner ? (
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
            {!isBanner && (
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
            {!isBanner && (
              <div>
                <Label>File Attachments (Optional)</Label>
                <MultiFileUpload
                  unionSlug=""
                  folder="announcement-attachments"
                  onFilesChange={setAttachments}
                  maxFiles={5}
                  initialFiles={attachments}
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

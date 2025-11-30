'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, FileText } from 'lucide-react';
import { RichTextContent } from '@/components/ui/rich-text-content';
import type { Announcement, AnnouncementAttachment } from '@/lib/db/schema';

interface AnnouncementWithAttachments extends Announcement {
  attachments: AnnouncementAttachment[];
}

interface AnnouncementPopupProps {
  announcement: AnnouncementWithAttachments | null;
  onDismiss: (announcementId: number) => void;
}

export function AnnouncementPopup({ announcement, onDismiss }: AnnouncementPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (announcement) {
      setOpen(true);
    }
  }, [announcement]);

  const handleClose = () => {
    if (announcement) {
      onDismiss(announcement.id);
      setOpen(false);
    }
  };

  if (!announcement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-8">{announcement.title}</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Featured Image */}
          {announcement.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={announcement.imageUrl}
                alt={announcement.title || 'Announcement image'}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <RichTextContent content={announcement.content} />
          </div>

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
              <div className="space-y-2">
                {announcement.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.fileUrl}
                    download={attachment.fileName}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="border-t pt-4">
            <Button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Got it, thanks!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

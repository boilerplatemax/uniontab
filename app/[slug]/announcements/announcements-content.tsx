'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, Megaphone, AlertCircle, Loader2 } from 'lucide-react';
import { CreateAnnouncementDialog } from '@/components/announcements/create-announcement-dialog';
import { formatDate } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Union, Announcement, AnnouncementAttachment } from '@/lib/db/schema';

interface AnnouncementWithDetails extends Announcement {
  createdBy: { id: number; name: string };
  attachments: AnnouncementAttachment[];
}

interface AnnouncementsContentProps {
  slug: string;
  union: Union;
  announcements: AnnouncementWithDetails[];
  isOwner: boolean;
}

export function AnnouncementsContent({
  slug,
  union,
  announcements,
  isOwner,
}: AnnouncementsContentProps) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (announcementId: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setDeletingId(announcementId);
    try {
      const response = await fetch('/api/announcements/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (announcementId: number, isActive: boolean) => {
    try {
      const response = await fetch('/api/announcements/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId, isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update announcement');
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('Failed to update announcement');
    }
  };

  const popupAnnouncements = announcements.filter((a) => a.type === 'popup');
  const bannerAnnouncements = announcements.filter((a) => a.type === 'banner');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/${slug}`}
                className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"
              >
                ← Back to {union.publicName || union.name}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Manage Announcements</h1>
              <p className="text-gray-600 mt-1">
                Create and manage popups and banners for your union members
              </p>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Announcement
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="text-blue-900 font-medium">About Announcements:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>Popups:</strong> Full modal announcements with title, rich content, images, and file attachments. Shows once per member on page load.</li>
                  <li><strong>Banners:</strong> Top-of-page banners with limited content (300 chars max, text/bold/links only).</li>
                  <li>Owners can preview announcements but won't see auto-popups to avoid spam.</li>
                  <li>Only one active popup and one active banner will be shown at a time (most recent).</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popup Announcements */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-blue-600" />
            Popup Announcements ({popupAnnouncements.length})
          </h2>
          {popupAnnouncements.length > 0 ? (
            <div className="grid gap-4">
              {popupAnnouncements.map((announcement) => (
                <Card key={announcement.id} className={!announcement.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{announcement.title}</h3>
                          {!announcement.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                          {announcement.isPrivate && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                        <div
                          className="text-gray-600 prose prose-sm max-w-none mb-3"
                          dangerouslySetInnerHTML={{ __html: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : '') }}
                        />
                        <div className="text-sm text-gray-500">
                          Created by {announcement.createdBy.name} • {formatDate(announcement.createdAt)}
                          {announcement.attachments.length > 0 && (
                            <span> • {announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={deletingId === announcement.id}
                          title="Delete"
                        >
                          {deletingId === announcement.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Megaphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No popup announcements yet</h3>
                <p className="text-gray-500 mb-4">Create your first popup announcement to notify members</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Popup
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Banner Announcements */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-blue-600" />
            Banner Announcements ({bannerAnnouncements.length})
          </h2>
          {bannerAnnouncements.length > 0 ? (
            <div className="grid gap-4">
              {bannerAnnouncements.map((announcement) => (
                <Card key={announcement.id} className={!announcement.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {!announcement.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                          {announcement.isPrivate && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Private
                            </span>
                          )}
                        </div>
                        <div
                          className="text-gray-900 mb-3"
                          dangerouslySetInnerHTML={{ __html: announcement.content }}
                        />
                        <div className="text-sm text-gray-500">
                          Created by {announcement.createdBy.name} • {formatDate(announcement.createdAt)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(announcement.id)}
                          disabled={deletingId === announcement.id}
                          title="Delete"
                        >
                          {deletingId === announcement.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banner announcements yet</h3>
                <p className="text-gray-500 mb-4">Create a banner to display at the top of your union page</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateAnnouncementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        unionId={union.id}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

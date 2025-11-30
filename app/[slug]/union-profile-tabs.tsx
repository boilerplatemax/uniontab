'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, FileText, Image, Plus, Edit, Trash2, Loader2, Download, Eye, Calendar, Pin, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from '@/components/posts/create-post-dialog';
import { EditPostDialog } from '@/components/posts/edit-post-dialog';
import { UploadFileDialog } from '@/components/files/upload-file-dialog';
import { EditFileDialog } from '@/components/files/edit-file-dialog';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { EditEventDialog } from '@/components/events/edit-event-dialog';
import { EventsCalendar } from '@/components/events/events-calendar';
import { EventsList } from '@/components/events/events-list';
import { EventDetailsDialog } from '@/components/events/event-details-dialog';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { LikeButton } from '@/components/posts/like-button';
import type { Union, Post, File as FileType, Event, Member } from '@/lib/db/schema';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';

interface UnionProfileTabsProps {
  union: Union;
  posts: (Post & { createdBy: { name: string } })[];
  files: (FileType & { createdBy: { name: string } })[];
  events: (Event & { createdBy: { name: string } })[];
  membership: any;
  isOwner: boolean;
  isApprovedMember: boolean;
  userId?: number | null;
}

export function UnionProfileTabs({
  union,
  posts,
  files,
  events,
  membership,
  isOwner,
  isApprovedMember,
  userId,
}: UnionProfileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'about' | 'posts' | 'files' | 'events' | 'elections') || 'posts';
  const [eventsView, setEventsView] = useState<'calendar' | 'list'>('list');

  const setActiveTab = (tab: 'about' | 'posts' | 'files' | 'events' | 'elections') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'posts') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  };
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [editFileOpen, setEditFileOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post & { createdBy: { name: string } } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType & { createdBy: { name: string } } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event & { createdBy: { name: string } } | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<number | null>(null);

  const handleTogglePin = async (postId: number, isPinned: boolean) => {
    try {
      const response = await fetch('/api/posts/toggle-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, isPinned: !isPinned }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle pin');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to toggle pin');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setDeletingPost(postId);
    try {
      const response = await fetch('/api/posts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setDeletingPost(null);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeletingFile(fileId);
    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  };

  const handleToggleFilePrivacy = async (fileId: number, isPrivate: boolean) => {
    try {
      const response = await fetch('/api/files/toggle-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, isPrivate }),
      });

      if (!response.ok) {
        throw new Error('Failed to update file privacy');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling file privacy:', error);
      alert('Failed to update file privacy');
    }
  };

  const handleEventClick = (event: Event & { createdBy: { name: string } }) => {
    router.push(`/${union.slug}/event/${event.id}`);
  };

  const handleEditEvent = (event: Event & { createdBy: { name: string } }) => {
    setSelectedEvent(event);
    setEditEventOpen(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await fetch('/api/events/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className="border-b bg-white rounded-t-lg">
        <div className="flex gap-2 px-6 pt-2">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'posts'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'about'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'files'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'events'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('elections')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'elections'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Elections
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
          {/* About Tab */}
          {activeTab === 'about' && (
            <>
              {union.about ? (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                    <RichTextContent
                      content={union.about}
                      className="text-gray-700 leading-relaxed"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Welcome to {union.publicName || union.name}
                    </h3>
                    <p className="text-gray-500">More content coming soon...</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <>
              {/* Create Post Button (Admin only) */}
              {isOwner && (
                <div className="flex justify-start">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </div>
              )}

              {/* Posts List */}
              {posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => {
                    // Hide private posts from non-approved members
                    if (post.isPrivate && !isApprovedMember) {
                      return null;
                    }

                    return (
                      <Card key={post.id} className="shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/${union.slug}/post/${post.id}`}>
                                <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                                  {post.title}
                                </h3>
                              </Link>
                              {(post as any).isPinned && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                  <Pin className="h-3 w-3" />
                                  Pinned
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {post.isPrivate && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                              {isOwner && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTogglePin(post.id, (post as any).isPinned || false)}
                                    title={(post as any).isPinned ? 'Unpin post' : 'Pin post'}
                                  >
                                    <Pin className={`h-4 w-4 ${(post as any).isPinned ? 'fill-current' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPost(post);
                                      setEditPostOpen(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeletePost(post.id)}
                                    disabled={deletingPost === post.id}
                                  >
                                    {deletingPost === post.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {post.imageUrl && (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full rounded-lg mb-4 max-h-96 object-cover"
                            />
                          )}
                          <RichTextContent
                            content={post.content}
                            className="mb-4"
                          />
                          <div className="flex items-center justify-between border-t pt-3">
                            <LikeButton
                              postId={post.id}
                              initialLiked={(post as any).isLikedByUser || false}
                              initialCount={(post as any).likeCount || 0}
                              userId={userId || null}
                            />
                            <div className="text-sm text-gray-500">
                              Posted by {post.createdBy.name} •{' '}
                              {formatDate(post.createdAt)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-12 text-center">
                    <Image className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      {isOwner
                        ? 'Create your first post to get started!'
                        : 'Check back later for updates.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <>
              {/* Upload File Button (Admin only) */}
              {isOwner && (
                <div className="flex justify-start">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setUploadFileOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}

              {/* Files List */}
              {files.length > 0 ? (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Files & Documents
                    </h2>
                    <div className="space-y-3">
                      {files.map((file) => {
                        // Hide private files from non-approved members
                        if (file.isPrivate && !isApprovedMember) {
                          return null;
                        }

                        return (
                          <div
                            key={file.id}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border"
                          >
                            <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {file.originalName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Uploaded by {file.createdBy.name} •{' '}
                                {formatDate(file.createdAt)} •{' '}
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {file.isPrivate && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(file.fileUrl, '_blank')}
                                title="Preview/Open"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = file.fileUrl;
                                  a.download = file.originalName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                }}
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {isOwner && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setEditFileOpen(true);
                                    }}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteFile(file.id)}
                                    disabled={deletingFile === file.id}
                                    title="Delete"
                                  >
                                    {deletingFile === file.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No files yet
                    </h3>
                    <p className="text-gray-500">
                      {isOwner
                        ? 'Upload your first file to get started!'
                        : 'Check back later for documents.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <>
              {/* Create Event Button & View Toggle (Admin only) */}
              {isOwner && (
                <div className="flex items-center justify-between">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCreateEventOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant={eventsView === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEventsView('list')}
                    >
                      List
                    </Button>
                    <Button
                      variant={eventsView === 'calendar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEventsView('calendar')}
                    >
                      Calendar
                    </Button>
                  </div>
                </div>
              )}

              {/* Events View */}
              {eventsView === 'calendar' ? (
                <EventsCalendar
                  events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                  onEventClick={handleEventClick}
                />
              ) : (
                <EventsList
                  events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                  isOwner={isOwner}
                  onEventClick={handleEventClick}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
              )}
            </>
          )}

          {/* Elections Tab */}
          {activeTab === 'elections' && (
            <Card className="shadow-sm">
              <CardContent className="p-12 text-center">
                <Vote className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Elections & Voting
                </h3>
                <p className="text-gray-500 mb-6">
                  View and participate in union elections and voting
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => router.push(`/${union.slug}/elections`)}
                >
                  <Vote className="h-4 w-4 mr-2" />
                  Go to Elections
                </Button>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Dialogs */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        unionId={union.id}
        onSuccess={() => router.refresh()}
      />
      <EditPostDialog
        open={editPostOpen}
        onOpenChange={setEditPostOpen}
        post={selectedPost}
        onSuccess={() => router.refresh()}
      />
      <UploadFileDialog
        open={uploadFileOpen}
        onOpenChange={setUploadFileOpen}
        unionId={union.id}
        unionSlug={union.slug}
        onSuccess={() => router.refresh()}
      />
      <EditFileDialog
        open={editFileOpen}
        onOpenChange={setEditFileOpen}
        file={selectedFile}
        onSuccess={() => router.refresh()}
      />
      <CreateEventDialog
        open={createEventOpen}
        onOpenChange={setCreateEventOpen}
        unionId={union.id}
        onSuccess={() => router.refresh()}
      />
      <EventDetailsDialog
        event={selectedEvent}
        open={eventDetailsOpen}
        onOpenChange={setEventDetailsOpen}
        isOwner={isOwner}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />
      <EditEventDialog
        open={editEventOpen}
        onOpenChange={setEditEventOpen}
        event={selectedEvent}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

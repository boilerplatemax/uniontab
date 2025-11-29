'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, FileText, Image, Plus, Edit, Trash2, Loader2, Download, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from '@/components/posts/create-post-dialog';
import { EditPostDialog } from '@/components/posts/edit-post-dialog';
import { UploadFileDialog } from '@/components/files/upload-file-dialog';
import { EditFileDialog } from '@/components/files/edit-file-dialog';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { EventsCalendar } from '@/components/events/events-calendar';
import { EventsList } from '@/components/events/events-list';
import type { Union, Post, File as FileType, Event, Member } from '@/lib/db/schema';
import { useRouter } from 'next/navigation';

interface UnionProfileTabsProps {
  union: Union;
  posts: (Post & { createdBy: { name: string } })[];
  files: (FileType & { createdBy: { name: string } })[];
  events: (Event & { createdBy: { name: string } })[];
  membership: any;
  isOwner: boolean;
  isApprovedMember: boolean;
}

export function UnionProfileTabs({
  union,
  posts,
  files,
  events,
  membership,
  isOwner,
  isApprovedMember,
}: UnionProfileTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'files' | 'events'>('about');
  const [eventsView, setEventsView] = useState<'calendar' | 'list'>('list');
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [editFileOpen, setEditFileOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post & { createdBy: { name: string } } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileType & { createdBy: { name: string } } | null>(null);
  const [deletingPost, setDeletingPost] = useState<number | null>(null);
  const [deletingFile, setDeletingFile] = useState<number | null>(null);

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
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        {/* Left Column - Info Card (visible on all tabs) */}
        <div className="space-y-4">
          {/* Description Card */}
          {union.description && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h2 className="font-semibold text-gray-900 mb-3">Introduction</h2>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {union.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contact Information Card */}
          {(union.email || union.phone || union.address || union.website) && (
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <h2 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h2>
                <div className="space-y-3">
                  {union.email && (
                    <a
                      href={`mailto:${union.email}`}
                      className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <Mail className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <span className="text-gray-900 break-all">{union.email}</span>
                    </a>
                  )}

                  {union.phone && (
                    <a
                      href={`tel:${union.phone}`}
                      className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <Phone className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <span className="text-gray-900">{union.phone}</span>
                    </a>
                  )}

                  {union.address && (
                    <div className="flex items-start gap-3 text-sm p-2">
                      <MapPin className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-900">{union.address}</span>
                    </div>
                  )}

                  {union.website && (
                    <a
                      href={union.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <Globe className="h-5 w-5 text-gray-600 flex-shrink-0" />
                      <span className="text-blue-600 hover:underline break-all">
                        {union.website.replace(/^https?:\/\//, '')}
                      </span>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Tab Content */}
        <div className="space-y-4">
          {/* About Tab */}
          {activeTab === 'about' && (
            <>
              {union.about ? (
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                    <div className="text-gray-700 leading-relaxed space-y-4">
                      {union.about.split('\n').map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
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
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setCreatePostOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  </CardContent>
                </Card>
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
                            <h3 className="text-xl font-semibold text-gray-900">
                              {post.title}
                            </h3>
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
                          <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                            {post.content}
                          </p>
                          <div className="text-sm text-gray-500">
                            Posted by {post.createdBy.name} •{' '}
                            {new Date(post.createdAt).toLocaleDateString()}
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
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => setUploadFileOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  </CardContent>
                </Card>
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
                                {new Date(file.createdAt).toLocaleDateString()} •{' '}
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
                <Card className="shadow-sm">
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              )}

              {/* Events View */}
              {eventsView === 'calendar' ? (
                <EventsCalendar
                  events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                />
              ) : (
                <EventsList
                  events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                  isOwner={isOwner}
                  onDelete={handleDeleteEvent}
                />
              )}
            </>
          )}
        </div>
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
    </div>
  );
}

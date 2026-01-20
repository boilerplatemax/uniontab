'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, FileText, Image, Plus, Edit, Trash2, Loader2, Download, Eye, Calendar, Pin, Vote, Paperclip, LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreatePostDialog } from '@/components/posts/create-post-dialog';
import { EditPostDialog } from '@/components/posts/edit-post-dialog';
import { UploadFileDialog } from '@/components/files/upload-file-dialog';
import { EditFileDialog } from '@/components/files/edit-file-dialog';
import { CategorizedFilesList } from '@/components/files/categorized-files-list';
import { CompactStorageWidget } from '@/components/storage/compact-storage-widget';
import { CreateEventDialog } from '@/components/events/create-event-dialog';
import { EditEventDialog } from '@/components/events/edit-event-dialog';
import { EventsCalendar } from '@/components/events/events-calendar';
import { EventsList } from '@/components/events/events-list';
import { EventDetailsDialog } from '@/components/events/event-details-dialog';
import { ElectionsList } from '@/components/elections/elections-list';
import { ContactTabContent } from '@/components/contact';
import { RichTextContent } from '@/components/ui/rich-text-content';
import { InlineAboutEditor } from '@/components/about/inline-about-editor';
import { LikeButton } from '@/components/posts/like-button';
import { ShareButton } from '@/components/share-button';
import type { Union, Post, File as FileType, Event, Member, PostAttachment } from '@/lib/db/schema';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';

interface UnionProfileTabsProps {
  union: Union;
  posts: (Omit<Post, 'createdBy'> & { createdBy: { name: string }; attachments?: PostAttachment[] })[];
  files: (Omit<FileType, 'createdBy'> & { createdBy: { name: string } })[];
  events: (Omit<Event, 'createdBy'> & { createdBy: { name: string } })[];
  membership: any;
  isOwner: boolean;
  isApprovedMember: boolean;
  userId?: number | null;
  prestigeMode?: boolean;
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
  prestigeMode = false,
}: UnionProfileTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'about' | 'posts' | 'files' | 'events' | 'elections' | 'contact') || 'posts';
  const [eventsView, setEventsView] = useState<'calendar' | 'list'>('list');
  const [postsView, setPostsView] = useState<'column' | 'grid'>('column');

  const setActiveTab = (tab: 'about' | 'posts' | 'files' | 'events' | 'elections' | 'contact') => {
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
  const [selectedPost, setSelectedPost] = useState<Omit<Post, 'createdBy'> & { createdBy: { name: string } } | null>(null);
  const [selectedFile, setSelectedFile] = useState<Omit<FileType, 'createdBy'> & { createdBy: { name: string } } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Omit<Event, 'createdBy'> & { createdBy: { name: string } } | null>(null);
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

  const handleEventClick = (event: Omit<Event, 'createdBy'> & { createdBy: { name: string } }) => {
    router.push(`/${union.slug}/event/${event.id}`);
  };

  const handleEditEvent = (event: Omit<Event, 'createdBy'> & { createdBy: { name: string } }) => {
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


  // Prestige mode styling - Airbnb-inspired rose accent
  const roseAccent = '#E11D48';
  const tabActiveClass = prestigeMode
    ? `border-b-2`
    : 'text-blue-600 border-b-2 border-blue-600';
  const tabInactiveClass = prestigeMode
    ? 'text-gray-500 hover:text-gray-900'
    : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="space-y-4">
      {/* Tabs Navigation */}
      <div className={`border-b ${prestigeMode ? 'border-gray-200 bg-transparent' : 'bg-white'}`}>
        {/* Horizontal scrollable tabs - unified for mobile and desktop */}
        <div className="flex items-center justify-between">
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 pt-2 min-w-max">
              {/* News Tab */}
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'posts' ? tabActiveClass : tabInactiveClass
                }`}
                style={activeTab === 'posts' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
              >
                News
              </button>

              {/* About Tab */}
              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'about' ? tabActiveClass : tabInactiveClass
                }`}
                style={activeTab === 'about' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
              >
                About
              </button>

              {/* Files Tab */}
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'files' ? tabActiveClass : tabInactiveClass
                }`}
                style={activeTab === 'files' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
              >
                Files
              </button>

              {/* Elections Tab (only for approved members) */}
              {isApprovedMember && (
                <button
                  onClick={() => setActiveTab('elections')}
                  className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                    activeTab === 'elections' ? tabActiveClass : tabInactiveClass
                  }`}
                  style={activeTab === 'elections' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
                >
                  Elections
                </button>
              )}

              {/* Events Tab */}
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'events' ? tabActiveClass : tabInactiveClass
                }`}
                style={activeTab === 'events' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
              >
                Events
              </button>

              {/* Contact Tab */}
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'contact' ? tabActiveClass : tabInactiveClass
                }`}
                style={activeTab === 'contact' && prestigeMode ? { borderColor: roseAccent, color: roseAccent } : undefined}
              >
                Contact
              </button>
            </div>
          </div>

          {/* Action buttons - hidden on mobile, shown on desktop */}
          <div className="hidden sm:flex gap-2 items-center pb-2 pr-6 flex-shrink-0">
            {isOwner && (
              <>
                {activeTab === 'posts' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                )}
              </>
            )}

            {/* View toggle for posts (large screens only) */}
            {activeTab === 'posts' && (
              <div className={`hidden lg:flex gap-1 ${isOwner ? 'ml-2 border-l pl-2' : ''}`}>
                <Button
                  variant={postsView === 'column' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsView('column')}
                  title="Column view"
                  className="px-2"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
                <Button
                  variant={postsView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPostsView('grid')}
                  title="Grid view"
                  className="px-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isOwner && (
              <>
                {activeTab === 'files' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setUploadFileOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                )}
                {activeTab === 'events' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setCreateEventOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </>
            )}

            {/* View toggle for events (for all users on desktop) */}
            {activeTab === 'events' && (
              <div className={`flex gap-2 ${isOwner ? 'ml-2 border-l pl-2' : ''}`}>
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
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
          {/* About Tab */}
          {activeTab === 'about' && (
            <InlineAboutEditor union={union} isOwner={isOwner} />
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <>
              {/* Create Post Button (Mobile only) */}
              {isOwner && (
                <div className="flex justify-start sm:hidden">
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
                <div className={postsView === 'grid'
                  ? 'lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 space-y-4 lg:space-y-0'
                  : 'space-y-4'
                }>
                  {posts.map((post) => {
                    // Hide private posts from non-approved members
                    if (post.isPrivate && !isApprovedMember) {
                      return null;
                    }

                    return (
                      <Card key={post.id} className={`shadow-sm hover:shadow-md transition-shadow ${postsView === 'grid' ? 'flex flex-col h-full' : ''}`}>
                        <CardContent className={postsView === 'grid' ? 'p-4 flex flex-col h-full' : 'p-4 sm:p-6'}>
                          {/* Grid view: Image on top */}
                          {postsView === 'grid' && post.imageUrl && (
                            <Link href={`/${union.slug}/post/${post.id}`} className="block -mx-4 -mt-4 mb-4">
                              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-100">
                                <img
                                  src={post.imageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>
                            </Link>
                          )}

                          {/* Header with title and actions */}
                          <div className={`flex items-start justify-between ${postsView === 'grid' ? 'mb-2' : 'mb-4'}`}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Link href={`/${union.slug}/post/${post.id}`} className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors ${postsView === 'grid' ? 'text-base line-clamp-2' : 'text-lg sm:text-xl truncate'}`}>
                                  {post.title}
                                </h3>
                              </Link>
                              {(post as any).isPinned && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                                  <Pin className="h-3 w-3" />
                                  {postsView !== 'grid' && 'Pinned'}
                                </span>
                              )}
                            </div>
                            <div className={`flex items-center gap-2 flex-shrink-0 ml-2 ${postsView === 'grid' ? 'gap-1' : ''}`}>
                              {post.isPrivate && postsView !== 'grid' && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  Private
                                </span>
                              )}
                              {isOwner && postsView !== 'grid' && (
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

                          {/* Content and Image Layout */}
                          {postsView === 'grid' ? (
                            /* Grid view: Compact content */
                            <div className="flex-1">
                              <RichTextContent
                                content={post.content}
                                className="text-sm text-gray-600 line-clamp-3"
                              />
                              <Link href={`/${union.slug}/post/${post.id}`}>
                                <Button variant="link" className="mt-2 px-0 text-blue-600 hover:text-blue-700 text-sm">
                                  Read more →
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            /* Column view: Full content */
                            <div className="mb-4">
                              {/* Mobile: Image first */}
                              {post.imageUrl && (
                                <div className="relative mb-4 sm:hidden rounded-lg overflow-hidden bg-gray-100">
                                  <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {/* Desktop: Text and Image Side by Side */}
                              <div className={post.imageUrl ? "sm:flex sm:gap-6 sm:items-start" : ""}>
                                {/* Content Section - Full width on mobile, left side on desktop */}
                                <div className="flex-1 min-w-0">
                                  <RichTextContent
                                    content={post.content}
                                    className="text-sm sm:text-base line-clamp-6"
                                  />
                                  <Link href={`/${union.slug}/post/${post.id}`}>
                                    <Button variant="link" className="mt-2 px-0 text-blue-600 hover:text-blue-700">
                                      View Full Post →
                                    </Button>
                                  </Link>
                                </div>

                                {/* Image Section - Hidden on mobile, right side on desktop */}
                                {post.imageUrl && (
                                  <div className="hidden sm:block sm:w-80 sm:flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={post.imageUrl}
                                      alt={post.title}
                                      className="w-full h-auto max-h-[250px] object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Post Attachments - hidden in grid view */}
                          {postsView !== 'grid' && post.attachments && post.attachments.length > 0 && (
                            <div className="mb-4 space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Paperclip className="h-4 w-4" />
                                <span>Attachments ({post.attachments.length})</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {post.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
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
                                    <a
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0"
                                    >
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        title="Download"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Grid view: Simple attachments indicator */}
                          {postsView === 'grid' && post.attachments && post.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                              <Paperclip className="h-3 w-3" />
                              <span>{post.attachments.length} attachment{post.attachments.length > 1 ? 's' : ''}</span>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className={`flex ${postsView === 'grid' ? 'flex-col gap-2 mt-auto pt-3 border-t' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4 mt-4'}`}>
                            <div className="flex items-center gap-3">
                              <LikeButton
                                postId={post.id}
                                initialLiked={(post as any).isLikedByUser || false}
                                initialCount={(post as any).likeCount || 0}
                                userId={userId || null}
                              />
                              {postsView !== 'grid' && (
                                <ShareButton
                                  itemType="post"
                                  itemId={post.id}
                                  itemTitle={post.title}
                                  itemUrl={`/${union.slug}/post/${post.id}`}
                                  slug={union.slug}
                                  isOwnerOrAdmin={isOwner}
                                  itemContent={post.content}
                                  itemImageUrl={post.imageUrl || undefined}
                                  itemAttachments={post.attachments}
                                />
                              )}
                            </div>
                            <div className={`text-gray-500 ${postsView === 'grid' ? 'text-xs' : 'text-sm'}`}>
                              {postsView === 'grid' ? formatDate(post.createdAt) : `Posted by ${(post as any).authorType === 'user' ? post.createdBy.name : `${(union.publicName || union.name).toUpperCase()}${union.localNumber ? ` ${union.localNumber}` : ''}`} • ${formatDate(post.createdAt)}`}
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
              {/* Upload File Button (Mobile only) */}
              {isOwner && (
                <div className="flex justify-start sm:hidden">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setUploadFileOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}

              {/* Storage Usage Widget (Owner only) */}
              {isOwner && (
                <CompactStorageWidget unionSlug={union.slug} />
              )}

              {/* Files List */}
              {files.length > 0 ? (
                <CategorizedFilesList
                  files={files}
                  isOwner={isOwner}
                  isApprovedMember={isApprovedMember}
                  onEdit={(file) => {
                    setSelectedFile(file);
                    setEditFileOpen(true);
                  }}
                  onDelete={handleDeleteFile}
                  deletingFile={deletingFile}
                  unionId={union.id}
                  slug={union.slug}
                />
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
              {/* Create Event Button & View Toggle (Mobile only) */}
              {isOwner && (
                <div className="flex items-center justify-between sm:hidden">
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

              {/* View Toggle for non-owners on mobile */}
              {!isOwner && (
                <div className="flex justify-end gap-2 sm:hidden">
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
                  slug={union.slug}
                  themeColor={union.themeColor}
                />
              )}
            </>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <ContactTabContent
              union={union}
              isOwner={isOwner}
            />
          )}

          {/* Elections Tab */}
          {activeTab === 'elections' && isApprovedMember && (
            <ElectionsList
              slug={union.slug}
              unionId={union.id}
              isOwner={isOwner}
            />
          )}
      </div>

      {/* Dialogs */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        unionId={union.id}
        slug={union.slug}
        unionName={union.publicName || union.name}
        onSuccess={() => router.refresh()}
      />
      <EditPostDialog
        open={editPostOpen}
        onOpenChange={setEditPostOpen}
        post={selectedPost}
        unionName={union.publicName || union.name}
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

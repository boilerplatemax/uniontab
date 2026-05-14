'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, FileText, Image, Plus, Edit, Trash2, Loader2, Download, Eye, Calendar, Pin, Vote, Paperclip, LayoutGrid, List, MessageSquare } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/date';
import { useUnionTab } from './union-tab-context';

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
  hideTabNav?: boolean;
  isOwnerOrAdmin?: boolean;
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
  hideTabNav = false,
  isOwnerOrAdmin: isOwnerOrAdminProp,
}: UnionProfileTabsProps) {
  const isOwnerOrAdmin = isOwnerOrAdminProp ?? isOwner;
  const canManageContent = isOwnerOrAdmin;
  const router = useRouter();
  const { activeTab, setActiveTab } = useUnionTab();

  // Redirect elections tab to posts if user is not an approved member
  useEffect(() => {
    if (activeTab === 'elections' && !isApprovedMember) {
      setActiveTab('posts');
    }
  }, [activeTab, isApprovedMember, setActiveTab]);

  const [eventsView, setEventsView] = useState<'calendar' | 'list'>('list');
  // Default to grid view for all modes
  const [postsView, setPostsView] = useState<'column' | 'grid'>('grid');
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
  const [showThumbnails, setShowThumbnails] = useState<boolean>(union.fileThumbnailsEnabled ?? false);

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


  // Prestige mode styling - Rose accent
  const roseAccent = '#E11D48';

  // Prestige tab styling - pill-style navigation
  const getPrestigeTabClass = (isActive: boolean) => {
    if (isActive) {
      return 'bg-rose-600 text-white';
    }
    return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  };

  // Standard tab styling
  const tabActiveClass = prestigeMode
    ? getPrestigeTabClass(true)
    : 'text-blue-600 border-b-2 border-blue-600';
  const tabInactiveClass = prestigeMode
    ? getPrestigeTabClass(false)
    : 'text-gray-600 hover:text-gray-900';

  // Prestige mode tab navigation
  const PrestigeTabNav = () => (
    <div className="mb-8">
      {/* Centered pill-style tabs */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${getPrestigeTabClass(activeTab === 'posts')}`}
          >
            News
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${getPrestigeTabClass(activeTab === 'about')}`}
          >
            About
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${getPrestigeTabClass(activeTab === 'files')}`}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${getPrestigeTabClass(activeTab === 'events')}`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${getPrestigeTabClass(activeTab === 'contact')}`}
          >
            Contact
          </button>
        </div>
      </div>

      {/* Action bar below tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {canManageContent && activeTab === 'posts' && (
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 rounded-full px-5"
            onClick={() => setCreatePostOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        )}

        {canManageContent && activeTab === 'events' && (
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 rounded-full px-5"
            onClick={() => setCreateEventOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        )}

        {activeTab === 'events' && (
          <div className="flex gap-1 bg-white border border-gray-200 rounded-full p-1">
            <button
              onClick={() => setEventsView('list')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${eventsView === 'list' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              List
            </button>
            <button
              onClick={() => setEventsView('calendar')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${eventsView === 'calendar' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Standard tab navigation (non-prestige)
  const StandardTabNav = () => (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 sm:gap-2 px-4 sm:px-6 pt-2 min-w-max">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'posts' ? tabActiveClass : tabInactiveClass
              }`}
            >
              News
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'about' ? tabActiveClass : tabInactiveClass
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'files' ? tabActiveClass : tabInactiveClass
              }`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'events' ? tabActiveClass : tabInactiveClass
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-3 sm:px-4 py-2 font-semibold transition-colors cursor-pointer whitespace-nowrap text-sm sm:text-base ${
                activeTab === 'contact' ? tabActiveClass : tabInactiveClass
              }`}
            >
              Contact
            </button>
          </div>
        </div>

        <div className="hidden sm:flex gap-2 items-center pb-2 pr-6 flex-shrink-0">
          {canManageContent && (
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

          {canManageContent && activeTab === 'events' && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setCreateEventOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}

          {activeTab === 'events' && (
            <div className={`flex gap-2 ${canManageContent ? 'ml-2 border-l pl-2' : ''}`}>
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
  );

  return (
    <div className="space-y-4">
      {/* Tabs Navigation (hidden when nav is merged into top bar) */}
      {!hideTabNav && (prestigeMode ? <PrestigeTabNav /> : <StandardTabNav />)}

      {/* Standalone action bar when tab nav is hidden (buttons + view toggles) */}
      {hideTabNav && (activeTab === 'posts' || activeTab === 'events' || activeTab === 'files') && (
        <div className="flex flex-wrap items-center gap-3">
          {canManageContent && activeTab === 'posts' && (
            <Button
              size="sm"
              className={prestigeMode ? 'bg-rose-600 hover:bg-rose-700 rounded-full px-5' : 'bg-blue-600 hover:bg-blue-700'}
              onClick={() => setCreatePostOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          )}
          {canManageContent && activeTab === 'events' && (
            <Button
              size="sm"
              className={prestigeMode ? 'bg-rose-600 hover:bg-rose-700 rounded-full px-5' : 'bg-blue-600 hover:bg-blue-700'}
              onClick={() => setCreateEventOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
          {activeTab === 'events' && (
            <div className={`flex gap-1 ${prestigeMode ? 'bg-white border border-gray-200 rounded-full p-1' : ''}`}>
              <Button
                variant={eventsView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventsView('list')}
                className={prestigeMode ? `px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${eventsView === 'list' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-700'}` : ''}
              >
                List
              </Button>
              <Button
                variant={eventsView === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEventsView('calendar')}
                className={prestigeMode ? `px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${eventsView === 'calendar' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-700'}` : ''}
              >
                Calendar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-4">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className={prestigeMode ? 'bg-gradient-to-br from-violet-50/40 via-white to-rose-50/30 rounded-2xl p-6 sm:p-8' : ''}>
              <InlineAboutEditor union={union} isOwner={isOwner} />
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <>
              {/* Create Post Button (Mobile only - non-prestige, only when tab nav is visible) */}
              {!hideTabNav && !prestigeMode && canManageContent && (
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
                prestigeMode ? (
                  /* Prestige Mode: Uniform grid */
                  <div className={postsView === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'space-y-6 max-w-3xl mx-auto'
                  }>
                    {posts.map((post) => {
                      if (post.isPrivate && !isApprovedMember) return null;

                      return postsView === 'grid' ? (
                        /* Prestige Grid Card - uniform height cards */
                        <article key={post.id} className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow">
                          <Link href={`/${union.slug}/post/${post.id}`} className="flex flex-col flex-1">
                            {/* Fixed-height image area */}
                            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-rose-50 to-orange-50 flex-shrink-0">
                              {post.imageUrl ? (
                                <img
                                  src={post.imageUrl}
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-4xl font-black text-rose-100 select-none leading-none">
                                    {post.title.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              {(post as any).isPinned && (
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                                  <Pin className="h-3 w-3 text-rose-600 fill-current" />
                                  <span className="text-xs font-medium text-gray-800">Pinned</span>
                                </div>
                              )}
                            </div>
                            {/* Card body */}
                            <div className="flex flex-col flex-1 p-4">
                              <h3 className="font-semibold text-gray-900 group-hover:text-rose-600 transition-colors line-clamp-2 text-base leading-snug mb-2">
                                {post.title}
                              </h3>
                              <div className="text-sm text-gray-500 line-clamp-2 flex-1">
                                <RichTextContent content={post.content} className="line-clamp-2" />
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{formatDate(post.createdAt)}</span>
                                <div className="flex items-center gap-2">
                                  {post.attachments && post.attachments.length > 0 && (
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Paperclip className="h-3 w-3" />
                                      {post.attachments.length}
                                    </span>
                                  )}
                                  <LikeButton
                                    postId={post.id}
                                    initialLiked={(post as any).isLikedByUser || false}
                                    initialCount={(post as any).likeCount || 0}
                                    userId={userId || null}
                                  />
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {(post as any).commentCount || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                          {canManageContent && (
                            <div className="flex items-center gap-1 px-4 pb-3 opacity-0 group-hover:opacity-100 transition-opacity border-t border-gray-100">
                              <button
                                onClick={(e) => { e.preventDefault(); handleTogglePin(post.id, (post as any).isPinned || false); }}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title={(post as any).isPinned ? 'Unpin' : 'Pin'}
                              >
                                <Pin className={`h-3.5 w-3.5 ${(post as any).isPinned ? 'fill-current text-rose-600' : ''}`} />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); setSelectedPost(post); setEditPostOpen(true); }}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); handleDeletePost(post.id); }}
                                disabled={deletingPost === post.id}
                                className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                {deletingPost === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                        </article>
                      ) : (
                        /* Prestige Column/List View */
                        <article key={post.id} className="group border-b border-gray-100 pb-6 last:border-0">
                          <div className="flex gap-6">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {(post as any).isPinned && (
                                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 rounded-full px-2 py-0.5 text-xs font-medium">
                                    <Pin className="h-3 w-3 fill-current" />
                                    Pinned
                                  </span>
                                )}
                                {post.isPrivate && (
                                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Private</span>
                                )}
                              </div>
                              <Link href={`/${union.slug}/post/${post.id}`}>
                                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-rose-600 transition-colors mb-2">
                                  {post.title}
                                </h3>
                              </Link>
                              <RichTextContent content={post.content} className="text-gray-600 line-clamp-3 mb-3" />

                              {post.attachments && post.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {post.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                                    >
                                      <FileText className="h-4 w-4 text-rose-500" />
                                      <span className="truncate max-w-[120px]">{attachment.fileName}</span>
                                    </a>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{formatDate(post.createdAt)}</span>
                                <span>·</span>
                                <span>{(post as any).authorType === 'user' ? post.createdBy.name : (union.publicName || union.name)}</span>
                                <div className="flex items-center gap-2 ml-auto">
                                  <LikeButton
                                    postId={post.id}
                                    initialLiked={(post as any).isLikedByUser || false}
                                    initialCount={(post as any).likeCount || 0}
                                    userId={userId || null}
                                  />
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {(post as any).commentCount || 0}
                                  </span>
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
                                </div>
                              </div>

                              {canManageContent && (
                                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleTogglePin(post.id, (post as any).isPinned || false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1.5"
                                  >
                                    <Pin className={`h-4 w-4 ${(post as any).isPinned ? 'fill-current text-rose-600' : ''}`} />
                                    {(post as any).isPinned ? 'Unpin' : 'Pin'}
                                  </button>
                                  <button
                                    onClick={() => { setSelectedPost(post); setEditPostOpen(true); }}
                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1.5"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    disabled={deletingPost === post.id}
                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 text-sm flex items-center gap-1.5"
                                  >
                                    {deletingPost === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {post.imageUrl && (
                              <Link href={`/${union.slug}/post/${post.id}`} className="hidden sm:block flex-shrink-0">
                                <div className="w-40 h-28 rounded-xl overflow-hidden bg-gray-100">
                                  <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </div>
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* Standard Mode Grid/Column */
                  <div className={postsView === 'grid'
                    ? 'lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 space-y-4 lg:space-y-0'
                    : 'space-y-3'
                  }>
                    {posts.map((post) => {
                      if (post.isPrivate && !isApprovedMember) return null;

                      return (
                        <Card key={post.id} className={`overflow-hidden transition-shadow ${postsView === 'grid' ? 'flex flex-col h-full shadow-sm hover:shadow-md !py-0 !gap-0' : 'shadow-sm hover:shadow-md border-l-4 border-l-blue-500 !py-0 !gap-0'}`}>
                          <CardContent className={postsView === 'grid' ? 'p-4 flex flex-col h-full' : 'p-0'}>
                            {postsView === 'grid' && post.imageUrl && (
                              <Link href={`/${union.slug}/post/${post.id}`} className="block -mx-4 -mt-4 mb-4">
                                <div className="relative aspect-video overflow-hidden bg-gray-100">
                                  <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                                </div>
                              </Link>
                            )}

                            {/* Column view layout */}
                            {postsView !== 'grid' && (
                              <>
                                {/* Mobile image — fixed height, always on top */}
                                {post.imageUrl && (
                                  <div className="relative h-44 sm:hidden overflow-hidden bg-gray-100">
                                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                                    {/* Date chip overlaid on image */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                                      <span className="text-xs text-white/80 font-medium">{formatDate(post.createdAt)}</span>
                                    </div>
                                  </div>
                                )}

                                <div className="p-4 sm:p-6">
                                  {/* Top meta row */}
                                  <div className="flex items-center gap-2 mb-2">
                                    {!post.imageUrl && (
                                      <span className="text-xs text-gray-400 font-medium">{formatDate(post.createdAt)}</span>
                                    )}
                                    {(post as any).isPinned && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Pin className="h-2.5 w-2.5 fill-current" />
                                        Pinned
                                      </span>
                                    )}
                                    {post.isPrivate && (
                                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Private</span>
                                    )}
                                    {canManageContent && (
                                      <div className="flex items-center gap-1 ml-auto">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleTogglePin(post.id, (post as any).isPinned || false)} title={(post as any).isPinned ? 'Unpin' : 'Pin'}>
                                          <Pin className={`h-3.5 w-3.5 ${(post as any).isPinned ? 'fill-current text-blue-600' : 'text-gray-400'}`} />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700" onClick={() => { setSelectedPost(post); setEditPostOpen(true); }}>
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600" onClick={() => handleDeletePost(post.id)} disabled={deletingPost === post.id}>
                                          {deletingPost === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Title + side image on desktop */}
                                  <div className={post.imageUrl ? 'sm:flex sm:gap-5 sm:items-start' : ''}>
                                    <div className="flex-1 min-w-0">
                                      <Link href={`/${union.slug}/post/${post.id}`}>
                                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors leading-snug mb-2">
                                          {post.title}
                                        </h3>
                                      </Link>
                                      <RichTextContent content={post.content} className="text-sm sm:text-base text-gray-600 line-clamp-3 sm:line-clamp-4" />
                                      <Link href={`/${union.slug}/post/${post.id}`}>
                                        <Button variant="link" className="mt-2 px-0 text-blue-600 hover:text-blue-700 text-sm">Read more →</Button>
                                      </Link>
                                    </div>
                                    {post.imageUrl && (
                                      <div className="hidden sm:block sm:flex-shrink-0 sm:w-40 sm:h-28 rounded-lg overflow-hidden bg-gray-100 self-start mt-1">
                                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Grid view content */}
                            {postsView === 'grid' && (
                              <>
                                <div className={`flex items-start justify-between mb-2`}>
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <Link href={`/${union.slug}/post/${post.id}`} className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors text-base line-clamp-2">
                                        {post.title}
                                      </h3>
                                    </Link>
                                    {(post as any).isPinned && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                                        <Pin className="h-3 w-3" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            {postsView === 'grid' && (
                              <div className="flex-1">
                                <RichTextContent content={post.content} className="text-sm text-gray-600 line-clamp-3" />
                                <Link href={`/${union.slug}/post/${post.id}`}>
                                  <Button variant="link" className="mt-2 px-0 text-blue-600 hover:text-blue-700 text-sm">Read more →</Button>
                                </Link>
                              </div>
                            )}
                            {/* Column view: attachments + footer inside padded area */}
                            {postsView !== 'grid' && post.attachments && post.attachments.length > 0 && (
                              <div className="px-4 sm:px-6 pb-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                  <Paperclip className="h-4 w-4" />
                                  <span>Attachments ({post.attachments.length})</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {post.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center gap-3 p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.fileName}</p>
                                        <p className="text-xs text-gray-500">{(attachment.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                      </div>
                                      <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                        <Button variant="outline" size="sm" title="Download"><Download className="h-4 w-4" /></Button>
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Column view footer */}
                            {postsView !== 'grid' && (
                              <div className="flex items-center justify-between gap-3 border-t px-4 sm:px-6 py-3">
                                <div className="flex items-center gap-3">
                                  <LikeButton postId={post.id} initialLiked={(post as any).isLikedByUser || false} initialCount={(post as any).likeCount || 0} userId={userId || null} />
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {(post as any).commentCount || 0}
                                  </span>
                                  <ShareButton itemType="post" itemId={post.id} itemTitle={post.title} itemUrl={`/${union.slug}/post/${post.id}`} slug={union.slug} isOwnerOrAdmin={isOwner} itemContent={post.content} itemImageUrl={post.imageUrl || undefined} itemAttachments={post.attachments} />
                                </div>
                                <div className="text-xs text-gray-400">
                                  {`By ${(post as any).authorType === 'user' ? post.createdBy.name : (union.publicName || union.name)} • ${formatDate(post.createdAt)}`}
                                </div>
                              </div>
                            )}
                            {postsView === 'grid' && post.attachments && post.attachments.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                                <Paperclip className="h-3 w-3" />
                                <span>{post.attachments.length} attachment{post.attachments.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                            {postsView === 'grid' && (
                              <div className="flex flex-col gap-2 mt-auto pt-3 border-t">
                                <div className="flex items-center gap-3">
                                  <LikeButton postId={post.id} initialLiked={(post as any).isLikedByUser || false} initialCount={(post as any).likeCount || 0} userId={userId || null} />
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    {(post as any).commentCount || 0}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
                                  {canManageContent && (
                                    <div className="flex items-center gap-1">
                                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleTogglePin(post.id, (post as any).isPinned || false)} title={(post as any).isPinned ? 'Unpin post' : 'Pin post'}>
                                        <Pin className={`h-3.5 w-3.5 ${(post as any).isPinned ? 'fill-current' : ''}`} />
                                      </Button>
                                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => { setSelectedPost(post); setEditPostOpen(true); }} title="Edit">
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="destructive" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeletePost(post.id)} disabled={deletingPost === post.id} title="Delete">
                                        {deletingPost === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )
              ) : (
                prestigeMode ? (
                  /* Prestige Empty State */
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-rose-50 flex items-center justify-center">
                      <Image className="h-10 w-10 text-rose-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {isOwner
                        ? 'Share your first update with your community.'
                        : 'Check back soon for the latest news and updates.'}
                    </p>
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
                )
              )}
            </>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <>
              {/* Storage widget + upload button toolbar */}
              {canManageContent && (
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 max-w-xs">
                    <CompactStorageWidget unionSlug={union.slug} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    title={showThumbnails ? 'Switch to list view' : 'Switch to thumbnail view'}
                    onClick={async () => {
                      const next = !showThumbnails;
                      setShowThumbnails(next);
                      await fetch('/api/files/thumbnail-settings', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileThumbnailsEnabled: next }),
                      });
                    }}
                  >
                    {showThumbnails ? (
                      <><List className="h-4 w-4 mr-2" />List View</>
                    ) : (
                      <><LayoutGrid className="h-4 w-4 mr-2" />Thumbnails</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className={prestigeMode ? 'bg-rose-600 hover:bg-rose-700 rounded-full px-5' : 'bg-blue-600 hover:bg-blue-700'}
                    onClick={() => setUploadFileOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              )}

              {/* Files List */}
              {files.length > 0 ? (
                <div className={prestigeMode ? 'bg-gradient-to-b from-gray-50/50 to-white rounded-2xl p-6' : ''}>
                  <CategorizedFilesList
                    files={files}
                    isOwner={isOwner}
                    isApprovedMember={isApprovedMember}
                    onEdit={(file) => {
                      setSelectedFile(file);
                      // Delay opening dialog to let DropdownMenu fully close and clean up
                      setTimeout(() => setEditFileOpen(true), 100);
                    }}
                    onDelete={handleDeleteFile}
                    deletingFile={deletingFile}
                    unionId={union.id}
                    slug={union.slug}
                    showThumbnails={showThumbnails}
                  />
                </div>
              ) : (
                prestigeMode ? (
                  <div className="text-center py-16 bg-gradient-to-b from-blue-50/50 to-white rounded-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No files yet</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {isOwner
                        ? 'Upload documents, contracts, and resources for your members.'
                        : 'Documents and resources will appear here.'}
                    </p>
                  </div>
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
                )
              )}
            </>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <>
              {/* Non-prestige mobile controls */}
              {!prestigeMode && (
                <>
                  {canManageContent && (
                    <div className="flex items-center justify-between sm:hidden">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setCreateEventOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                      <div className="flex gap-2">
                        <Button variant={eventsView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setEventsView('list')}>List</Button>
                        <Button variant={eventsView === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setEventsView('calendar')}>Calendar</Button>
                      </div>
                    </div>
                  )}
                  {!canManageContent && (
                    <div className="flex justify-end gap-2 sm:hidden">
                      <Button variant={eventsView === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setEventsView('list')}>List</Button>
                      <Button variant={eventsView === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setEventsView('calendar')}>Calendar</Button>
                    </div>
                  )}
                </>
              )}

              {/* Events View */}
              <div className={prestigeMode ? 'bg-gradient-to-b from-amber-50/30 to-white rounded-2xl p-6' : ''}>
                {eventsView === 'calendar' ? (
                  <EventsCalendar
                    events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                    onEventClick={handleEventClick}
                  />
                ) : events.filter((e) => !e.isPrivate || isApprovedMember).length > 0 ? (
                  <EventsList
                    events={events.filter((e) => !e.isPrivate || isApprovedMember)}
                    isOwner={isOwner}
                    onEventClick={handleEventClick}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    slug={union.slug}
                    themeColor={prestigeMode ? '#E11D48' : union.themeColor}
                  />
                ) : (
                  prestigeMode ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
                        <Calendar className="h-10 w-10 text-amber-300" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        {isOwner
                          ? 'Create events to keep your members informed about meetings and activities.'
                          : 'Check back for upcoming events and gatherings.'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      No upcoming events
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className={prestigeMode ? 'bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 rounded-2xl p-6 sm:p-8' : ''}>
              <ContactTabContent
                union={union}
                isOwner={isOwner}
              />
            </div>
          )}

          {/* Elections Tab */}
          {activeTab === 'elections' && isApprovedMember && (
            <div className={prestigeMode ? 'bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 rounded-2xl p-6 sm:p-8' : ''}>
              <ElectionsList
                slug={union.slug}
                unionId={union.id}
                isOwner={isOwner}
              />
            </div>
          )}
      </div>

      {/* Dialogs */}
      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
        unionId={union.id}
        slug={union.slug}
        unionName={union.publicName || `${union.name}${union.localNumber ? ` ${union.localNumber}` : ''}`}
        onSuccess={() => router.refresh()}
      />
      <EditPostDialog
        open={editPostOpen}
        onOpenChange={setEditPostOpen}
        post={selectedPost}
        unionName={union.publicName || `${union.name}${union.localNumber ? ` ${union.localNumber}` : ''}`}
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
        onOpenChange={(open) => {
          setEditFileOpen(open);
          if (!open) {
            // Delay refresh to let dialog fully unmount and clean up pointer-events
            setTimeout(() => router.refresh(), 200);
          }
        }}
        file={selectedFile}
        onSuccess={() => {}}
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

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Phone, MapPin, Globe, FileText, Image, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Union, Post, File as FileType, Member } from '@/lib/db/schema';

interface UnionProfileTabsProps {
  union: Union;
  posts: (Post & { createdBy: { name: string } })[];
  files: (FileType & { createdBy: { name: string } })[];
  membership: any;
  isOwner: boolean;
  isApprovedMember: boolean;
}

export function UnionProfileTabs({
  union,
  posts,
  files,
  membership,
  isOwner,
  isApprovedMember,
}: UnionProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'files'>('about');

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
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
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
                            {post.isPrivate && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Private
                              </span>
                            )}
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
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
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
                          <a
                            key={file.id}
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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
                            {file.isPrivate && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Private
                              </span>
                            )}
                          </a>
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
        </div>
      </div>
    </div>
  );
}

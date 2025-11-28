import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, members, posts, files } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Users, Camera } from 'lucide-react';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { UnionNavbar } from './union-navbar';
import { UnionProfileTabs } from './union-profile-tabs';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      user: users,
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
    .limit(1);

  return membership;
}

async function getUnionPosts(unionId: number) {
  const postsWithCreator = await db
    .select({
      id: posts.id,
      unionId: posts.unionId,
      title: posts.title,
      content: posts.content,
      imageUrl: posts.imageUrl,
      isPrivate: posts.isPrivate,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      createdBy: {
        name: users.name,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.createdBy, users.id))
    .where(eq(posts.unionId, unionId))
    .orderBy(desc(posts.createdAt));

  return postsWithCreator;
}

async function getUnionFiles(unionId: number) {
  const filesWithCreator = await db
    .select({
      id: files.id,
      unionId: files.unionId,
      name: files.name,
      originalName: files.originalName,
      fileUrl: files.fileUrl,
      fileType: files.fileType,
      fileSize: files.fileSize,
      isPrivate: files.isPrivate,
      createdAt: files.createdAt,
      createdBy: {
        name: users.name,
      },
    })
    .from(files)
    .innerJoin(users, eq(files.createdBy, users.id))
    .where(eq(files.unionId, unionId))
    .orderBy(desc(files.createdAt));

  return filesWithCreator;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function PublicUnionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  // Only show published unions
  if (!union.publishedAt) {
    notFound();
  }

  const membership = await checkMembership(union.id);
  const isOwner = membership?.member.role === 'owner';
  const isApprovedMember = membership?.member.status === 'approved' || isOwner;

  // Fetch posts and files
  const unionPosts = await getUnionPosts(union.id);
  const unionFiles = await getUnionFiles(union.id);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
      />

      {/* Cover Photo - Facebook style */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative h-[300px] sm:h-[400px] bg-gradient-to-r from-blue-600 to-blue-700 rounded-b-lg overflow-hidden group">
            {union.coverPhotoUrl ? (
              <img
                src={union.coverPhotoUrl}
                alt={`${union.name} cover`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Users className="h-32 w-32 text-white/30" />
              </div>
            )}
            {/* Admin edit button for cover photo */}
            {isOwner && (
              <button className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg shadow-md flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-4 w-4" />
                <span className="text-sm font-medium">Edit Cover Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Section - Facebook style */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-lg shadow-sm pb-4">
          {/* Logo and Name */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-6 pt-6">
            {/* Logo - Overlapping cover photo */}
            <div className="flex-shrink-0 -mt-8 sm:-mt-16 relative z-20 group">
              {union.logoUrl ? (
                <img
                  src={union.logoUrl}
                  alt={`${union.name} logo`}
                  className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover border-4 border-white shadow-xl bg-white"
                />
              ) : (
                <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl">
                  <Users className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                </div>
              )}
              {/* Admin camera icon for profile photo */}
              {isOwner && (
                <button className="absolute bottom-1 right-1 bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Name and Local Number */}
            <div className="flex-1 text-center sm:text-left pb-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {(union.publicName || union.name).toUpperCase()}
                {union.localNumber && !union.publicName && ` ${union.localNumber}`}
              </h1>
            </div>
          </div>

        </div>
      </div>

      {/* Content Area with Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <UnionProfileTabs
          union={union}
          posts={unionPosts}
          files={unionFiles}
          membership={membership}
          isOwner={isOwner}
          isApprovedMember={isApprovedMember}
        />
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>
            Powered by{' '}
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              UnionWeb
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

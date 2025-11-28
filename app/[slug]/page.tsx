import { notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Users, Mail, Phone, MapPin, Globe, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { UnionNavbar } from './union-navbar';

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

          {/* Tabs/Navigation */}
          <div className="border-t mt-4">
            <div className="flex gap-2 px-6 pt-2">
              <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-semibold">
                About
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area - Facebook style two-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[380px_1fr] gap-4">
          {/* Left Column - Info Card */}
          <div className="space-y-4">
            {/* Description Card */}
            {union.description && (
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <h2 className="font-semibold text-gray-900 mb-3">
                    Introduction
                  </h2>
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
                        <span className="text-gray-900 break-all">
                          {union.email}
                        </span>
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

          {/* Right Column - Main Content */}
          <div className="space-y-4">
            {/* About Section */}
            {union.about && (
              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    About
                  </h2>
                  <div className="text-gray-700 leading-relaxed space-y-4">
                    {union.about.split('\n').map((paragraph, i) => (
                      <p key={i}>{paragraph}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Placeholder for future content (posts, events, etc.) */}
            {!union.about && !union.description && (
              <Card className="shadow-sm">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome to {union.publicName || union.name}
                  </h3>
                  <p className="text-gray-500">
                    More content coming soon...
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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

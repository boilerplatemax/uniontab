'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { SocialMediaIcons } from '@/components/social-media-icons';
import type { Union, UnionPage, Member, User } from '@/lib/db/schema';

interface CustomPageContentProps {
  union: Union;
  page: UnionPage;
  membership: { user: User; member: Member } | null;
  slug: string;
  showBanner?: boolean;
}

function getUnionDisplayName(union: Union): string {
  const name = (union.publicName || union.name).toUpperCase();
  if (union.localNumber) {
    return `${name} ${union.localNumber}`;
  }
  return name;
}

export function CustomPageContent({
  union,
  page,
  membership,
  slug,
  showBanner = false,
}: CustomPageContentProps) {
  return (
    <div className="min-h-screen bg-white">

      {/* Theme Banner */}
      {showBanner && (
        <>
          {/* Cover Photo */}
          <div className="relative bg-white">
            <div
              className={`relative overflow-hidden ${union.coverPhotoUrl ? 'h-[300px] sm:h-[400px]' : 'h-[120px] sm:h-[150px]'}`}
              style={{
                background: union.coverPhotoUrl
                  ? undefined
                  : `linear-gradient(135deg, ${union.themeColor || '#2563eb'} 0%, ${union.themeColor || '#2563eb'}dd 50%, ${union.themeColor || '#2563eb'}bb 100%)`
              }}
            >
              {union.coverPhotoUrl && (
                <img
                  src={union.coverPhotoUrl}
                  alt={`${union.name} cover`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Profile Section */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${union.coverPhotoUrl ? '-mt-20' : '-mt-10 sm:-mt-12'}`}>
            <div className="bg-white rounded-lg shadow-sm pb-4">
              {/* Logo and Name */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 px-6 pt-6">
                <div className={`flex-shrink-0 relative z-20 ${union.coverPhotoUrl ? '-mt-8 sm:-mt-16' : '-mt-4 sm:-mt-8'}`}>
                  {union.logoUrl ? (
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      <img
                        src={union.logoUrl}
                        alt={`${union.name} logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-xl bg-blue-600 flex items-center justify-center border-4 border-white shadow-xl">
                      <Users className="h-16 w-16 sm:h-20 sm:w-20 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left pb-4">
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {(union.publicName || union.name).toUpperCase()}
                    {union.localNumber && !union.publicName && ` ${union.localNumber}`}
                  </h1>
                  {union.description && (
                    <p className="text-gray-600 mt-2 text-sm sm:text-base">
                      {union.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Contact Information Bar */}
              {(union.email || union.phone || union.address || union.website) && (
                <div className="px-6 pb-4 border-t pt-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {union.email && (
                      <a
                        href={`mailto:${union.email}`}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{union.email}</span>
                      </a>
                    )}
                    {union.phone && (
                      <a
                        href={`tel:${union.phone}`}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{union.phone}</span>
                      </a>
                    )}
                    {union.address && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4" />
                        <span>{union.address}</span>
                      </div>
                    )}
                    {union.website && (
                      <a
                        href={union.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="hover:underline">
                          {union.website.replace(/^https?:\/\//, '')}
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Social Icons */}
              {(union as any).showSocialInHero && (union as any).socialLinks && Object.values((union as any).socialLinks).some((v: any) => v) && (
                <div className="px-6 pb-4 border-t pt-4 flex justify-center sm:justify-start">
                  <SocialMediaIcons
                    socialLinks={(union as any).socialLinks}
                    size="md"
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {page.showReturnButton && (
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to {getUnionDisplayName(union)}
          </Link>
        )}
        {page.showTitle && (
          <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
        )}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>
    </div>
  );
}

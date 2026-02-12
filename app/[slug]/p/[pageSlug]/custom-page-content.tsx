'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UnionNavbar } from '../../union-navbar';
import { NavbarSpacer } from '../../navbar-spacer';
import { UnionTabProvider } from '../../union-tab-context';
import type { Union, UnionPage, Member, User, NavigationItem } from '@/lib/db/schema';

interface CustomPageContentProps {
  union: Union;
  page: UnionPage;
  membership: { user: User; member: Member } | null;
  handleSignOut: () => Promise<void>;
  slug: string;
  navigationItems?: (NavigationItem & { pageSlug?: string | null; fileUrl?: string | null })[];
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
  handleSignOut,
  slug,
  navigationItems,
}: CustomPageContentProps) {
  return (
    <UnionTabProvider slug={slug}>
    <div className="min-h-screen bg-white">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        navigationItems={navigationItems}
        contactEmail={union.email}
        isApprovedMember={membership?.member.status === 'approved' || membership?.member.role === 'owner'}
      />
      <NavbarSpacer />

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
    </UnionTabProvider>
  );
}

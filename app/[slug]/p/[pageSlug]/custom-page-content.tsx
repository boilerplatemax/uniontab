'use client';

import { UnionNavbar } from '../../union-navbar';
import { NavbarSpacer } from '../../navbar-spacer';
import type { Union, UnionPage, Member, User } from '@/lib/db/schema';

interface CustomPageContentProps {
  union: Union;
  page: UnionPage;
  membership: { user: User; member: Member } | null;
  handleSignOut: () => Promise<void>;
  slug: string;
}

export function CustomPageContent({
  union,
  page,
  membership,
  handleSignOut,
  slug,
}: CustomPageContentProps) {
  return (
    <div className="min-h-screen bg-white">
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
      />
      <NavbarSpacer />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{page.title}</h1>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </div>
    </div>
  );
}

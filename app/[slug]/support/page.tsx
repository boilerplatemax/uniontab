import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { SupportContent } from './support-content';
import { getUnionNavigationItems } from '../get-union-page-data';

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

export default async function SupportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union) {
    notFound();
  }

  const membership = await checkMembership(union.id);

  // Only admins and owners can access the support page
  const isOwnerOrAdmin = membership?.member.role === 'owner' || membership?.member.role === 'admin';

  if (!isOwnerOrAdmin) {
    redirect(`/${slug}`);
  }

  const navItems = await getUnionNavigationItems(union.id);

  return (
    <SupportContent
      union={union}
      membership={membership}
      handleSignOut={handleSignOut}
      slug={slug}
      navigationItems={navItems}
    />
  );
}

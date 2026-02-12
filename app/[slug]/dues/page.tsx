import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser, getDuesForUnion, getDuesSummaryForUnion } from '@/lib/db/queries';
import { DuesContent } from './dues-content';
import { UnionNavbar } from '../union-navbar';
import { getUnionNavigationItems } from '../get-union-page-data';
import { NavbarSpacer } from '../navbar-spacer';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkOwnerOrAdmin(unionId: number, userId: number) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner' || membership?.role === 'admin';
}

async function getMembership(unionId: number, userId: number) {
  const [membership] = await db
    .select({
      user: users,
      member: members
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership;
}

async function getPendingMembersCount(unionId: number) {
  const [result] = await db
    .select({ value: count() })
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.status, 'pending')));

  return Number(result.value);
}

async function getUnionMembers(unionId: number) {
  const unionMembers = await db
    .select({
      member: members,
      user: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(and(eq(members.unionId, unionId), eq(members.status, 'approved')));

  return unionMembers;
}

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function DuesPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  const navItems = await getUnionNavigationItems(union.id);
  const isOwnerOrAdmin = await checkOwnerOrAdmin(union.id, user.id);

  if (!isOwnerOrAdmin) {
    redirect(`/${slug}`);
  }

  const duesData = await getDuesForUnion(union.id);
  const summary = await getDuesSummaryForUnion(union.id);
  const membership = await getMembership(union.id, user.id);
  const pendingMembersCount = await getPendingMembersCount(union.id);
  const unionMembers = await getUnionMembers(union.id);

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
        navigationItems={navItems}
      />
      <NavbarSpacer />
      <DuesContent
        slug={slug}
        union={union}
        dues={duesData}
        summary={summary}
        members={unionMembers}
        isOwnerOrAdmin={isOwnerOrAdmin}
      />
    </>
  );
}

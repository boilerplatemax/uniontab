import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { BillingContent } from './billing-content';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { signOut } from '@/app/(login)/actions';
import { getUnionNavigationItems } from '../get-union-page-data';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getMembership(unionId: number, userId: number) {
  const [membership] = await db
    .select({
      member: members,
      user: {
        id: users.id,
        name: users.name,
      },
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

export default async function BillingPage({
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

  const membership = await getMembership(union.id, user.id);

  if (!membership || membership.member.role !== 'owner') {
    redirect(`/${slug}`);
  }

  const pendingMembersCount = await getPendingMembersCount(union.id);
  const navItems = await getUnionNavigationItems(union.id);
  const isApprovedMember = membership.member.status === 'approved' || membership.member.role === 'owner';

  async function handleSignOut() {
    'use server';
    await signOut();
  }

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.name}
        localNumber={union.localNumber ?? null}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
        isApprovedMember={isApprovedMember}
        navigationItems={navItems}
      />
      <NavbarSpacer />
      <BillingContent slug={slug} union={union} />
    </>
  );
}

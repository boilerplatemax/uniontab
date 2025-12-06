import { redirect, notFound } from 'next/navigation';
import { getUser, getUserWithTeam } from '@/lib/db/queries';
import { MemberProfile } from './member-profile';
import { UnionNavbar } from '../union-navbar';
import { NavbarSpacer } from '../navbar-spacer';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { cookies } from 'next/headers';

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

async function handleSignOut() {
  'use server';
  (await cookies()).delete('session');
}

export default async function ProfilePage({
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

  const userWithUnion = await getUserWithTeam(user.id);
  const membership = await getMembership(union.id, user.id);
  const isOwner = membership?.member.role === 'owner';
  const pendingMembersCount = isOwner ? await getPendingMembersCount(union.id) : 0;

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
      />
      <NavbarSpacer />
      <MemberProfile slug={slug} user={user} userWithUnion={userWithUnion} membership={membership} union={union} />
    </>
  );
}

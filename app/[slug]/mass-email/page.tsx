import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MassEmailClient } from './mass-email-client';
import { UnionNavbar } from '../union-navbar';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkOwnership(unionId: number, userId: number) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner';
}

async function getUnionMembers(unionId: number) {
  const unionMembers = await db
    .select({
      memberId: members.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: members.role,
      status: members.status,
      joinedAt: members.createdAt
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.unionId, unionId));

  return unionMembers;
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

export default async function MassEmailPage({
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

  const isOwner = await checkOwnership(union.id, user.id);

  if (!isOwner) {
    redirect(`/${slug}`);
  }

  const unionMembers = await getUnionMembers(union.id);
  const membership = await getMembership(union.id, user.id);
  const pendingMembersCount = await getPendingMembersCount(union.id);

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
      <MassEmailClient
        slug={slug}
        union={union}
        members={unionMembers}
      />
    </>
  );
}

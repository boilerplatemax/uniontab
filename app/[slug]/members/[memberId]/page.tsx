import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, memberDocuments, memberCertifications, memberPositions, memberNotes } from '@/lib/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MemberProfileContent } from './member-profile-content';
import { UnionNavbar } from '../../union-navbar';
import { NavbarSpacer } from '../../navbar-spacer';
import { cookies } from 'next/headers';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkAdminOrOwner(unionId: number, userId: number) {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner' || membership?.role === 'admin';
}

async function getMemberById(memberId: number, unionId: number) {
  const [member] = await db
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
    .where(and(eq(members.id, memberId), eq(members.unionId, unionId)))
    .limit(1);

  return member;
}

async function getMemberDocuments(memberId: number) {
  return db
    .select({
      document: memberDocuments,
      uploadedBy: {
        id: users.id,
        name: users.name,
      }
    })
    .from(memberDocuments)
    .leftJoin(users, eq(memberDocuments.uploadedBy, users.id))
    .where(eq(memberDocuments.memberId, memberId));
}

async function getMemberCertifications(memberId: number) {
  return db
    .select({
      certification: memberCertifications,
      createdBy: {
        id: users.id,
        name: users.name,
      }
    })
    .from(memberCertifications)
    .leftJoin(users, eq(memberCertifications.createdBy, users.id))
    .where(eq(memberCertifications.memberId, memberId));
}

async function getMemberPositions(memberId: number) {
  return db
    .select({
      position: memberPositions,
      createdBy: {
        id: users.id,
        name: users.name,
      }
    })
    .from(memberPositions)
    .leftJoin(users, eq(memberPositions.createdBy, users.id))
    .where(eq(memberPositions.memberId, memberId));
}

async function getMemberNotes(memberId: number) {
  return db
    .select({
      note: memberNotes,
      createdBy: {
        id: users.id,
        name: users.name,
      }
    })
    .from(memberNotes)
    .leftJoin(users, eq(memberNotes.createdBy, users.id))
    .where(eq(memberNotes.memberId, memberId));
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

export default async function MemberProfilePage({
  params
}: {
  params: Promise<{ slug: string; memberId: string }>;
}) {
  const { slug, memberId: memberIdStr } = await params;
  const memberId = parseInt(memberIdStr, 10);

  if (isNaN(memberId)) {
    notFound();
  }

  const user = await getUser();

  if (!user) {
    redirect(`/${slug}/sign-in`);
  }

  const union = await getUnionBySlug(slug);

  if (!union) {
    notFound();
  }

  const isAdminOrOwner = await checkAdminOrOwner(union.id, user.id);

  if (!isAdminOrOwner) {
    redirect(`/${slug}`);
  }

  const memberData = await getMemberById(memberId, union.id);

  if (!memberData) {
    notFound();
  }

  const [documents, certifications, positions, notes, membership, pendingMembersCount] = await Promise.all([
    getMemberDocuments(memberId),
    getMemberCertifications(memberId),
    getMemberPositions(memberId),
    getMemberNotes(memberId),
    getMembership(union.id, user.id),
    getPendingMembersCount(union.id),
  ]);

  return (
    <>
      <UnionNavbar
        slug={slug}
        unionName={union.publicName || union.name}
        localNumber={union.publicName ? null : union.localNumber}
        logoUrl={union.logoUrl}
        themeColor={union.themeColor}
        navConfig={union.navConfig}
        membership={membership}
        handleSignOut={handleSignOut}
        pendingMembersCount={pendingMembersCount}
      />
      <NavbarSpacer />
      <MemberProfileContent
        slug={slug}
        union={union}
        memberData={memberData}
        documents={documents}
        certifications={certifications}
        positions={positions}
        notes={notes}
        currentUserId={user.id}
      />
    </>
  );
}

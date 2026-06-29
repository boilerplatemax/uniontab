import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { db } from '@/lib/db/drizzle';
import { unions, members, users, memberGroups, memberGroupAssignments } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MASS_EMAIL_ENABLED, MASS_EMAIL_DISABLED_MESSAGE } from '@/lib/features';
import { MassEmailContent } from './mass-email-content';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select({
      id: unions.id,
      name: unions.name,
      localNumber: unions.localNumber,
    })
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function checkOwnerOrAdmin(unionId: number, userId: number) {
  const [membership] = await db
    .select({ role: members.role })
    .from(members)
    .where(and(eq(members.unionId, unionId), eq(members.userId, userId)))
    .limit(1);

  return membership?.role === 'owner' || membership?.role === 'admin';
}

async function getUnionMembers(unionId: number) {
  const unionMembers = await db
    .select({
      member: {
        id: members.id,
        userId: members.userId,
        unionId: members.unionId,
        role: members.role,
        status: members.status,
        joinedAt: members.joinedAt,
        profilePhotoUrl: members.profilePhotoUrl,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email
      }
    })
    .from(members)
    .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
    .where(eq(members.unionId, unionId));

  return unionMembers;
}

async function getGroups(unionId: number) {
  const groups = await db
    .select({
      id: memberGroups.id,
      name: memberGroups.name,
      description: memberGroups.description,
      createdAt: memberGroups.createdAt,
      memberCount: sql<number>`count(${memberGroupAssignments.id})::int`,
    })
    .from(memberGroups)
    .leftJoin(memberGroupAssignments, eq(memberGroups.id, memberGroupAssignments.groupId))
    .where(eq(memberGroups.unionId, unionId))
    .groupBy(memberGroups.id)
    .orderBy(memberGroups.name);

  return groups;
}

async function getGroupAssignments(unionId: number) {
  const assignments = await db
    .select({
      memberId: memberGroupAssignments.memberId,
      groupId: memberGroupAssignments.groupId,
    })
    .from(memberGroupAssignments)
    .innerJoin(memberGroups, eq(memberGroupAssignments.groupId, memberGroups.id))
    .where(eq(memberGroups.unionId, unionId));

  return assignments;
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

  const isOwnerOrAdmin = await checkOwnerOrAdmin(union.id, user.id);

  if (!isOwnerOrAdmin) {
    redirect(`/${slug}`);
  }

  // Feature temporarily disabled — show an upgrade notice instead of the composer.
  if (!MASS_EMAIL_ENABLED) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Union
          </Link>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Emails</h1>
            <p className="text-gray-600 max-w-md mx-auto">
              {MASS_EMAIL_DISABLED_MESSAGE}
            </p>
            <a
              href="mailto:info@uniontab.com"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact info@uniontab.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  const [unionMembers, groups, groupAssignments] = await Promise.all([
    getUnionMembers(union.id),
    getGroups(union.id),
    getGroupAssignments(union.id),
  ]);

  return (
    <MassEmailContent
      slug={slug}
      union={union}
      members={unionMembers}
      groups={groups}
      groupAssignments={groupAssignments}
    />
  );
}

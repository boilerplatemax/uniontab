import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, unionPages, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { cookies } from 'next/headers';
import { CustomPageContent } from './custom-page-content';

async function getUnionBySlug(slug: string) {
  const [union] = await db
    .select()
    .from(unions)
    .where(eq(unions.slug, slug))
    .limit(1);

  return union;
}

async function getPageBySlug(unionId: number, pageSlug: string) {
  const [page] = await db
    .select()
    .from(unionPages)
    .where(
      and(eq(unionPages.unionId, unionId), eq(unionPages.slug, pageSlug))
    )
    .limit(1);

  return page;
}

async function checkMembership(unionId: number) {
  const user = await getUser();
  if (!user) return null;

  const [membership] = await db
    .select({
      user: users,
      member: members,
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

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  const { slug, pageSlug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union) {
    notFound();
  }

  const page = await getPageBySlug(union.id, pageSlug);
  if (!page || !page.isPublished) {
    notFound();
  }

  const membership = await checkMembership(union.id);

  // If members only, check auth
  if (page.isMembersOnly) {
    if (!membership) {
      redirect(`/${slug}/sign-in`);
    }
    // Check if user is an approved member
    if (membership.member.status !== 'approved') {
      redirect(`/${slug}`);
    }
  }

  return (
    <CustomPageContent
      union={union}
      page={page}
      membership={membership}
      handleSignOut={handleSignOut}
      slug={slug}
    />
  );
}

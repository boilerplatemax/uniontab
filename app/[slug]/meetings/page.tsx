import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MeetingsContent } from './meetings-content';

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
      member: members,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(
      and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      )
    )
    .limit(1);

  return membership;
}

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const union = await getUnionBySlug(slug);
  if (!union || !union.publishedAt) {
    notFound();
  }

  const membership = await checkMembership(union.id);

  // Meetings require authentication
  if (!membership) {
    redirect(`/${slug}/sign-in`);
  }

  const unionInfo = {
    id: union.id,
    name: union.publicName || union.name,
    localNumber: union.localNumber,
    logoUrl: union.logoUrl,
    slug: union.slug,
    themeColor: union.themeColor,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <MeetingsContent unionInfo={unionInfo} />
      </div>
    </div>
  );
}

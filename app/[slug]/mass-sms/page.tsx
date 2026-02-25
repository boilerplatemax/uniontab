import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { MassSMSContent } from './mass-sms-content';

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

async function getUnionMembersWithPhone(unionId: number) {
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
    .innerJoin(users, and(eq(members.userId, users.id), isNull(users.deletedAt)))
    .where(eq(members.unionId, unionId));

  return unionMembers;
}

export default async function MassSMSPage({
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

  const unionMembers = await getUnionMembersWithPhone(union.id);

  return (
    <MassSMSContent
      slug={slug}
      union={union}
      members={unionMembers}
    />
  );
}

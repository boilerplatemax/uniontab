import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { unions, members, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { SignatureContent } from './signature-content';

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

export default async function SignaturePage({
  params,
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

  if (!membership || (membership.member.role !== 'owner' && membership.member.role !== 'admin')) {
    redirect(`/${slug}`);
  }

  return (
    <SignatureContent
      slug={slug}
      unionId={union.id}
      unionName={union.name}
      initialSignatureHtml={membership.member.signatureHtml || ''}
    />
  );
}

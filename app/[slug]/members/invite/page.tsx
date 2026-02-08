import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/drizzle";
import { unions, members, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import InvitePageContent from "./invite-page-content";
import { cookies } from "next/headers";
import { isPaidSubscription } from "@/lib/membership/limits";

export const metadata: Metadata = {
  title: "Invite Members",
  description: "Share your union's registration link with potential members",
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { slug } = await params;

  // Get user session
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/${slug}/sign-in`);
  }

  // Get union
  const union = await db.query.unions.findFirst({
    where: eq(unions.slug, slug),
  });

  if (!union) {
    redirect("/");
  }

  // Check if user is owner or admin
  const membership = await db.query.members.findFirst({
    where: and(
      eq(members.userId, session.user.id),
      eq(members.unionId, union.id)
    ),
  });

  const isOwnerOrAdmin = membership?.role === "owner" || membership?.role === "admin";

  if (!isOwnerOrAdmin) {
    redirect(`/${slug}`);
  }

  // Get user details for navbar
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const registrationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${slug}/sign-up`;

  async function handleSignOut() {
    'use server';
    (await cookies()).delete('session');
  }

  // Check if union has paid subscription for bulk invite capability
  const canBulkInvite = isPaidSubscription(union);

  return (
    <InvitePageContent
      unionName={union.name}
      localNumber={union.localNumber ?? null}
      registrationUrl={registrationUrl}
      slug={slug}
      membership={{
        user: { name: user.name },
        member: { role: membership.role }
      }}
      handleSignOut={handleSignOut}
      logoUrl={union.logoUrl}
      themeColor={union.themeColor}
      navConfig={union.navConfig}
      unionId={union.id}
      canBulkInvite={canBulkInvite}
    />
  );
}

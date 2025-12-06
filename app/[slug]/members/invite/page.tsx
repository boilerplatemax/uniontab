import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { unions, members } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import InvitePageContent from "./invite-page-content";

export const metadata: Metadata = {
  title: "Invite Members",
  description: "Share your union's registration link with potential members",
};

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function InvitePage({ params }: PageProps) {
  const { slug } = params;

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

  const registrationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${slug}/sign-up`;

  return (
    <InvitePageContent
      unionName={union.name}
      localNumber={union.localNumber}
      registrationUrl={registrationUrl}
      slug={slug}
    />
  );
}

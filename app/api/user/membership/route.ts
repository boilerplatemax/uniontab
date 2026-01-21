import { getUserMembership } from '@/lib/db/queries';

export async function GET() {
  try {
    const membership = await getUserMembership();

    if (!membership) {
      return Response.json({ isLoggedIn: false, membership: null });
    }

    return Response.json({
      isLoggedIn: true,
      membership: {
        unionSlug: membership.union.slug,
        unionName: membership.union.publicName || membership.union.name,
        role: membership.member.role,
      }
    });
  } catch (error) {
    return Response.json({ isLoggedIn: false, membership: null });
  }
}

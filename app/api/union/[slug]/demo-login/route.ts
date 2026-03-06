import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { unions, users, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // Find the union by slug
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.slug, slug))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Only allow demo login on demo unions
    if (!union.isDemo) {
      return NextResponse.json(
        { error: 'Demo login is not available for this union' },
        { status: 403 }
      );
    }

    // Find the demo admin user by their designated email address
    const [membership] = await db
      .select({ user: users, member: members })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(and(eq(members.unionId, union.id), eq(users.email, 'demo@cupe100.ca'), eq(members.status, 'approved')))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Demo admin user not configured. Please run the demo seed script.' },
        { status: 500 }
      );
    }

    // Set the session for the demo admin user
    await setSession(membership.user);

    revalidatePath(`/${slug}`, 'layout');
    revalidatePath(`/${slug}`, 'page');

    return NextResponse.json({
      success: true,
      user: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return NextResponse.json({ error: 'Failed to start demo session' }, { status: 500 });
  }
}

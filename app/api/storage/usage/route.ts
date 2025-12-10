import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getStorageUsage } from '@/lib/storage/limits';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unionSlug from query params
    const { searchParams } = new URL(request.url);
    const unionSlug = searchParams.get('unionSlug');

    if (!unionSlug) {
      return NextResponse.json({ error: 'Union slug is required' }, { status: 400 });
    }

    // Get union
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.slug, unionSlug))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Check if user is a member with owner or admin role
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, union.id),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only owners and admins can view storage usage' },
        { status: 403 }
      );
    }

    // Get storage usage
    const storageUsage = await getStorageUsage(union.id);

    return NextResponse.json(storageUsage);
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch storage usage' },
      { status: 500 }
    );
  }
}

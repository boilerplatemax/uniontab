import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateStorageUsage } from '@/lib/storage/limits';

/**
 * Recalculate storage usage for a union
 * This endpoint allows owners to manually trigger a recalculation
 * if the storage counter gets out of sync
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { unionSlug } = body;

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

    // Check if user is a union owner
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, union.id),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can recalculate storage usage' },
        { status: 403 }
      );
    }

    // Recalculate storage usage
    await updateStorageUsage(union.id);

    return NextResponse.json({
      success: true,
      message: 'Storage usage recalculated successfully'
    });
  } catch (error) {
    console.error('Error recalculating storage usage:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate storage usage' },
      { status: 500 }
    );
  }
}

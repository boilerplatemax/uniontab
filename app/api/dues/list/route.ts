import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getDuesForUnion, getDuesForMember, getDuesSummaryForUnion } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');
    const memberId = searchParams.get('memberId');
    const includeSummary = searchParams.get('includeSummary') === 'true';

    if (!unionId) {
      return NextResponse.json(
        { error: 'Missing unionId parameter' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, parseInt(unionId)), eq(members.userId, user.id)))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this union' },
        { status: 403 }
      );
    }

    // If memberId is provided, only owner/admin can view other members' dues
    // Regular members can only view their own dues
    if (memberId) {
      const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
      const isOwnDues = membership.id === parseInt(memberId);

      if (!isOwnerOrAdmin && !isOwnDues) {
        return NextResponse.json(
          { error: 'You can only view your own dues' },
          { status: 403 }
        );
      }

      const dues = await getDuesForMember(parseInt(memberId));
      return NextResponse.json({ dues });
    }

    // For union-wide dues, only owner/admin can view
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    if (!isOwnerOrAdmin) {
      // Regular members can only view their own dues
      const dues = await getDuesForMember(membership.id);
      return NextResponse.json({ dues });
    }

    // Get all dues for the union (owner/admin only)
    const dues = await getDuesForUnion(parseInt(unionId));

    // Get summary if requested
    let summary = null;
    if (includeSummary) {
      summary = await getDuesSummaryForUnion(parseInt(unionId));
    }

    return NextResponse.json({ dues, summary });
  } catch (error) {
    console.error('Error fetching dues:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

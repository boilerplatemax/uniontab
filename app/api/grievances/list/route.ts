import { NextResponse } from 'next/server';
import { getUser, getGrievancesForUnion, getGrievancesForMember } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = parseInt(searchParams.get('unionId') || '0');
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const category = searchParams.get('category') || undefined;
    const assignedToParam = searchParams.get('assignedTo');
    const assignedTo = assignedToParam ? parseInt(assignedToParam) : undefined;

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id)
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of this union' },
        { status: 403 }
      );
    }

    let grievances;

    // If user is owner or admin, show all grievances with filters
    if (membership.role === 'owner' || membership.role === 'admin') {
      grievances = await getGrievancesForUnion(unionId, {
        status,
        priority,
        category,
        assignedTo,
      });
    } else {
      // Regular members can only see their own grievances
      grievances = await getGrievancesForMember(membership.id);
    }

    return NextResponse.json({ success: true, grievances });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

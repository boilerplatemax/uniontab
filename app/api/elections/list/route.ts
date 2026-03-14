import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getUnionElections,
  isUserMemberOfUnion,
  isUserAdminOfUnion,
  isUserElectionCommittee,
} from '@/lib/db/election-queries';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json(
        { error: 'Union ID is required' },
        { status: 400 }
      );
    }

    const unionIdNum = parseInt(unionId);
    if (isNaN(unionIdNum)) {
      return NextResponse.json({ error: 'Invalid union ID' }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is member
    const isMember = await isUserMemberOfUnion(user.id, unionIdNum);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to view elections' },
        { status: 403 }
      );
    }

    const [isAdmin, isElectionCommittee] = await Promise.all([
      isUserAdminOfUnion(user.id, unionIdNum),
      isUserElectionCommittee(user.id, unionIdNum),
    ]);
    const elections = await getUnionElections(unionIdNum);

    // Filter elections based on user role
    // Regular members can only see active and closed elections
    // Admins can see all elections including drafts
    const filteredElections = isAdmin
      ? elections
      : elections.filter((e) => e.status !== 'draft');

    return NextResponse.json({
      elections: filteredElections,
      isAdmin,
      isElectionCommittee,
    });
  } catch (error) {
    console.error('Error fetching elections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elections' },
      { status: 500 }
    );
  }
}

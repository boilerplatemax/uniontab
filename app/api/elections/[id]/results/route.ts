import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getElectionResults,
  getElectionById,
  isUserMemberOfUnion,
  isUserAdminOfUnion,
} from '@/lib/db/election-queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const electionId = parseInt(id);

    if (isNaN(electionId)) {
      return NextResponse.json({ error: 'Invalid election ID' }, { status: 400 });
    }

    const user = await getUser();
    const election = await getElectionById(electionId);

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check visibility permissions
    const isPublic = election.resultsVisibility === 'public';
    const isMembersOnly = election.resultsVisibility === 'members';
    const isHidden = election.resultsVisibility === 'hidden';

    // Public results - anyone can view
    if (isPublic) {
      const results = await getElectionResults(electionId);
      return NextResponse.json(results);
    }

    // For non-public results, user must be logged in
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to view these results' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await isUserAdminOfUnion(user.id, election.unionId);

    // Admins can always view results
    if (isAdmin) {
      const results = await getElectionResults(electionId);
      return NextResponse.json(results);
    }

    // Members-only results
    if (isMembersOnly) {
      const isMember = await isUserMemberOfUnion(user.id, election.unionId);
      if (!isMember) {
        return NextResponse.json(
          { error: 'Only union members can view these results' },
          { status: 403 }
        );
      }
      const results = await getElectionResults(electionId);
      return NextResponse.json(results);
    }

    // Hidden results - only admins (already checked above)
    if (isHidden) {
      return NextResponse.json(
        { error: 'Results are not available for this election' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Unable to determine result visibility' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching election results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

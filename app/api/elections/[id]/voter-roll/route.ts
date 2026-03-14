import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getElectionById,
  canUserViewVoterRoll,
  getVoterRollForElection,
  getInPersonVotesForElection,
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const election = await getElectionById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Only owner, admin with elections permission, or election_committee can view the voter roll
    const canView = await canUserViewVoterRoll(user.id, election.unionId);
    if (!canView) {
      return NextResponse.json(
        { error: 'You do not have permission to view the voter roll' },
        { status: 403 }
      );
    }

    const [onlineVoters, inPersonVotersList] = await Promise.all([
      getVoterRollForElection(electionId, election.unionId),
      getInPersonVotesForElection(electionId, election.unionId),
    ]);

    return NextResponse.json({
      electionId,
      electionTitle: election.title,
      electionStatus: election.status,
      onlineVoters: onlineVoters.map((v) => ({
        voteId: v.voteId,
        votedAt: v.votedAt,
        displayName: v.member
          ? `${v.member.firstName || ''} ${v.member.lastName || ''}`.trim() || v.member.userName || v.member.userEmail
          : 'Unknown Member',
        memberId: v.member?.memberId2 || null,
      })),
      inPersonVoters: inPersonVotersList.map((v) => ({
        id: v.id,
        memberId: v.memberId,
        markedAt: v.markedAt,
        notes: v.notes,
        displayName: v.member
          ? `${v.member.firstName || ''} ${v.member.lastName || ''}`.trim() || v.member.userName || v.member.userEmail
          : 'Unknown Member',
        memberIdNumber: v.member?.memberId || null,
        markedBy: v.markedBy?.name || v.markedBy?.email || 'Unknown',
      })),
      totalOnlineVotes: onlineVoters.length,
      totalInPersonVotes: inPersonVotersList.length,
      totalVotes: onlineVoters.length + inPersonVotersList.length,
    });
  } catch (error) {
    console.error('Error fetching voter roll:', error);
    return NextResponse.json({ error: 'Failed to fetch voter roll' }, { status: 500 });
  }
}

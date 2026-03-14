import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import {
  getElectionById,
  canUserViewVoterRoll,
  hasInPersonVote,
  hasUserVoted,
  markInPersonVote,
  removeInPersonVote,
} from '@/lib/db/election-queries';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const markInPersonVoteSchema = z.object({
  memberId: z.number().int().positive(),
  notes: z.string().optional(),
});

// POST: Mark a member as voted in person
export async function POST(
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

    // Only election_committee, admin with elections permission, or owner can mark in-person votes
    const canMark = await canUserViewVoterRoll(user.id, election.unionId);
    if (!canMark) {
      return NextResponse.json(
        { error: 'You do not have permission to record in-person votes' },
        { status: 403 }
      );
    }

    // Can only mark in-person votes for active elections
    if (election.status !== 'active') {
      return NextResponse.json(
        { error: 'In-person votes can only be recorded for active elections' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { memberId, notes } = markInPersonVoteSchema.parse(body);

    // Verify the member belongs to this union
    const [targetMember] = await db
      .select()
      .from(members)
      .where(and(eq(members.id, memberId), eq(members.unionId, election.unionId)))
      .limit(1);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this union' }, { status: 404 });
    }

    // Check if member already has an in-person vote
    const alreadyInPerson = await hasInPersonVote(electionId, memberId);
    if (alreadyInPerson) {
      return NextResponse.json(
        { error: 'This member has already been marked as voted in person' },
        { status: 409 }
      );
    }

    // Check if member already voted online
    const alreadyVotedOnline = await hasUserVoted(electionId, targetMember.userId);
    if (alreadyVotedOnline) {
      return NextResponse.json(
        { error: 'This member has already submitted an online vote. Cannot record an in-person vote.' },
        { status: 409 }
      );
    }

    const vote = await markInPersonVote({
      electionId,
      memberId,
      markedById: user.id,
      notes: notes || null,
    });

    return NextResponse.json({
      success: true,
      inPersonVote: vote,
      message: 'Member marked as voted in person',
    });
  } catch (error) {
    console.error('Error marking in-person vote:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to record in-person vote' }, { status: 500 });
  }
}

// DELETE: Remove an in-person vote record (for corrections - EC/admin only)
export async function DELETE(
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

    const canMark = await canUserViewVoterRoll(user.id, election.unionId);
    if (!canMark) {
      return NextResponse.json(
        { error: 'You do not have permission to remove in-person vote records' },
        { status: 403 }
      );
    }

    if (election.status === 'closed') {
      return NextResponse.json(
        { error: 'In-person vote records cannot be removed from closed elections' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const memberId = parseInt(searchParams.get('memberId') || '');

    if (isNaN(memberId)) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await removeInPersonVote(electionId, memberId);

    return NextResponse.json({ success: true, message: 'In-person vote record removed' });
  } catch (error) {
    console.error('Error removing in-person vote:', error);
    return NextResponse.json({ error: 'Failed to remove in-person vote record' }, { status: 500 });
  }
}

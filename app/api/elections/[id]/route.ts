import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import {
  getElectionById,
  updateElection,
  deleteElection,
  isUserAdminOfUnion,
  isUserMemberOfUnion,
  hasUserVoted,
  updateElectionStatus,
  hasUserInPersonVote,
  isUserElectionCommittee,
} from '@/lib/db/election-queries';
import { z } from 'zod';

const updateElectionSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  openTime: z.string().datetime().optional(),
  closeTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  allowRevotes: z.boolean().optional(),
  resultsVisibility: z.enum(['hidden', 'members', 'public']).optional(),
  status: z.enum(['draft', 'active', 'closed']).optional(),
});

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

    // Update election status if needed
    await updateElectionStatus(electionId);

    const election = await getElectionById(electionId);

    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check if user is a member or if election is public
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMember = await isUserMemberOfUnion(user.id, election.unionId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'You must be a member to view this election' },
        { status: 403 }
      );
    }

    // Check if user has already voted (online or in person)
    const [userHasVoted, userVotedInPerson, userIsEC] = await Promise.all([
      hasUserVoted(election.id, user.id),
      hasUserInPersonVote(election.id, user.id, election.unionId),
      isUserElectionCommittee(user.id, election.unionId),
    ]);

    return NextResponse.json({
      election,
      userHasVoted,
      userVotedInPerson,
      isElectionCommittee: userIsEC,
    });
  } catch (error) {
    console.error('Error fetching election:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Check if user is admin
    const isAdmin = await isUserAdminOfUnion(user.id, election.unionId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update elections' },
        { status: 403 }
      );
    }

    // Lock configuration changes once election is active or closed
    if (election.status === 'active' || election.status === 'closed') {
      // Allow only status transitions (e.g., manually closing an active election)
      const body = await req.json();
      const { status } = body;
      if (Object.keys(body).some((k) => k !== 'status') || !status) {
        return NextResponse.json(
          { error: 'Election configuration cannot be changed once it is active or closed. Only status transitions are permitted.' },
          { status: 403 }
        );
      }
      if (election.status === 'closed') {
        return NextResponse.json(
          { error: 'Closed elections cannot be modified.' },
          { status: 403 }
        );
      }
      // Allow closing an active election
      const updatedElection = await updateElection(electionId, { status, updatedBy: user.id } as any);
      return NextResponse.json({ success: true, election: updatedElection });
    }

    const body = await req.json();
    const validatedData = updateElectionSchema.parse(body);

    // Validate time ranges if both are provided
    if (validatedData.openTime && validatedData.closeTime) {
      const openTime = new Date(validatedData.openTime);
      const closeTime = new Date(validatedData.closeTime);

      if (closeTime <= openTime) {
        return NextResponse.json(
          { error: 'Close time must be after open time' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      ...validatedData,
      updatedBy: user.id,
    };

    if (validatedData.openTime) {
      updateData.openTime = new Date(validatedData.openTime);
    }
    if (validatedData.closeTime) {
      updateData.closeTime = new Date(validatedData.closeTime);
    }

    const updatedElection = await updateElection(electionId, updateData);

    return NextResponse.json({
      success: true,
      election: updatedElection,
    });
  } catch (error) {
    console.error('Error updating election:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update election' },
      { status: 500 }
    );
  }
}

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

    // Check if user is admin
    const isAdmin = await isUserAdminOfUnion(user.id, election.unionId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete elections' },
        { status: 403 }
      );
    }

    // Prevent deleting active or closed elections (ballot integrity)
    if (election.status === 'active' || election.status === 'closed') {
      return NextResponse.json(
        { error: 'Active or closed elections cannot be deleted. Close the election first if needed.' },
        { status: 403 }
      );
    }

    await deleteElection(electionId);

    return NextResponse.json({
      success: true,
      message: 'Election deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting election:', error);
    return NextResponse.json(
      { error: 'Failed to delete election' },
      { status: 500 }
    );
  }
}

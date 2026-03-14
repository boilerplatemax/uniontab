import { desc, eq, and, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  elections,
  electionQuestions,
  electionOptions,
  electionVotes,
  electionResponses,
  inPersonVotes,
  members,
  users,
  Election,
  ElectionQuestion,
  ElectionOption,
  ElectionVote,
  NewElection,
  NewElectionQuestion,
  NewElectionOption,
  NewElectionVote,
  NewElectionResponse,
  NewInPersonVote,
} from './schema';
import { hasPermission } from '@/lib/admin-permissions';

export type ElectionWithDetails = Election & {
  questions: (ElectionQuestion & {
    options: ElectionOption[];
  })[];
  _count: {
    votes: number;
  };
};

// Create a new election
export async function createElection(data: NewElection) {
  const [election] = await db.insert(elections).values(data).returning();
  return election;
}

// Create questions for an election
export async function createElectionQuestions(
  questions: NewElectionQuestion[]
) {
  if (questions.length === 0) return [];
  return await db.insert(electionQuestions).values(questions).returning();
}

// Create options for questions
export async function createElectionOptions(options: NewElectionOption[]) {
  if (options.length === 0) return [];
  return await db.insert(electionOptions).values(options).returning();
}

// Get election by ID with all details
export async function getElectionById(
  electionId: number
): Promise<ElectionWithDetails | null> {
  const [election] = await db
    .select()
    .from(elections)
    .where(eq(elections.id, electionId))
    .limit(1);

  if (!election) return null;

  const questions = await db
    .select()
    .from(electionQuestions)
    .where(eq(electionQuestions.electionId, electionId))
    .orderBy(electionQuestions.order);

  const questionsWithOptions = await Promise.all(
    questions.map(async (question) => {
      const options = await db
        .select()
        .from(electionOptions)
        .where(eq(electionOptions.questionId, question.id))
        .orderBy(electionOptions.order);

      return {
        ...question,
        options,
      };
    })
  );

  const [voteCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(electionVotes)
    .where(eq(electionVotes.electionId, electionId));

  return {
    ...election,
    questions: questionsWithOptions,
    _count: {
      votes: voteCount?.count || 0,
    },
  };
}

// Get election by slug
export async function getElectionBySlug(
  unionId: number,
  slug: string
): Promise<ElectionWithDetails | null> {
  const [election] = await db
    .select()
    .from(elections)
    .where(and(eq(elections.unionId, unionId), eq(elections.slug, slug)))
    .limit(1);

  if (!election) return null;

  return getElectionById(election.id);
}

// Get all elections for a union
export async function getUnionElections(unionId: number) {
  const allElections = await db
    .select()
    .from(elections)
    .where(eq(elections.unionId, unionId))
    .orderBy(desc(elections.createdAt));

  const electionsWithVoteCounts = await Promise.all(
    allElections.map(async (election) => {
      const [voteCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(electionVotes)
        .where(eq(electionVotes.electionId, election.id));

      return {
        ...election,
        _count: {
          votes: voteCount?.count || 0,
        },
      };
    })
  );

  return electionsWithVoteCounts;
}

// Check if user has voted in an election
export async function hasUserVoted(
  electionId: number,
  userId: number
): Promise<boolean> {
  const [vote] = await db
    .select()
    .from(electionVotes)
    .where(
      and(eq(electionVotes.electionId, electionId), eq(electionVotes.userId, userId))
    )
    .limit(1);

  return !!vote;
}

// Get user's vote for an election (if re-votes are allowed)
export async function getUserVote(electionId: number, userId: number) {
  const [vote] = await db
    .select()
    .from(electionVotes)
    .where(
      and(eq(electionVotes.electionId, electionId), eq(electionVotes.userId, userId))
    )
    .orderBy(desc(electionVotes.votedAt))
    .limit(1);

  if (!vote) return null;

  const responses = await db
    .select()
    .from(electionResponses)
    .where(eq(electionResponses.voteId, vote.id));

  return {
    ...vote,
    responses,
  };
}

// Cast a vote
export async function castVote(
  voteData: NewElectionVote,
  responses: Omit<NewElectionResponse, 'voteId'>[]
) {
  return await db.transaction(async (tx) => {
    // Create the vote record
    const [vote] = await tx.insert(electionVotes).values(voteData).returning();

    // Create response records with the vote ID
    const responsesWithVoteId = responses.map((response) => ({
      ...response,
      voteId: vote.id,
    }));

    await tx.insert(electionResponses).values(responsesWithVoteId);

    return vote;
  });
}

// Delete existing vote (for re-votes)
export async function deleteUserVote(electionId: number, userId: number) {
  await db
    .delete(electionVotes)
    .where(
      and(eq(electionVotes.electionId, electionId), eq(electionVotes.userId, userId))
    );
}

// Update election
export async function updateElection(
  electionId: number,
  data: Partial<NewElection>
) {
  const [updated] = await db
    .update(elections)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(elections.id, electionId))
    .returning();

  return updated;
}

// Delete election
export async function deleteElection(electionId: number) {
  await db.delete(elections).where(eq(elections.id, electionId));
}

// Get election results
export async function getElectionResults(electionId: number) {
  const election = await getElectionById(electionId);
  if (!election) return null;

  const results = await Promise.all(
    election.questions.map(async (question) => {
      const responses = await db
        .select()
        .from(electionResponses)
        .where(eq(electionResponses.questionId, question.id));

      // Calculate results based on question type
      let aggregatedResults: any = {};

      switch (question.questionType) {
        case 'yes_no':
        case 'multiple_choice':
          // Count votes for each option
          aggregatedResults = question.options.map((option) => {
            const count = responses.filter(
              (r) => r.selectedOptionId === option.id
            ).length;
            return {
              optionId: option.id,
              optionText: option.optionText,
              count,
              percentage:
                election._count.votes > 0
                  ? (count / election._count.votes) * 100
                  : 0,
            };
          });
          break;

        case 'multiple_answer':
          // Count how many times each option was selected
          aggregatedResults = question.options.map((option) => {
            const count = responses.filter((r) => {
              const selectedIds = r.selectedOptionIds as number[] | null;
              return selectedIds?.includes(option.id);
            }).length;
            return {
              optionId: option.id,
              optionText: option.optionText,
              count,
              percentage:
                election._count.votes > 0
                  ? (count / election._count.votes) * 100
                  : 0,
            };
          });
          break;

        case 'ranking':
          // Calculate average ranking for each option
          aggregatedResults = question.options.map((option) => {
            const rankings = responses
              .map((r) => {
                const rankingData = r.rankingData as number[] | null;
                return rankingData?.indexOf(option.id) ?? -1;
              })
              .filter((rank) => rank !== -1)
              .map((rank) => rank + 1); // Convert to 1-based ranking

            const avgRank =
              rankings.length > 0
                ? rankings.reduce((a, b) => a + b, 0) / rankings.length
                : 0;

            return {
              optionId: option.id,
              optionText: option.optionText,
              averageRank: avgRank,
              timesRanked: rankings.length,
            };
          });
          break;

        case 'scale':
          // Calculate average and distribution
          const scaleValues = responses
            .map((r) => r.scaleValue)
            .filter((v): v is number => v !== null);

          const avg =
            scaleValues.length > 0
              ? scaleValues.reduce((a, b) => a + b, 0) / scaleValues.length
              : 0;

          const distribution = scaleValues.reduce(
            (acc, val) => {
              acc[val] = (acc[val] || 0) + 1;
              return acc;
            },
            {} as Record<number, number>
          );

          aggregatedResults = {
            average: avg,
            count: scaleValues.length,
            distribution,
          };
          break;

        case 'text_short':
        case 'text_long':
          // Return all text responses (anonymized)
          aggregatedResults = responses
            .map((r) => r.responseText)
            .filter((text): text is string => text !== null);
          break;
      }

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        results: aggregatedResults,
      };
    })
  );

  return {
    election,
    results,
    totalVotes: election._count.votes,
  };
}

// Check if user is a member of the union
export async function isUserMemberOfUnion(
  userId: number,
  unionId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  return !!member && member.status === 'approved';
}

// Check if user is admin of the union
export async function isUserAdminOfUnion(
  userId: number,
  unionId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  return !!member && (member.role === 'owner' || member.role === 'admin');
}

// Get the member record for a user in a union
export async function getMemberRecord(userId: number, unionId: number) {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  return member || null;
}

// Check if user has election committee role
export async function isUserElectionCommittee(
  userId: number,
  unionId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  return !!member && member.role === 'election_committee' && member.status === 'approved';
}

// Check if user can view the voter roll (owner, admin with elections permission, or election_committee)
export async function canUserViewVoterRoll(
  userId: number,
  unionId: number
): Promise<boolean> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  if (!member || member.status !== 'approved') return false;

  if (member.role === 'owner') return true;
  if (member.role === 'election_committee') return true;
  if (member.role === 'admin' && hasPermission(member.role, member.adminPermissions as any, 'elections')) return true;

  return false;
}

// Get voter roll - get users who voted, then look up their member records
export async function getVoterRollForElection(electionId: number, unionId: number) {
  const votes = await db
    .select({
      voteId: electionVotes.id,
      votedAt: electionVotes.votedAt,
      userId: electionVotes.userId,
    })
    .from(electionVotes)
    .where(eq(electionVotes.electionId, electionId))
    .orderBy(electionVotes.votedAt);

  if (votes.length === 0) return [];

  const voterDetails = await Promise.all(
    votes.map(async (vote) => {
      const [member] = await db
        .select({
          memberId: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          memberId2: members.memberId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(eq(members.userId, vote.userId), eq(members.unionId, unionId)))
        .limit(1);

      return {
        voteId: vote.voteId,
        votedAt: vote.votedAt,
        member: member || null,
      };
    })
  );

  return voterDetails;
}

// Get in-person votes for an election
export async function getInPersonVotesForElection(electionId: number, unionId: number) {
  const votes = await db
    .select({
      id: inPersonVotes.id,
      memberId: inPersonVotes.memberId,
      markedAt: inPersonVotes.markedAt,
      notes: inPersonVotes.notes,
      markedById: inPersonVotes.markedById,
    })
    .from(inPersonVotes)
    .where(eq(inPersonVotes.electionId, electionId));

  if (votes.length === 0) return [];

  const votesWithDetails = await Promise.all(
    votes.map(async (vote) => {
      const [member] = await db
        .select({
          firstName: members.firstName,
          lastName: members.lastName,
          memberId: members.memberId,
          userName: users.name,
          userEmail: users.email,
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(and(eq(members.id, vote.memberId), eq(members.unionId, unionId)))
        .limit(1);

      const [markedByUser] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, vote.markedById))
        .limit(1);

      return {
        ...vote,
        member: member || null,
        markedBy: markedByUser || null,
      };
    })
  );

  return votesWithDetails;
}

// Check if a member has an in-person vote recorded
export async function hasInPersonVote(electionId: number, memberId: number): Promise<boolean> {
  const [vote] = await db
    .select()
    .from(inPersonVotes)
    .where(and(eq(inPersonVotes.electionId, electionId), eq(inPersonVotes.memberId, memberId)))
    .limit(1);

  return !!vote;
}

// Check if a user (by userId) has an in-person vote in an election
export async function hasUserInPersonVote(electionId: number, userId: number, unionId: number): Promise<boolean> {
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.unionId, unionId)))
    .limit(1);

  if (!member) return false;

  return hasInPersonVote(electionId, member.id);
}

// Mark a member as voted in person
export async function markInPersonVote(data: NewInPersonVote) {
  const [vote] = await db
    .insert(inPersonVotes)
    .values(data)
    .returning();

  return vote;
}

// Remove an in-person vote record (for corrections)
export async function removeInPersonVote(electionId: number, memberId: number) {
  await db
    .delete(inPersonVotes)
    .where(and(eq(inPersonVotes.electionId, electionId), eq(inPersonVotes.memberId, memberId)));
}

// Auto-update election status based on time
export async function updateElectionStatus(electionId: number) {
  const election = await getElectionById(electionId);
  if (!election) return null;

  const now = new Date();
  let newStatus = election.status;

  if (election.status === 'draft' && now >= election.openTime) {
    newStatus = 'active';
  } else if (election.status === 'active' && now >= election.closeTime) {
    newStatus = 'closed';
  }

  if (newStatus !== election.status) {
    return await updateElection(electionId, { status: newStatus });
  }

  return election;
}

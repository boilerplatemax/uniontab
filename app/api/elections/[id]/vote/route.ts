import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import {
  getElectionById,
  hasUserVoted,
  isUserMemberOfUnion,
  castVote,
  deleteUserVote,
  updateElectionStatus,
} from '@/lib/db/election-queries';

const responseSchema = z.object({
  questionId: z.number().int().positive(),
  responseText: z.string().optional(),
  selectedOptionId: z.number().int().positive().optional(),
  selectedOptionIds: z.array(z.number().int().positive()).optional(),
  rankingData: z.array(z.number().int().positive()).optional(),
  scaleValue: z.number().int().optional(),
});

const voteSchema = z.object({
  responses: z.array(responseSchema).min(1, 'At least one response is required'),
});

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

    // Update election status
    await updateElectionStatus(electionId);

    const election = await getElectionById(electionId);
    if (!election) {
      return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    }

    // Check if user is a member
    const isMember = await isUserMemberOfUnion(user.id, election.unionId);
    if (!isMember) {
      return NextResponse.json(
        { error: 'Only union members can vote' },
        { status: 403 }
      );
    }

    // Check election status - use server time to prevent timezone manipulation
    const now = new Date();

    if (election.status === 'draft') {
      return NextResponse.json(
        { error: 'This election has not opened yet' },
        { status: 400 }
      );
    }

    if (election.status === 'closed' || now >= election.closeTime) {
      return NextResponse.json(
        { error: 'This election has closed' },
        { status: 400 }
      );
    }

    if (now < election.openTime) {
      return NextResponse.json(
        { error: 'This election has not opened yet' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const userHasVoted = await hasUserVoted(election.id, user.id);
    if (userHasVoted && !election.allowRevotes) {
      return NextResponse.json(
        { error: 'You have already voted in this election' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = voteSchema.parse(body);

    // Validate responses match questions
    const questionIds = election.questions.map((q) => q.id);
    const requiredQuestionIds = election.questions
      .filter((q) => q.required)
      .map((q) => q.id);

    const responseQuestionIds = validatedData.responses.map((r) => r.questionId);

    // Check all required questions are answered
    const missingRequired = requiredQuestionIds.filter(
      (id) => !responseQuestionIds.includes(id)
    );
    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: 'All required questions must be answered' },
        { status: 400 }
      );
    }

    // Check all responses are for valid questions
    const invalidQuestions = responseQuestionIds.filter(
      (id) => !questionIds.includes(id)
    );
    if (invalidQuestions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid question ID in responses' },
        { status: 400 }
      );
    }

    // Validate each response against question type
    for (const response of validatedData.responses) {
      const question = election.questions.find((q) => q.id === response.questionId);
      if (!question) continue;

      switch (question.questionType) {
        case 'text_short':
        case 'text_long':
          if (!response.responseText) {
            return NextResponse.json(
              { error: `Text response required for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          break;

        case 'multiple_choice':
        case 'yes_no':
          if (!response.selectedOptionId) {
            return NextResponse.json(
              { error: `Option selection required for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          // Validate option exists
          if (!question.options.find((o) => o.id === response.selectedOptionId)) {
            return NextResponse.json(
              { error: `Invalid option for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          break;

        case 'multiple_answer':
          if (!response.selectedOptionIds || response.selectedOptionIds.length === 0) {
            return NextResponse.json(
              { error: `At least one option required for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          // Validate all options exist
          const validOptionIds = question.options.map((o) => o.id);
          const invalidOptions = response.selectedOptionIds.filter(
            (id) => !validOptionIds.includes(id)
          );
          if (invalidOptions.length > 0) {
            return NextResponse.json(
              { error: `Invalid options for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          break;

        case 'ranking':
          if (!response.rankingData || response.rankingData.length === 0) {
            return NextResponse.json(
              { error: `Ranking required for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          // Validate all options are ranked exactly once
          const optionIds = question.options.map((o) => o.id);
          const sortedRanking = [...response.rankingData].sort();
          const sortedOptions = [...optionIds].sort();
          if (JSON.stringify(sortedRanking) !== JSON.stringify(sortedOptions)) {
            return NextResponse.json(
              { error: `All options must be ranked exactly once for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          break;

        case 'scale':
          if (response.scaleValue === undefined || response.scaleValue === null) {
            return NextResponse.json(
              { error: `Scale value required for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          // Validate scale value is within range
          const settings = question.settings as { min?: number; max?: number } | null;
          const min = settings?.min ?? 1;
          const max = settings?.max ?? 10;
          if (response.scaleValue < min || response.scaleValue > max) {
            return NextResponse.json(
              { error: `Scale value must be between ${min} and ${max} for question: ${question.questionText}` },
              { status: 400 }
            );
          }
          break;
      }
    }

    // If re-voting, delete previous vote
    if (userHasVoted && election.allowRevotes) {
      await deleteUserVote(election.id, user.id);
    }

    // Get client timezone from request headers
    const clientTimezone =
      req.headers.get('x-timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Get IP address for audit trail
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      null;

    // Cast the vote
    await castVote(
      {
        electionId: election.id,
        userId: user.id,
        clientTimezone,
        ipAddress,
      },
      validatedData.responses.map((r) => ({
        questionId: r.questionId,
        responseText: r.responseText || null,
        selectedOptionId: r.selectedOptionId || null,
        selectedOptionIds: r.selectedOptionIds || null,
        rankingData: r.rankingData || null,
        scaleValue: r.scaleValue || null,
      }))
    );

    return NextResponse.json({
      success: true,
      message: 'Vote recorded successfully',
    });
  } catch (error) {
    console.error('Error casting vote:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}

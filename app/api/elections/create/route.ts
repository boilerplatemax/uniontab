import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/db/queries';
import {
  createElection,
  createElectionQuestions,
  createElectionOptions,
  isUserAdminOfUnion,
} from '@/lib/db/election-queries';
import { QuestionType } from '@/lib/db/schema';

const questionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.nativeEnum(QuestionType),
  order: z.number().int().min(0).default(0),
  required: z.boolean().default(true),
  settings: z.any().optional(),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        order: z.number().int().min(0).default(0),
      })
    )
    .optional(),
});

const createElectionSchema = z.object({
  unionId: z.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  openTime: z.string().datetime(),
  closeTime: z.string().datetime(),
  timezone: z.string().default('UTC'),
  allowRevotes: z.boolean().default(false),
  resultsVisibility: z.enum(['hidden', 'members', 'public']).default('hidden'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createElectionSchema.parse(body);

    // Check if user is admin of the union
    const isAdmin = await isUserAdminOfUnion(user.id, validatedData.unionId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'You must be an admin to create elections' },
        { status: 403 }
      );
    }

    // Validate time ranges
    const openTime = new Date(validatedData.openTime);
    const closeTime = new Date(validatedData.closeTime);

    if (closeTime <= openTime) {
      return NextResponse.json(
        { error: 'Close time must be after open time' },
        { status: 400 }
      );
    }

    // Determine initial status based on current time
    const now = new Date();
    let status = 'draft';
    if (now >= openTime && now < closeTime) {
      status = 'active';
    } else if (now >= closeTime) {
      status = 'closed';
    }

    // Create the election
    const election = await createElection({
      unionId: validatedData.unionId,
      title: validatedData.title,
      description: validatedData.description || null,
      slug: validatedData.slug,
      openTime: openTime,
      closeTime: closeTime,
      timezone: validatedData.timezone,
      status,
      allowRevotes: validatedData.allowRevotes,
      resultsVisibility: validatedData.resultsVisibility,
      createdBy: user.id,
      updatedBy: null,
    });

    // Create questions
    const questions = await createElectionQuestions(
      validatedData.questions.map((q, index) => ({
        electionId: election.id,
        questionText: q.questionText,
        questionType: q.questionType,
        order: q.order ?? index,
        required: q.required,
        settings: q.settings || null,
      }))
    );

    // Create options for questions that need them
    const optionsToCreate = [];
    for (let i = 0; i < validatedData.questions.length; i++) {
      const questionData = validatedData.questions[i];
      const questionRecord = questions[i];

      if (
        questionData.options &&
        questionData.options.length > 0 &&
        [
          'multiple_choice',
          'multiple_answer',
          'ranking',
          'yes_no',
        ].includes(questionData.questionType)
      ) {
        for (const option of questionData.options) {
          optionsToCreate.push({
            questionId: questionRecord.id,
            optionText: option.optionText,
            order: option.order,
          });
        }
      }
    }

    if (optionsToCreate.length > 0) {
      await createElectionOptions(optionsToCreate);
    }

    return NextResponse.json(
      {
        success: true,
        election: {
          id: election.id,
          slug: election.slug,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating election:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create election' },
      { status: 500 }
    );
  }
}

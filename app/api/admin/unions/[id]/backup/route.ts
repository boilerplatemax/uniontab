import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  unions,
  members,
  posts,
  events,
  files,
  unionPages,
  activityLogs,
  invitations,
  elections,
  electionQuestions,
  electionOptions,
  electionVotes,
  electionResponses,
  announcements,
  announcementAttachments,
  fileCategories,
  postAttachments,
  postLikes,
  users,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user is webmaster
    const sessionCookie = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie);

    // Get user to check role
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const unionId = parseInt(params.id);

    // Fetch union and all related data
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Fetch all related data
    const [
      unionMembers,
      unionPosts,
      unionEvents,
      unionFiles,
      unionPages_,
      unionActivityLogs,
      unionInvitations,
      unionElections,
      unionAnnouncements,
      unionFileCategories,
    ] = await Promise.all([
      db.select().from(members).where(eq(members.unionId, unionId)),
      db.select().from(posts).where(eq(posts.unionId, unionId)),
      db.select().from(events).where(eq(events.unionId, unionId)),
      db.select().from(files).where(eq(files.unionId, unionId)),
      db.select().from(unionPages).where(eq(unionPages.unionId, unionId)),
      db.select().from(activityLogs).where(eq(activityLogs.unionId, unionId)),
      db.select().from(invitations).where(eq(invitations.unionId, unionId)),
      db.select().from(elections).where(eq(elections.unionId, unionId)),
      db.select().from(announcements).where(eq(announcements.unionId, unionId)),
      db.select().from(fileCategories).where(eq(fileCategories.unionId, unionId)),
    ]);

    // Fetch post-related data
    const postIds = unionPosts.map((p) => p.id);
    const postAttachmentsData =
      postIds.length > 0
        ? await Promise.all(
            postIds.map((postId) =>
              db.select().from(postAttachments).where(eq(postAttachments.postId, postId))
            )
          ).then((results) => results.flat())
        : [];

    const postLikesData =
      postIds.length > 0
        ? await Promise.all(
            postIds.map((postId) =>
              db.select().from(postLikes).where(eq(postLikes.postId, postId))
            )
          ).then((results) => results.flat())
        : [];

    // Fetch election-related data
    const electionIds = unionElections.map((e) => e.id);
    const electionQuestionsData =
      electionIds.length > 0
        ? await Promise.all(
            electionIds.map((electionId) =>
              db
                .select()
                .from(electionQuestions)
                .where(eq(electionQuestions.electionId, electionId))
            )
          ).then((results) => results.flat())
        : [];

    const questionIds = electionQuestionsData.map((q) => q.id);
    const electionOptionsData =
      questionIds.length > 0
        ? await Promise.all(
            questionIds.map((questionId) =>
              db
                .select()
                .from(electionOptions)
                .where(eq(electionOptions.questionId, questionId))
            )
          ).then((results) => results.flat())
        : [];

    const electionVotesData =
      electionIds.length > 0
        ? await Promise.all(
            electionIds.map((electionId) =>
              db.select().from(electionVotes).where(eq(electionVotes.electionId, electionId))
            )
          ).then((results) => results.flat())
        : [];

    const voteIds = electionVotesData.map((v) => v.id);
    const electionResponsesData =
      voteIds.length > 0
        ? await Promise.all(
            voteIds.map((voteId) =>
              db
                .select()
                .from(electionResponses)
                .where(eq(electionResponses.voteId, voteId))
            )
          ).then((results) => results.flat())
        : [];

    // Fetch announcement-related data
    const announcementIds = unionAnnouncements.map((a) => a.id);
    const announcementAttachmentsData =
      announcementIds.length > 0
        ? await Promise.all(
            announcementIds.map((announcementId) =>
              db
                .select()
                .from(announcementAttachments)
                .where(eq(announcementAttachments.announcementId, announcementId))
            )
          ).then((results) => results.flat())
        : [];

    // Create backup object
    const backup = {
      exportedAt: new Date().toISOString(),
      union,
      members: unionMembers,
      posts: unionPosts,
      postAttachments: postAttachmentsData,
      postLikes: postLikesData,
      events: unionEvents,
      files: unionFiles,
      fileCategories: unionFileCategories,
      pages: unionPages_,
      activityLogs: unionActivityLogs,
      invitations: unionInvitations,
      elections: unionElections,
      electionQuestions: electionQuestionsData,
      electionOptions: electionOptionsData,
      electionVotes: electionVotesData,
      electionResponses: electionResponsesData,
      announcements: unionAnnouncements,
      announcementAttachments: announcementAttachmentsData,
    };

    // Return as downloadable JSON
    const response = new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${union.slug}-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}

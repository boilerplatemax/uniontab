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
  dismissedAnnouncements,
  fileCategories,
  postAttachments,
  postLikes,
  users,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email/sendgrid';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify user is webmaster
    const sessionCookie = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie);

    // Get user to check role
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== 'webmaster') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const unionId = parseInt(id);

    // Get union details first
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionId))
      .limit(1);

    if (!union) {
      return NextResponse.json({ error: 'Union not found' }, { status: 404 });
    }

    // Get all members to notify them and collect user emails
    const unionMembers = await db
      .select({
        userId: members.userId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(members)
      .innerJoin(users, eq(members.userId, users.id))
      .where(eq(members.unionId, unionId));

    // Get user IDs to check for orphaned accounts later
    const unionMemberUserIds = unionMembers.map(m => m.userId);

    // Get all elections to delete their related data
    const unionElections = await db
      .select()
      .from(elections)
      .where(eq(elections.unionId, unionId));

    const electionIds = unionElections.map((e) => e.id);

    // Get all questions for these elections
    const electionQuestionsData =
      electionIds.length > 0
        ? await db
            .select()
            .from(electionQuestions)
            .where(inArray(electionQuestions.electionId, electionIds))
        : [];

    const questionIds = electionQuestionsData.map((q) => q.id);

    // Get all posts to delete their related data
    const unionPosts = await db
      .select()
      .from(posts)
      .where(eq(posts.unionId, unionId));

    const postIds = unionPosts.map((p) => p.id);

    // Get all announcements to delete their related data
    const unionAnnouncements = await db
      .select()
      .from(announcements)
      .where(eq(announcements.unionId, unionId));

    const announcementIds = unionAnnouncements.map((a) => a.id);

    // Get all votes to delete their responses
    const electionVotesData =
      electionIds.length > 0
        ? await db
            .select()
            .from(electionVotes)
            .where(inArray(electionVotes.electionId, electionIds))
        : [];

    const voteIds = electionVotesData.map((v) => v.id);

    console.log(`Starting deletion of union: ${union.name} (ID: ${unionId})`);

    // Delete all related data in correct order (children first, then parents)
    // Note: Some tables have cascade delete set up in schema, but we'll be explicit

    // 1. Delete election responses (child of votes)
    if (voteIds.length > 0) {
      await db
        .delete(electionResponses)
        .where(inArray(electionResponses.voteId, voteIds));
      console.log('Deleted election responses');
    }

    // 2. Delete election votes
    if (electionIds.length > 0) {
      await db
        .delete(electionVotes)
        .where(inArray(electionVotes.electionId, electionIds));
      console.log('Deleted election votes');
    }

    // 3. Delete election options (child of questions)
    if (questionIds.length > 0) {
      await db
        .delete(electionOptions)
        .where(inArray(electionOptions.questionId, questionIds));
      console.log('Deleted election options');
    }

    // 4. Delete election questions (child of elections)
    if (electionIds.length > 0) {
      await db
        .delete(electionQuestions)
        .where(inArray(electionQuestions.electionId, electionIds));
      console.log('Deleted election questions');
    }

    // 5. Delete elections
    if (electionIds.length > 0) {
      await db.delete(elections).where(inArray(elections.id, electionIds));
      console.log('Deleted elections');
    }

    // 6. Delete post attachments and likes
    if (postIds.length > 0) {
      await db
        .delete(postAttachments)
        .where(inArray(postAttachments.postId, postIds));
      await db.delete(postLikes).where(inArray(postLikes.postId, postIds));
      console.log('Deleted post attachments and likes');
    }

    // 7. Delete posts
    await db.delete(posts).where(eq(posts.unionId, unionId));
    console.log('Deleted posts');

    // 8. Delete announcement attachments and dismissals
    if (announcementIds.length > 0) {
      await db
        .delete(announcementAttachments)
        .where(inArray(announcementAttachments.announcementId, announcementIds));
      await db
        .delete(dismissedAnnouncements)
        .where(inArray(dismissedAnnouncements.announcementId, announcementIds));
      console.log('Deleted announcement attachments and dismissals');
    }

    // 9. Delete announcements
    await db.delete(announcements).where(eq(announcements.unionId, unionId));
    console.log('Deleted announcements');

    // 10. Delete events
    await db.delete(events).where(eq(events.unionId, unionId));
    console.log('Deleted events');

    // 11. Delete files and file categories
    await db.delete(files).where(eq(files.unionId, unionId));
    await db.delete(fileCategories).where(eq(fileCategories.unionId, unionId));
    console.log('Deleted files and file categories');

    // 12. Delete union pages
    await db.delete(unionPages).where(eq(unionPages.unionId, unionId));
    console.log('Deleted union pages');

    // 13. Delete activity logs
    await db.delete(activityLogs).where(eq(activityLogs.unionId, unionId));
    console.log('Deleted activity logs');

    // 14. Delete invitations
    await db.delete(invitations).where(eq(invitations.unionId, unionId));
    console.log('Deleted invitations');

    // 15. Delete members
    await db.delete(members).where(eq(members.unionId, unionId));
    console.log('Deleted members');

    // 16. Finally, delete the union itself
    await db.delete(unions).where(eq(unions.id, unionId));
    console.log('Deleted union');

    // 17. Clean up orphaned user accounts
    // For each user that was a member of this union, check if they have other memberships
    // If not, delete their user account
    const orphanedUserIds: number[] = [];
    for (const userId of unionMemberUserIds) {
      const otherMemberships = await db
        .select()
        .from(members)
        .where(eq(members.userId, userId))
        .limit(1);

      // If no other memberships exist, this user account can be deleted
      if (otherMemberships.length === 0) {
        orphanedUserIds.push(userId);
      }
    }

    // Delete orphaned user accounts (cascade deletes will handle related data)
    if (orphanedUserIds.length > 0) {
      await db
        .delete(users)
        .where(inArray(users.id, orphanedUserIds));
      console.log(`Deleted ${orphanedUserIds.length} orphaned user accounts`);
    }

    // Send notification emails to all members
    const emailPromises = unionMembers.map(async (member) => {
      try {
        await sendEmail({
          to: member.userEmail,
          subject: `Important: ${union.publicName || union.name} Account Deleted`,
          text: `Dear ${member.userName},

This email is to inform you that the union account "${union.publicName || union.name}" has been deleted from UnionTab.

All data associated with this union, including posts, events, files, and member information, has been permanently removed from our system.

If you believe this was done in error or have any questions, please contact us at info@uniontab.com and we will be happy to assist you.

Thank you for your understanding.

Best regards,
The UnionTab Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Important: Union Account Deleted</h2>
              <p>Dear ${member.userName},</p>
              <p>This email is to inform you that the union account "<strong>${union.publicName || union.name}</strong>" has been deleted from UnionTab.</p>
              <p>All data associated with this union, including posts, events, files, and member information, has been permanently removed from our system.</p>
              <p>If you believe this was done in error or have any questions, please contact us at <a href="mailto:info@uniontab.com">info@uniontab.com</a> and we will be happy to assist you.</p>
              <p>Thank you for your understanding.</p>
              <p>Best regards,<br>The UnionTab Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(
          `Failed to send deletion notification to ${member.userEmail}:`,
          emailError
        );
      }
    });

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises);

    console.log(`Successfully deleted union: ${union.name} (ID: ${unionId})`);

    return NextResponse.json({
      message: 'Union and all related data deleted successfully',
      deletedUnion: union.name,
      notifiedMembers: unionMembers.length,
      orphanedUsersDeleted: orphanedUserIds.length,
    });
  } catch (error) {
    console.error('Error deleting union:', error);
    return NextResponse.json(
      { error: 'Failed to delete union' },
      { status: 500 }
    );
  }
}

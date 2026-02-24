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
  massEmails,
  emailLogs,
  unionEmailDomains,
  dues,
  duesReceipts,
  duesCycles,
  duesAuditLog,
} from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth/session';
import { sendEmail } from '@/lib/email/sendgrid';
import { stripe } from '@/lib/payments/stripe';

// Force this route to use Node.js runtime to support bcryptjs
export const runtime = 'nodejs';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sessionCookie = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie);

    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== 'webmaster') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const unionId = parseInt(id);
    const body = await request.json();

    const { extraMemberLimit, extraMonthlyEmails, extraMonthlySMS, extraStorageBytes, requireEmailVerification } = body;

    const updateValues: Record<string, unknown> = {
      extraMemberLimit: Math.max(0, parseInt(extraMemberLimit) || 0),
      extraMonthlyEmails: Math.max(0, parseInt(extraMonthlyEmails) || 0),
      extraMonthlySMS: Math.max(0, parseInt(extraMonthlySMS) || 0),
      extraStorageBytes: Math.max(0, parseInt(extraStorageBytes) || 0),
    };

    if (typeof requireEmailVerification === 'boolean') {
      updateValues.requireEmailVerification = requireEmailVerification;
    }

    await db
      .update(unions)
      .set(updateValues)
      .where(eq(unions.id, unionId));

    return NextResponse.json({ success: true, message: 'Privileges updated successfully' });
  } catch (error) {
    console.error('Error updating union privileges:', error);
    return NextResponse.json({ error: 'Failed to update privileges' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    console.log(`Starting deletion of union: ${union.name} (ID: ${unionId})`);

    // =====================================================
    // STEP 1: Clean up external services (Stripe)
    // =====================================================

    // Cancel Stripe subscription if one exists
    if (union.stripeSubscriptionId) {
      try {
        console.log(`Canceling Stripe subscription (ID: ${union.stripeSubscriptionId})...`);
        await stripe.subscriptions.cancel(union.stripeSubscriptionId);
        console.log('Successfully canceled Stripe subscription');
      } catch (error) {
        console.error('Failed to cancel Stripe subscription:', error);
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // =====================================================
    // STEP 2: Collect data for deletion and notifications
    // =====================================================

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

    // Get all mass emails to delete their logs
    const unionMassEmails = await db
      .select()
      .from(massEmails)
      .where(eq(massEmails.unionId, unionId));

    const massEmailIds = unionMassEmails.map((e) => e.id);

    // =====================================================
    // STEP 3: Delete all related data
    // =====================================================
    console.log('Starting database cleanup...');

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

    // 16. Delete email logs (child of mass emails)
    if (massEmailIds.length > 0) {
      await db
        .delete(emailLogs)
        .where(inArray(emailLogs.massEmailId, massEmailIds));
      console.log('Deleted email logs');
    }

    // 17. Delete mass emails
    await db.delete(massEmails).where(eq(massEmails.unionId, unionId));
    console.log('Deleted mass emails');

    // 18. Delete dues receipts (child of dues)
    await db.delete(duesReceipts).where(eq(duesReceipts.unionId, unionId));
    console.log('Deleted dues receipts');

    // 19. Delete dues
    await db.delete(dues).where(eq(dues.unionId, unionId));
    console.log('Deleted dues');

    // 20. Delete dues cycles
    await db.delete(duesCycles).where(eq(duesCycles.unionId, unionId));
    console.log('Deleted dues cycles');

    // 21. Delete dues audit log
    await db.delete(duesAuditLog).where(eq(duesAuditLog.unionId, unionId));
    console.log('Deleted dues audit log');

    // 22. Delete union email domains (DNS cleanup already done above)
    await db.delete(unionEmailDomains).where(eq(unionEmailDomains.unionId, unionId));
    console.log('Deleted union email domains');

    // 23. Finally, delete the union itself
    await db.delete(unions).where(eq(unions.id, unionId));
    console.log('Deleted union');

    // =====================================================
    // STEP 4: Clean up orphaned user accounts
    // =====================================================
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

    // =====================================================
    // STEP 5: Send notification emails to all affected members
    // =====================================================
    // Format union name for email (uppercase name + local number)
    const unionDisplayName = `${union.name.toUpperCase()}${union.localNumber ? ` ${union.localNumber}` : ''}`;

    const emailPromises = unionMembers.map(async (member) => {
      try {
        await sendEmail({
          to: member.userEmail,
          subject: `Important: ${unionDisplayName} Account Deleted`,
          text: `Dear ${member.userName},

This email is to inform you that the union account "${unionDisplayName}" has been deleted from UnionTab.

All data associated with this union, including posts, events, files, and member information, has been permanently removed from our system.

If you believe this was done in error or have any questions, please contact us at info@uniontab.com and we will be happy to assist you.

Thank you for your understanding.

Best regards,
The UnionTab Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Important: Union Account Deleted</h2>
              <p>Dear ${member.userName},</p>
              <p>This email is to inform you that the union account "<strong>${unionDisplayName}</strong>" has been deleted from UnionTab.</p>
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
      externalServicesCleanedUp: {
        stripe: union.stripeSubscriptionId ? true : false,
      },
    });
  } catch (error) {
    console.error('Error deleting union:', error);
    return NextResponse.json(
      { error: 'Failed to delete union' },
      { status: 500 }
    );
  }
}

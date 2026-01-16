import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import {
  unions,
  members,
  massEmails,
  emailLogs,
  massSMS,
  smsLogs,
  posts,
  postLikes,
  events,
  files,
  elections,
  electionVotes,
  grievances,
  dues,
  activityLogs,
  strikes,
  picketAssignments,
  announcements,
  meetings,
} from '@/lib/db/schema';
import { eq, and, count, sql, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');

    if (!unionId) {
      return NextResponse.json(
        { error: 'Missing unionId parameter' },
        { status: 400 }
      );
    }

    const unionIdInt = parseInt(unionId);

    // Check if user is an owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionIdInt),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only union owners can view analytics' },
        { status: 403 }
      );
    }

    // Get union data
    const [union] = await db
      .select()
      .from(unions)
      .where(eq(unions.id, unionIdInt))
      .limit(1);

    if (!union) {
      return NextResponse.json(
        { error: 'Union not found' },
        { status: 404 }
      );
    }

    // Get date ranges for analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // Fetch all analytics data in parallel
    const [
      memberStats,
      membersByStatus,
      membersByRole,
      memberGrowth,
      emailStats,
      emailHistory,
      smsStats,
      smsHistory,
      postStats,
      postEngagement,
      eventStats,
      upcomingEvents,
      fileStats,
      electionStats,
      grievanceStats,
      grievancesByStatus,
      duesStats,
      activityStats,
      recentActivity,
      strikeStats,
      announcementStats,
      meetingStats,
      storageUsage,
    ] = await Promise.all([
      // Member statistics
      db
        .select({
          total: count(),
          approved: sql<number>`count(*) filter (where ${members.status} = 'approved')`,
          pending: sql<number>`count(*) filter (where ${members.status} = 'pending')`,
          rejected: sql<number>`count(*) filter (where ${members.status} = 'rejected')`,
        })
        .from(members)
        .where(eq(members.unionId, unionIdInt)),

      // Members by status breakdown
      db
        .select({
          status: members.status,
          count: count(),
        })
        .from(members)
        .where(eq(members.unionId, unionIdInt))
        .groupBy(members.status),

      // Members by role
      db
        .select({
          role: members.role,
          count: count(),
        })
        .from(members)
        .where(eq(members.unionId, unionIdInt))
        .groupBy(members.role),

      // Member growth over last 6 months (monthly)
      db
        .select({
          month: sql<string>`to_char(${members.joinedAt}, 'YYYY-MM')`,
          count: count(),
        })
        .from(members)
        .where(
          and(
            eq(members.unionId, unionIdInt),
            gte(members.joinedAt, sixMonthsAgo)
          )
        )
        .groupBy(sql`to_char(${members.joinedAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${members.joinedAt}, 'YYYY-MM')`),

      // Email statistics
      db
        .select({
          totalCampaigns: count(),
          totalSent: sql<number>`coalesce(sum(${massEmails.totalRecipients}), 0)`,
          totalSuccess: sql<number>`coalesce(sum(${massEmails.successCount}), 0)`,
          totalFailed: sql<number>`coalesce(sum(${massEmails.failureCount}), 0)`,
        })
        .from(massEmails)
        .where(eq(massEmails.unionId, unionIdInt)),

      // Email history (last 6 months)
      db
        .select({
          month: sql<string>`to_char(${massEmails.sentAt}, 'YYYY-MM')`,
          count: count(),
          totalSent: sql<number>`coalesce(sum(${massEmails.totalRecipients}), 0)`,
        })
        .from(massEmails)
        .where(
          and(
            eq(massEmails.unionId, unionIdInt),
            gte(massEmails.sentAt, sixMonthsAgo)
          )
        )
        .groupBy(sql`to_char(${massEmails.sentAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${massEmails.sentAt}, 'YYYY-MM')`),

      // SMS statistics
      db
        .select({
          totalCampaigns: count(),
          totalSent: sql<number>`coalesce(sum(${massSMS.totalRecipients}), 0)`,
          totalSuccess: sql<number>`coalesce(sum(${massSMS.successCount}), 0)`,
          totalFailed: sql<number>`coalesce(sum(${massSMS.failureCount}), 0)`,
        })
        .from(massSMS)
        .where(eq(massSMS.unionId, unionIdInt)),

      // SMS history (last 6 months)
      db
        .select({
          month: sql<string>`to_char(${massSMS.sentAt}, 'YYYY-MM')`,
          count: count(),
          totalSent: sql<number>`coalesce(sum(${massSMS.totalRecipients}), 0)`,
        })
        .from(massSMS)
        .where(
          and(
            eq(massSMS.unionId, unionIdInt),
            gte(massSMS.sentAt, sixMonthsAgo)
          )
        )
        .groupBy(sql`to_char(${massSMS.sentAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${massSMS.sentAt}, 'YYYY-MM')`),

      // Post statistics
      db
        .select({
          total: count(),
          public: sql<number>`count(*) filter (where ${posts.isPrivate} = false)`,
          private: sql<number>`count(*) filter (where ${posts.isPrivate} = true)`,
          pinned: sql<number>`count(*) filter (where ${posts.isPinned} = true)`,
        })
        .from(posts)
        .where(eq(posts.unionId, unionIdInt)),

      // Post engagement (likes per post - top 5)
      db
        .select({
          postId: posts.id,
          title: posts.title,
          likes: count(postLikes.id),
          createdAt: posts.createdAt,
        })
        .from(posts)
        .leftJoin(postLikes, eq(posts.id, postLikes.postId))
        .where(eq(posts.unionId, unionIdInt))
        .groupBy(posts.id, posts.title, posts.createdAt)
        .orderBy(desc(count(postLikes.id)))
        .limit(5),

      // Event statistics
      db
        .select({
          total: count(),
          upcoming: sql<number>`count(*) filter (where ${events.startDate} >= now())`,
          past: sql<number>`count(*) filter (where ${events.startDate} < now())`,
          public: sql<number>`count(*) filter (where ${events.isPrivate} = false)`,
          private: sql<number>`count(*) filter (where ${events.isPrivate} = true)`,
        })
        .from(events)
        .where(eq(events.unionId, unionIdInt)),

      // Upcoming events (next 5)
      db
        .select({
          id: events.id,
          title: events.title,
          startDate: events.startDate,
          location: events.location,
        })
        .from(events)
        .where(
          and(
            eq(events.unionId, unionIdInt),
            gte(events.startDate, now)
          )
        )
        .orderBy(events.startDate)
        .limit(5),

      // File statistics
      db
        .select({
          total: count(),
          public: sql<number>`count(*) filter (where ${files.isPrivate} = false)`,
          private: sql<number>`count(*) filter (where ${files.isPrivate} = true)`,
          totalSize: sql<number>`coalesce(sum(${files.fileSize}), 0)`,
        })
        .from(files)
        .where(eq(files.unionId, unionIdInt)),

      // Election statistics
      db
        .select({
          total: count(),
          draft: sql<number>`count(*) filter (where ${elections.status} = 'draft')`,
          active: sql<number>`count(*) filter (where ${elections.status} = 'active')`,
          closed: sql<number>`count(*) filter (where ${elections.status} = 'closed')`,
        })
        .from(elections)
        .where(eq(elections.unionId, unionIdInt)),

      // Grievance statistics
      db
        .select({
          total: count(),
          open: sql<number>`count(*) filter (where ${grievances.status} not in ('resolved'))`,
          resolved: sql<number>`count(*) filter (where ${grievances.status} = 'resolved')`,
          archived: sql<number>`count(*) filter (where ${grievances.isArchived} = true)`,
        })
        .from(grievances)
        .where(eq(grievances.unionId, unionIdInt)),

      // Grievances by status
      db
        .select({
          status: grievances.status,
          count: count(),
        })
        .from(grievances)
        .where(eq(grievances.unionId, unionIdInt))
        .groupBy(grievances.status),

      // Dues statistics
      db
        .select({
          total: count(),
          paid: sql<number>`count(*) filter (where ${dues.paymentStatus} = 'paid')`,
          unpaid: sql<number>`count(*) filter (where ${dues.paymentStatus} = 'unpaid')`,
          partial: sql<number>`count(*) filter (where ${dues.paymentStatus} = 'partial')`,
          waived: sql<number>`count(*) filter (where ${dues.paymentStatus} = 'waived')`,
          totalOwed: sql<number>`coalesce(sum(${dues.amount}), 0)`,
          totalCollected: sql<number>`coalesce(sum(${dues.paidAmount}), 0)`,
        })
        .from(dues)
        .where(eq(dues.unionId, unionIdInt)),

      // Activity statistics (last 30 days)
      db
        .select({
          total: count(),
          signIns: sql<number>`count(*) filter (where ${activityLogs.action} = 'SIGN_IN')`,
          uniqueUsers: sql<number>`count(distinct ${activityLogs.userId})`,
        })
        .from(activityLogs)
        .where(
          and(
            eq(activityLogs.unionId, unionIdInt),
            gte(activityLogs.timestamp, thirtyDaysAgo)
          )
        ),

      // Recent activity (last 10 actions)
      db
        .select({
          id: activityLogs.id,
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          userId: activityLogs.userId,
        })
        .from(activityLogs)
        .where(eq(activityLogs.unionId, unionIdInt))
        .orderBy(desc(activityLogs.timestamp))
        .limit(10),

      // Strike statistics
      db
        .select({
          total: count(),
          preparing: sql<number>`count(*) filter (where ${strikes.status} = 'preparing')`,
          active: sql<number>`count(*) filter (where ${strikes.status} = 'active')`,
          resolved: sql<number>`count(*) filter (where ${strikes.status} = 'resolved')`,
        })
        .from(strikes)
        .where(eq(strikes.unionId, unionIdInt)),

      // Announcement statistics
      db
        .select({
          total: count(),
          active: sql<number>`count(*) filter (where ${announcements.isActive} = true)`,
          popup: sql<number>`count(*) filter (where ${announcements.type} = 'popup')`,
          banner: sql<number>`count(*) filter (where ${announcements.type} = 'banner')`,
        })
        .from(announcements)
        .where(eq(announcements.unionId, unionIdInt)),

      // Meeting statistics
      db
        .select({
          total: count(),
          scheduled: sql<number>`count(*) filter (where ${meetings.status} = 'scheduled')`,
          completed: sql<number>`count(*) filter (where ${meetings.status} = 'completed')`,
          cancelled: sql<number>`count(*) filter (where ${meetings.status} = 'cancelled')`,
        })
        .from(meetings)
        .where(eq(meetings.unionId, unionIdInt)),

      // Storage usage from union record
      Promise.resolve({
        usedBytes: union.storageUsedBytes,
        monthlyEmailsSent: union.monthlyEmailsSent,
        monthlySMSSent: union.monthlySMSSent,
      }),
    ]);

    // Calculate activity by day for last 7 days
    const activityByDay = await db
      .select({
        date: sql<string>`to_char(${activityLogs.timestamp}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.unionId, unionIdInt),
          gte(activityLogs.timestamp, sevenDaysAgo)
        )
      )
      .groupBy(sql`to_char(${activityLogs.timestamp}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${activityLogs.timestamp}, 'YYYY-MM-DD')`);

    // Calculate member communication preferences
    const communicationPrefs = await db
      .select({
        allowEmails: sql<number>`count(*) filter (where ${members.allowEmails} = true)`,
        allowTextMessages: sql<number>`count(*) filter (where ${members.allowTextMessages} = true)`,
        allowPhoneCalls: sql<number>`count(*) filter (where ${members.allowPhoneCalls} = true)`,
        allowPushNotifications: sql<number>`count(*) filter (where ${members.allowPushNotifications} = true)`,
      })
      .from(members)
      .where(
        and(
          eq(members.unionId, unionIdInt),
          eq(members.status, 'approved')
        )
      );

    // Calculate delinquent members count
    const [delinquentMembers] = await db
      .select({
        count: count(),
      })
      .from(members)
      .where(
        and(
          eq(members.unionId, unionIdInt),
          eq(members.isDelinquent, true)
        )
      );

    // Calculate election participation rates
    const electionParticipation = await db
      .select({
        electionId: elections.id,
        title: elections.title,
        totalVotes: count(electionVotes.id),
        status: elections.status,
      })
      .from(elections)
      .leftJoin(electionVotes, eq(elections.id, electionVotes.electionId))
      .where(eq(elections.unionId, unionIdInt))
      .groupBy(elections.id, elections.title, elections.status)
      .orderBy(desc(elections.createdAt))
      .limit(5);

    // Format response
    const analytics = {
      overview: {
        totalMembers: memberStats[0]?.total || 0,
        approvedMembers: memberStats[0]?.approved || 0,
        pendingMembers: memberStats[0]?.pending || 0,
        rejectedMembers: memberStats[0]?.rejected || 0,
        delinquentMembers: delinquentMembers?.count || 0,
        monthlyEmailsSent: storageUsage.monthlyEmailsSent,
        monthlySMSSent: storageUsage.monthlySMSSent,
        storageUsedBytes: storageUsage.usedBytes,
      },
      members: {
        byStatus: membersByStatus,
        byRole: membersByRole,
        growth: memberGrowth,
        communicationPrefs: communicationPrefs[0] || {
          allowEmails: 0,
          allowTextMessages: 0,
          allowPhoneCalls: 0,
          allowPushNotifications: 0,
        },
      },
      communications: {
        email: {
          totalCampaigns: emailStats[0]?.totalCampaigns || 0,
          totalSent: emailStats[0]?.totalSent || 0,
          totalSuccess: emailStats[0]?.totalSuccess || 0,
          totalFailed: emailStats[0]?.totalFailed || 0,
          history: emailHistory,
        },
        sms: {
          totalCampaigns: smsStats[0]?.totalCampaigns || 0,
          totalSent: smsStats[0]?.totalSent || 0,
          totalSuccess: smsStats[0]?.totalSuccess || 0,
          totalFailed: smsStats[0]?.totalFailed || 0,
          history: smsHistory,
        },
      },
      content: {
        posts: {
          total: postStats[0]?.total || 0,
          public: postStats[0]?.public || 0,
          private: postStats[0]?.private || 0,
          pinned: postStats[0]?.pinned || 0,
          topEngaged: postEngagement,
        },
        events: {
          total: eventStats[0]?.total || 0,
          upcoming: eventStats[0]?.upcoming || 0,
          past: eventStats[0]?.past || 0,
          public: eventStats[0]?.public || 0,
          private: eventStats[0]?.private || 0,
          upcomingList: upcomingEvents,
        },
        files: {
          total: fileStats[0]?.total || 0,
          public: fileStats[0]?.public || 0,
          private: fileStats[0]?.private || 0,
          totalSize: fileStats[0]?.totalSize || 0,
        },
      },
      engagement: {
        activity: {
          last30Days: activityStats[0]?.total || 0,
          signIns: activityStats[0]?.signIns || 0,
          uniqueUsers: activityStats[0]?.uniqueUsers || 0,
          byDay: activityByDay,
          recent: recentActivity,
        },
        elections: {
          total: electionStats[0]?.total || 0,
          draft: electionStats[0]?.draft || 0,
          active: electionStats[0]?.active || 0,
          closed: electionStats[0]?.closed || 0,
          participation: electionParticipation,
        },
      },
      operations: {
        grievances: {
          total: grievanceStats[0]?.total || 0,
          open: grievanceStats[0]?.open || 0,
          resolved: grievanceStats[0]?.resolved || 0,
          archived: grievanceStats[0]?.archived || 0,
          byStatus: grievancesByStatus,
        },
        dues: {
          total: duesStats[0]?.total || 0,
          paid: duesStats[0]?.paid || 0,
          unpaid: duesStats[0]?.unpaid || 0,
          partial: duesStats[0]?.partial || 0,
          waived: duesStats[0]?.waived || 0,
          totalOwed: duesStats[0]?.totalOwed || 0,
          totalCollected: duesStats[0]?.totalCollected || 0,
          collectionRate: duesStats[0]?.totalOwed
            ? Math.round(((duesStats[0]?.totalCollected || 0) / duesStats[0]?.totalOwed) * 100)
            : 0,
        },
        strikes: {
          total: strikeStats[0]?.total || 0,
          preparing: strikeStats[0]?.preparing || 0,
          active: strikeStats[0]?.active || 0,
          resolved: strikeStats[0]?.resolved || 0,
        },
        announcements: {
          total: announcementStats[0]?.total || 0,
          active: announcementStats[0]?.active || 0,
          popup: announcementStats[0]?.popup || 0,
          banner: announcementStats[0]?.banner || 0,
        },
        meetings: {
          total: meetingStats[0]?.total || 0,
          scheduled: meetingStats[0]?.scheduled || 0,
          completed: meetingStats[0]?.completed || 0,
          cancelled: meetingStats[0]?.cancelled || 0,
        },
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

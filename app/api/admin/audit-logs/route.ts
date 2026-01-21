import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  massEmails,
  emailLogs,
  massSMS,
  smsLogs,
  elections,
  electionVotes,
  activityLogs,
  users,
  unions,
  members
} from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user || user.role !== 'webmaster') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const unionIdParam = searchParams.get('unionId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const unionId = unionIdParam ? parseInt(unionIdParam) : null;

    let dateConditions: any[] = [];
    if (startDate) {
      dateConditions.push(gte(sql`created_at`, new Date(startDate)));
    }
    if (endDate) {
      dateConditions.push(lte(sql`created_at`, new Date(endDate)));
    }

    const results: any = {};

    // Fetch email logs
    if (type === 'all' || type === 'email') {
      const emailConditions: any[] = [];
      if (unionId) {
        emailConditions.push(eq(massEmails.unionId, unionId));
      }

      const emails = await db
        .select({
          id: massEmails.id,
          unionId: massEmails.unionId,
          unionName: unions.name,
          unionLocalNumber: unions.localNumber,
          subject: massEmails.subject,
          recipientFilter: massEmails.recipientFilter,
          status: massEmails.status,
          totalRecipients: massEmails.totalRecipients,
          successCount: massEmails.successCount,
          failureCount: massEmails.failureCount,
          createdAt: massEmails.createdAt,
          sentAt: massEmails.sentAt,
          createdByName: users.name,
          createdByEmail: users.email,
        })
        .from(massEmails)
        .leftJoin(unions, eq(massEmails.unionId, unions.id))
        .leftJoin(users, eq(massEmails.createdBy, users.id))
        .where(emailConditions.length > 0 ? and(...emailConditions) : undefined)
        .orderBy(desc(massEmails.createdAt))
        .limit(limit)
        .offset(offset);

      results.emails = emails;
    }

    // Fetch SMS logs
    if (type === 'all' || type === 'sms') {
      const smsConditions: any[] = [];
      if (unionId) {
        smsConditions.push(eq(massSMS.unionId, unionId));
      }

      const sms = await db
        .select({
          id: massSMS.id,
          unionId: massSMS.unionId,
          unionName: unions.name,
          unionLocalNumber: unions.localNumber,
          message: massSMS.message,
          recipientFilter: massSMS.recipientFilter,
          status: massSMS.status,
          totalRecipients: massSMS.totalRecipients,
          successCount: massSMS.successCount,
          failureCount: massSMS.failureCount,
          createdAt: massSMS.createdAt,
          sentAt: massSMS.sentAt,
          createdByName: users.name,
          createdByEmail: users.email,
        })
        .from(massSMS)
        .leftJoin(unions, eq(massSMS.unionId, unions.id))
        .leftJoin(users, eq(massSMS.createdBy, users.id))
        .where(smsConditions.length > 0 ? and(...smsConditions) : undefined)
        .orderBy(desc(massSMS.createdAt))
        .limit(limit)
        .offset(offset);

      results.sms = sms;
    }

    // Fetch election logs
    if (type === 'all' || type === 'elections') {
      const electionConditions: any[] = [];
      if (unionId) {
        electionConditions.push(eq(elections.unionId, unionId));
      }

      const electionData = await db
        .select({
          id: elections.id,
          unionId: elections.unionId,
          unionName: unions.name,
          unionLocalNumber: unions.localNumber,
          title: elections.title,
          description: elections.description,
          status: elections.status,
          startDate: elections.openTime,
          endDate: elections.closeTime,
          createdAt: elections.createdAt,
          createdByName: users.name,
          createdByEmail: users.email,
          totalVotes: sql<number>`(SELECT COUNT(*) FROM election_votes WHERE election_id = ${elections.id})`,
        })
        .from(elections)
        .leftJoin(unions, eq(elections.unionId, unions.id))
        .leftJoin(users, eq(elections.createdBy, users.id))
        .where(electionConditions.length > 0 ? and(...electionConditions) : undefined)
        .orderBy(desc(elections.createdAt))
        .limit(limit)
        .offset(offset);

      results.elections = electionData;
    }

    // Fetch activity logs
    if (type === 'all' || type === 'activity') {
      const activityConditions: any[] = [];
      if (unionId) {
        activityConditions.push(eq(activityLogs.unionId, unionId));
      }

      const activities = await db
        .select({
          id: activityLogs.id,
          unionId: activityLogs.unionId,
          unionName: unions.name,
          unionLocalNumber: unions.localNumber,
          action: activityLogs.action,
          timestamp: activityLogs.timestamp,
          ipAddress: activityLogs.ipAddress,
          userName: users.name,
          userEmail: users.email,
        })
        .from(activityLogs)
        .leftJoin(unions, eq(activityLogs.unionId, unions.id))
        .leftJoin(users, eq(activityLogs.userId, users.id))
        .where(activityConditions.length > 0 ? and(...activityConditions) : undefined)
        .orderBy(desc(activityLogs.timestamp))
        .limit(limit)
        .offset(offset);

      results.activities = activities;
    }

    // Fetch all unions for filter dropdown
    const allUnions = await db
      .select({
        id: unions.id,
        name: unions.name,
        localNumber: unions.localNumber,
        slug: unions.slug,
      })
      .from(unions)
      .orderBy(unions.name);

    return NextResponse.json({
      ...results,
      unions: allUnions,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members, picketZones, strikeAnnouncements, strikeIncidents, strikeResources } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unionId = searchParams.get('unionId');
    const status = searchParams.get('status');

    if (!unionId) {
      return NextResponse.json(
        { error: 'unionId is required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, parseInt(unionId)),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be an approved member to view strikes' },
        { status: 403 }
      );
    }

    // Build query with optional status filter
    const strikesList = await db.query.strikes.findMany({
      where: status
        ? and(eq(strikes.unionId, parseInt(unionId)), eq(strikes.status, status))
        : eq(strikes.unionId, parseInt(unionId)),
      with: {
        zones: {
          where: eq(picketZones.isActive, true),
        },
        announcements: {
          orderBy: [desc(strikeAnnouncements.createdAt)],
          limit: 5,
        },
        incidents: {
          orderBy: [desc(strikeIncidents.createdAt)],
          limit: 5,
        },
        resources: {
          orderBy: [strikeResources.sortOrder],
        },
        createdBy: {
          columns: { id: true, name: true, email: true }
        },
      },
      orderBy: [desc(strikes.createdAt)],
    });

    return NextResponse.json({
      success: true,
      strikes: strikesList,
      isAdmin: membership.role === 'admin' || membership.role === 'owner'
    });
  } catch (error) {
    console.error('Error fetching strikes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

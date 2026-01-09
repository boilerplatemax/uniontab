import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { getSMSUsage } from '@/lib/sms/limits';

export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unionId from query params
    const { searchParams } = new URL(request.url);
    const unionIdParam = searchParams.get('unionId');

    if (!unionIdParam) {
      return NextResponse.json(
        { error: 'unionId is required' },
        { status: 400 }
      );
    }

    const unionId = parseInt(unionIdParam);

    if (isNaN(unionId)) {
      return NextResponse.json(
        { error: 'Invalid unionId' },
        { status: 400 }
      );
    }

    // Check if the requesting user is a member of the union and is owner/admin
    const [requestingMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.unionId, unionId),
          eq(members.userId, user.id)
        )
      )
      .limit(1);

    if (!requestingMember) {
      return NextResponse.json(
        { error: 'You are not a member of this union' },
        { status: 403 }
      );
    }

    if (requestingMember.role !== 'owner' && requestingMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only union owners and admins can access SMS features' },
        { status: 403 }
      );
    }

    // Get SMS usage
    const usage = await getSMSUsage(unionId);

    return NextResponse.json({
      success: true,
      usage: {
        hasAccess: usage.hasAccess,
        limit: usage.limit,
        used: usage.used,
        remaining: usage.remaining,
        percentUsed: usage.percentUsed,
        resetDate: usage.resetDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting SMS usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

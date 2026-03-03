import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { unions, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.userId, user.id), eq(members.status, 'approved')))
      .limit(1);

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fileThumbnailsEnabled } = body;

    if (typeof fileThumbnailsEnabled !== 'boolean') {
      return NextResponse.json({ error: 'fileThumbnailsEnabled must be a boolean' }, { status: 400 });
    }

    await db
      .update(unions)
      .set({ fileThumbnailsEnabled })
      .where(eq(unions.id, membership.unionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating file thumbnail settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

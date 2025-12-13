import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { strikes, members } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      unionId,
      title,
      description,
      rules,
      startDate,
      endDate,
      status,
    } = await request.json();

    if (!unionId || !title || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields: unionId, title, and startDate are required' },
        { status: 400 }
      );
    }

    // Check if user is an admin or owner of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(
        eq(members.unionId, unionId),
        eq(members.userId, user.id),
        eq(members.status, 'approved')
      ))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return NextResponse.json(
        { error: 'Only admins can create strikes' },
        { status: 403 }
      );
    }

    // Create the strike
    const [newStrike] = await db
      .insert(strikes)
      .values({
        unionId,
        title,
        description: description || null,
        rules: rules || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'preparing',
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json({ success: true, strike: newStrike });
  } catch (error) {
    console.error('Error creating strike:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

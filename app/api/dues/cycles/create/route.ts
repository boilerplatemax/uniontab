import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { duesCycles, members } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      unionId,
      name,
      periodStart,
      periodEnd,
      amountDue,
      dueDate,
      gracePeriodDays,
      isRecurring,
      recurrenceType,
      notes,
    } = body;

    // Validate required fields
    if (!unionId || !name || !periodStart || !periodEnd || !amountDue || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is an owner or admin of the union
    const [membership] = await db
      .select()
      .from(members)
      .where(and(eq(members.unionId, unionId), eq(members.userId, user.id)))
      .limit(1);

    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only union owners and admins can create dues cycles' },
        { status: 403 }
      );
    }

    // Create the dues cycle
    const [newCycle] = await db
      .insert(duesCycles)
      .values({
        unionId,
        name,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        amountDue,
        dueDate: new Date(dueDate),
        gracePeriodDays: gracePeriodDays || 30,
        isRecurring: isRecurring || false,
        recurrenceType: isRecurring ? recurrenceType : null,
        notes,
        createdBy: user.id,
        status: 'draft', // Start as draft
      })
      .returning();

    return NextResponse.json({ success: true, cycle: newCycle });
  } catch (error) {
    console.error('Error creating dues cycle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
